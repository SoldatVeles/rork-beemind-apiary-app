import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "@beemind_offline_queue_v1";
const META_KEY = "@beemind_sync_meta_v1";

export type QueueableTable =
  | "inspections"
  | "tasks"
  | "harvests"
  | "inventory_items";

export interface QueuedOperation {
  id: string;
  table: QueueableTable;
  payload: Record<string, unknown>;
  created_at: string;
  attempts: number;
  last_error?: string;
}

export interface SyncMeta {
  last_sync_at?: string;
  last_status?: "success" | "failure";
}

function makeId(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) {
    try {
      return g.crypto.randomUUID();
    } catch {
      // ignore
    }
  }
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function readQueue(): Promise<QueuedOperation[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedOperation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.log("[OfflineQueue] read failed", err);
    return [];
  }
}

async function writeQueue(items: QueuedOperation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch (err) {
    console.log("[OfflineQueue] write failed", err);
  }
}

export async function enqueue(
  table: QueueableTable,
  payload: Record<string, unknown>,
): Promise<QueuedOperation> {
  const op: QueuedOperation = {
    id: makeId(),
    table,
    payload,
    created_at: new Date().toISOString(),
    attempts: 0,
  };
  const current = await readQueue();
  current.push(op);
  await writeQueue(current);
  return op;
}

export async function removeFromQueue(id: string): Promise<void> {
  const current = await readQueue();
  await writeQueue(current.filter((op) => op.id !== id));
}

export async function updateQueueItem(
  id: string,
  patch: Partial<QueuedOperation>,
): Promise<void> {
  const current = await readQueue();
  const next = current.map((op) => (op.id === id ? { ...op, ...patch } : op));
  await writeQueue(next);
}

export async function clearQueue(): Promise<void> {
  await writeQueue([]);
}

export async function readMeta(): Promise<SyncMeta> {
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SyncMeta;
  } catch {
    return {};
  }
}

export async function writeMeta(meta: SyncMeta): Promise<void> {
  try {
    await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch (err) {
    console.log("[OfflineQueue] meta write failed", err);
  }
}
