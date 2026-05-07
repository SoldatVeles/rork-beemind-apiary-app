import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Cache strategy:
 * - staleTime: 5 minutes — avoid refetch storms while still letting data
 *   refresh on focus/online when stale.
 * - gcTime: 24h — keep cached data long enough to be useful on cold start.
 * - networkMode: offlineFirst — show cached results immediately when offline.
 *
 * Supabase remains the source of truth: persistence only avoids spinners on
 * cold starts and keeps the app usable without internet.
 */
const FIVE_MINUTES = 1000 * 60 * 5;
const TWENTY_FOUR_HOURS = 1000 * 60 * 60 * 24;

export const PERSIST_CACHE_KEY = "@beemind_rq_cache_v1";
/** Bump when query shapes change in incompatible ways. */
export const PERSIST_BUSTER = "v1";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
      staleTime: FIVE_MINUTES,
      gcTime: TWENTY_FOUR_HOURS,
      networkMode: "offlineFirst",
      refetchOnWindowFocus: false,
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: PERSIST_CACHE_KEY,
  throttleTime: 1000,
});

/**
 * Clear the persisted React Query cache and in-memory cache.
 * Useful from a "Clear cache" debug action or on sign-out.
 */
export async function clearPersistedQueryCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PERSIST_CACHE_KEY);
  } catch (err) {
    console.log("[QueryCache] failed to remove persisted cache", err);
  }
  try {
    queryClient.clear();
  } catch (err) {
    console.log("[QueryCache] failed to clear in-memory cache", err);
  }
}
