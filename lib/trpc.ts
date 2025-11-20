import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import { supabase } from "@/lib/supabase";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
  );
};

const REQUEST_TIMEOUT_MS = 20000;

const fetchWithTimeout = async (
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
  } catch (error) {
    if ((error as Error).name === "AbortError") {
      console.warn("[tRPC] Request aborted after timeout");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const createTrpcClient = () => {
  return trpc.createClient({
    links: [
      httpLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        async headers() {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            return {
              authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
            };
          } catch (error) {
            console.error('[tRPC] Error getting session:', error);
            return {
              authorization: "",
            };
          }
        },
        async fetch(url, options) {
          return fetchWithTimeout(url, options);
        },
      }),
    ],
  });
};

export const trpcClient = createTrpcClient();
