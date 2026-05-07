import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "@beemind_cache_v1:";

/**
 * Persist a successful query result so it can be served when offline.
 */
export async function writeCache<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.log("[Cache] write failed", key, err);
  }
}

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.log("[Cache] read failed", key, err);
    return null;
  }
}

export async function clearAllCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((k) => k.startsWith(PREFIX));
    if (ours.length > 0) {
      await AsyncStorage.multiRemove(ours);
    }
  } catch (err) {
    console.log("[Cache] clear failed", err);
  }
}
