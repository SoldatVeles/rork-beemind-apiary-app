import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import Constants from "expo-constants";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { supabase } from "@/lib/supabase";

export const trpc = createTRPCReact<AppRouter>();

type ExpoGoExtra = {
  expoGo?: {
    developer?: {
      host?: string;
    };
  };
};

const stripTrailingSlash = (value: string) =>
  value.endsWith("/") ? value.slice(0, -1) : value;

const parseHostname = (input?: string | null): string | null => {
  if (!input) {
    return null;
  }

  const normalized = (() => {
    if (input.startsWith("exp")) {
      return input.replace(/^exp(\+.*)?:\/\//, "http://");
    }

    if (input.startsWith("ws")) {
      return input.replace(/^ws(\+.*)?:\/\//, "http://");
    }

    if (!input.startsWith("http://") && !input.startsWith("https://")) {
      return `http://${input}`;
    }

    return input;
  })();

  try {
    return new URL(normalized).hostname;
  } catch {
    const sanitized = normalized.replace(/^[a-z]+:\/\//, "");
    const [hostPart] = sanitized.split("/");
    const [hostname] = hostPart.split(":");
    return hostname || null;
  }
};

const isLocalHostname = (hostname: string) => {
  if (!hostname) {
    return false;
  }

  if (hostname === "localhost" || hostname.startsWith("127.")) {
    return true;
  }

  if (hostname.startsWith("10.")) {
    return true;
  }

  if (hostname.startsWith("192.168.")) {
    return true;
  }

  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)) {
    return true;
  }

  return hostname.endsWith(".local");
};

const getDevServerBaseUrl = (): string | null => {
  const legacyManifest = Constants.manifest as { debuggerHost?: string } | null;
  const manifest2 = Constants.manifest2 as
    | ({ hostUri?: string; extra?: ExpoGoExtra })
    | null;
  const manifest2Extra = manifest2?.extra as ExpoGoExtra | undefined;

  const hostCandidates = [
    Constants.expoConfig?.hostUri,
    manifest2?.hostUri,
    manifest2Extra?.expoGo?.developer?.host,
    legacyManifest?.debuggerHost,
  ];

  for (const candidate of hostCandidates) {
    const hostname = parseHostname(candidate ?? null);
    if (hostname) {
      return isLocalHostname(hostname)
        ? `http://${hostname}:8787`
        : `https://${hostname}`;
    }
  }

  return null;
};

const getBaseUrl = () => {
  const expoExtra = Constants.expoConfig?.extra as
    | Record<string, unknown>
    | undefined;
  const manifestExtra = Constants.manifest2?.extra as
    | Record<string, unknown>
    | undefined;

  const envUrl =
    process.env.EXPO_PUBLIC_RORK_API_BASE_URL ||
    (expoExtra?.apiUrl as string | undefined) ||
    (manifestExtra?.apiUrl as string | undefined);

  if (envUrl) {
    return stripTrailingSlash(envUrl);
  }

  const devServerUrl = getDevServerBaseUrl();
  if (devServerUrl) {
    return devServerUrl;
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return "http://127.0.0.1:8787";
};

const API_BASE_URL = getBaseUrl();
console.log("[tRPC] API base URL:", API_BASE_URL);

const REQUEST_TIMEOUT_MS = 45000;
const MAX_FETCH_RETRIES = 2;

const performTimedFetch = async (
  url: RequestInfo | URL,
  options?: RequestInit
): Promise<Response> => {
  if (typeof AbortController === "undefined") {
    return fetch(url, options);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const { signal: originalSignal, ...restOptions } = options ?? {};

  if (originalSignal) {
    if (originalSignal.aborted) {
      controller.abort();
    } else {
      const abortHandler = () => {
        controller.abort();
        originalSignal.removeEventListener("abort", abortHandler);
      };
      originalSignal.addEventListener("abort", abortHandler);
    }
  }

  try {
    return await fetch(url, {
      ...restOptions,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const fetchWithResilience = async (
  url: RequestInfo | URL,
  options?: RequestInit
): Promise<Response> => {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= MAX_FETCH_RETRIES) {
    try {
      const response = await performTimedFetch(url, options);
      return response;
    } catch (error) {
      lastError = error;
      const errorName = (error as Error).name;
      const isRetryable = errorName === "AbortError" || errorName === "TypeError";

      if (!isRetryable || attempt === MAX_FETCH_RETRIES) {
        console.error("[tRPC] Network request failed", {
          attempt,
          error: error instanceof Error ? error.message : error,
        });
        throw error;
      }

      const backoffDelay = 300 * 2 ** attempt;
      console.warn("[tRPC] Request retrying", { attempt: attempt + 1, backoffDelay });
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));
    }

    attempt += 1;
  }

  throw lastError ?? new Error("[tRPC] Unknown network failure");
};

export const createTrpcClient = () => {
  return trpc.createClient({
    links: [
      httpLink({
        url: `${API_BASE_URL}/api/trpc`,
        transformer: superjson,
        async headers() {
          try {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            return {
              authorization: session?.access_token
                ? `Bearer ${session.access_token}`
                : "",
            };
          } catch (error) {
            console.error("[tRPC] Error getting session:", error);
            return {
              authorization: "",
            };
          }
        },
        async fetch(url, options) {
          return fetchWithResilience(url, options);
        },
      }),
    ],
  });
};

export const trpcClient = createTrpcClient();
