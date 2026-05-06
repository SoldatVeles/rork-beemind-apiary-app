import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

const PRO_STORAGE_KEY = "@beemind_is_pro";

export const FREE_HIVE_LIMIT = 3;

export type ProFeature =
  | "unlimited_hives"
  | "export_reports"
  | "advanced_stats"
  | "full_history";

/**
 * Pro status store. Currently uses AsyncStorage as a temporary fallback
 * until real payments (Stripe / RevenueCat) are wired in.
 */
export const [ProProvider, usePro] = createContextHook(() => {
  const [isPro, setIsPro] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(PRO_STORAGE_KEY);
        if (!cancelled && stored === "true") {
          setIsPro(true);
        }
      } catch (error) {
        console.log("[Pro] failed to load pro status", error);
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setProStatus = useCallback(async (value: boolean) => {
    try {
      setIsPro(value);
      await AsyncStorage.setItem(PRO_STORAGE_KEY, value ? "true" : "false");
    } catch (error) {
      console.log("[Pro] failed to save pro status", error);
    }
  }, []);

  const togglePro = useCallback(async () => {
    await setProStatus(!isPro);
  }, [isPro, setProStatus]);

  const canCreateHive = useCallback(
    (currentHiveCount: number) => isPro || currentHiveCount < FREE_HIVE_LIMIT,
    [isPro],
  );

  const isFeatureLocked = useCallback(
    (_feature: ProFeature) => !isPro,
    [isPro],
  );

  return useMemo(
    () => ({
      isPro,
      isHydrated,
      setProStatus,
      togglePro,
      canCreateHive,
      isFeatureLocked,
      freeHiveLimit: FREE_HIVE_LIMIT,
    }),
    [isPro, isHydrated, setProStatus, togglePro, canCreateHive, isFeatureLocked],
  );
});
