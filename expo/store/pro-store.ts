import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import Purchases, { type CustomerInfo } from "react-native-purchases";
import {
  configurePurchases,
  fetchCustomerInfo,
  hasProEntitlement,
  isConfigured,
} from "@/lib/revenuecat";

const PRO_STORAGE_KEY = "@beemind_is_pro";
const PRO_DEV_OVERRIDE_KEY = "@beemind_is_pro_dev";

export const FREE_HIVE_LIMIT = 3;

export type ProFeature =
  | "unlimited_hives"
  | "export_reports"
  | "advanced_stats"
  | "full_history";

/**
 * Pro status store. Source of truth is the RevenueCat "pro" entitlement.
 * A dev-mode toggle is preserved for QA: when on, the user is treated as Pro
 * regardless of RevenueCat state.
 */
export const [ProProvider, usePro] = createContextHook(() => {
  const [entitlementPro, setEntitlementPro] = useState<boolean>(false);
  const [devOverride, setDevOverride] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Hydrate cached state + dev override on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cached, dev] = await Promise.all([
          AsyncStorage.getItem(PRO_STORAGE_KEY),
          AsyncStorage.getItem(PRO_DEV_OVERRIDE_KEY),
        ]);
        if (cancelled) return;
        if (cached === "true") setEntitlementPro(true);
        if (dev === "true") setDevOverride(true);
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

  const applyCustomerInfo = useCallback(async (info: CustomerInfo | null) => {
    const isProActive = hasProEntitlement(info);
    setEntitlementPro(isProActive);
    try {
      await AsyncStorage.setItem(PRO_STORAGE_KEY, isProActive ? "true" : "false");
    } catch (error) {
      console.log("[Pro] failed to cache entitlement", error);
    }
  }, []);

  // Initial fetch from RevenueCat + listener for live entitlement changes.
  useEffect(() => {
    if (!isHydrated) return;
    configurePurchases();
    let active = true;

    fetchCustomerInfo().then((info) => {
      if (!active) return;
      void applyCustomerInfo(info);
    });

    if (!isConfigured()) return;

    const listener = (info: CustomerInfo) => {
      void applyCustomerInfo(info);
    };
    try {
      Purchases.addCustomerInfoUpdateListener(listener);
    } catch (error) {
      console.log("[Pro] failed to attach listener", error);
    }

    return () => {
      active = false;
      try {
        Purchases.removeCustomerInfoUpdateListener(listener);
      } catch {}
    };
  }, [isHydrated, applyCustomerInfo]);

  const refreshEntitlement = useCallback(async () => {
    const info = await fetchCustomerInfo();
    await applyCustomerInfo(info);
  }, [applyCustomerInfo]);

  const setDevPro = useCallback(async (value: boolean) => {
    try {
      setDevOverride(value);
      await AsyncStorage.setItem(PRO_DEV_OVERRIDE_KEY, value ? "true" : "false");
    } catch (error) {
      console.log("[Pro] failed to save dev override", error);
    }
  }, []);

  const togglePro = useCallback(async () => {
    await setDevPro(!devOverride);
  }, [devOverride, setDevPro]);

  const isPro = entitlementPro || devOverride;

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
      isDevOverride: devOverride,
      togglePro,
      setDevPro,
      refreshEntitlement,
      canCreateHive,
      isFeatureLocked,
      freeHiveLimit: FREE_HIVE_LIMIT,
    }),
    [isPro, isHydrated, devOverride, togglePro, setDevPro, refreshEntitlement, canCreateHive, isFeatureLocked],
  );
});
