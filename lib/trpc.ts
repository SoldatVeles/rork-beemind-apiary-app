import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import Constants from "expo-constants";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { supabase } from "@/lib/supabase";

export const trpc = createTRPCReact<AppRouter>();

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
    return envUrl;
  }

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return "http://127.0.0.1:8787";
};

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
        url: `${getBaseUrl()}/api/trpc`,
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
