import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";
import createContextHook from "@nkzw/create-context-hook";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  readQueue,
  removeFromQueue,
  updateQueueItem,
  readMeta,
  writeMeta,
  type QueuedOperation,
} from "@/lib/offline-queue";

export type ConnectionStatus = "online" | "offline" | "syncing" | "error";

const QUERY_KEY_BY_TABLE: Record<string, string> = {
  inspections: "inspections",
  tasks: "tasks",
  harvests: "harvests",
  inventory_items: "inventory",
};

async function pingSupabase(): Promise<boolean> {
  try {
    if (Platform.OS === "web") {
      const nav = (globalThis as { navigator?: { onLine?: boolean } }).navigator;
      if (nav && nav.onLine === false) return false;
    }
    const { error } = await supabase
      .from("yards")
      .select("id", { count: "exact", head: true })
      .limit(1);
    if (error) {
      // PostgREST error still implies network reach
      const msg = error.message?.toLowerCase() ?? "";
      if (msg.includes("network") || msg.includes("failed to fetch")) {
        return false;
      }
      return true;
    }
    return true;
  } catch {
    return false;
  }
}

async function flushQueueOnce(): Promise<{ ok: number; failed: number; remaining: number }> {
  const items = await readQueue();
  let ok = 0;
  let failed = 0;
  for (const op of items) {
    const { error } = await supabase.from(op.table).insert(op.payload);
    if (error) {
      failed += 1;
      await updateQueueItem(op.id, {
        attempts: op.attempts + 1,
        last_error: error.message,
      });
      if (__DEV__) {
        console.log(`[Sync] retry failed for ${op.table}:`, error.message);
      }
    } else {
      ok += 1;
      await removeFromQueue(op.id);
    }
  }
  const remaining = (await readQueue()).length;
  return { ok, failed, remaining };
}

export const [SyncProvider, useSync] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ConnectionStatus>("online");
  const [queueCount, setQueueCount] = useState<number>(0);
  const [lastSyncAt, setLastSyncAt] = useState<string | undefined>(undefined);
  const [lastError, setLastError] = useState<string | undefined>(undefined);
  const isFlushingRef = useRef<boolean>(false);

  const refreshQueueCount = useCallback(async () => {
    const items = await readQueue();
    setQueueCount(items.length);
  }, []);

  const sync = useCallback(async (): Promise<void> => {
    if (isFlushingRef.current) return;
    isFlushingRef.current = true;
    try {
      const items = await readQueue();
      setQueueCount(items.length);

      const online = await pingSupabase();
      if (!online) {
        setStatus("offline");
        return;
      }

      if (items.length === 0) {
        setStatus("online");
        return;
      }

      setStatus("syncing");
      const result = await flushQueueOnce();
      setQueueCount(result.remaining);

      const tablesAffected = new Set<string>(items.map((i: QueuedOperation) => i.table));
      tablesAffected.forEach((t) => {
        const key = QUERY_KEY_BY_TABLE[t];
        if (key) queryClient.invalidateQueries({ queryKey: [key] });
      });

      const now = new Date().toISOString();
      if (result.failed > 0) {
        setStatus("error");
        setLastError(`${result.failed} item(s) failed to sync`);
        await writeMeta({ last_sync_at: now, last_status: "failure" });
      } else {
        setStatus("online");
        setLastError(undefined);
        await writeMeta({ last_sync_at: now, last_status: "success" });
      }
      setLastSyncAt(now);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown sync error";
      setStatus("error");
      setLastError(msg);
      if (__DEV__) console.log("[Sync] error", err);
    } finally {
      isFlushingRef.current = false;
    }
  }, [queryClient]);

  // Hydrate meta + queue count
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const meta = await readMeta();
      const items = await readQueue();
      if (cancelled) return;
      setLastSyncAt(meta.last_sync_at);
      setQueueCount(items.length);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Initial sync + periodic
  useEffect(() => {
    sync();
    const interval = setInterval(() => {
      sync();
    }, 30000);
    return () => clearInterval(interval);
  }, [sync]);

  // App foreground triggers sync
  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      if (state === "active") {
        sync();
      }
    };
    const sub = AppState.addEventListener("change", handler);
    return () => sub.remove();
  }, [sync]);

  // Web online/offline events
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const w = globalThis as unknown as {
      addEventListener?: (e: string, h: () => void) => void;
      removeEventListener?: (e: string, h: () => void) => void;
    };
    if (!w.addEventListener) return;
    const onOnline = () => sync();
    const onOffline = () => setStatus("offline");
    w.addEventListener("online", onOnline);
    w.addEventListener("offline", onOffline);
    return () => {
      w.removeEventListener?.("online", onOnline);
      w.removeEventListener?.("offline", onOffline);
    };
  }, [sync]);

  const retry = useCallback(async () => {
    await sync();
  }, [sync]);

  const markOffline = useCallback(() => {
    setStatus("offline");
  }, []);

  const notifyEnqueued = useCallback(async () => {
    await refreshQueueCount();
    setStatus("offline");
  }, [refreshQueueCount]);

  return useMemo(
    () => ({
      status,
      queueCount,
      lastSyncAt,
      lastError,
      retry,
      sync,
      markOffline,
      notifyEnqueued,
    }),
    [status, queueCount, lastSyncAt, lastError, retry, sync, markOffline, notifyEnqueued],
  );
});
