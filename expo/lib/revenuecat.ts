import { Platform } from "react-native";
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  LOG_LEVEL,
} from "react-native-purchases";

/**
 * RevenueCat client integration for BeeMind.
 *
 * - Configured once at module load (not inside a component/useEffect).
 * - Uses the Test Store key on web and __DEV__ builds.
 * - Uses platform-native keys on production iOS/Android builds.
 */

export const PRO_ENTITLEMENT_ID = "pro" as const;
export const DEFAULT_OFFERING_ID = "default" as const;

function getRCToken(): string | undefined {
  if (__DEV__ || Platform.OS === "web") {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY,
  });
}

let configured = false;

/**
 * Configure the Purchases SDK exactly once.
 * Safe to call multiple times — no-op after the first successful call.
 */
export function configurePurchases(): boolean {
  if (configured) return true;
  const apiKey = getRCToken();
  if (!apiKey) {
    if (__DEV__) {
      console.log("[RC] no API key available for platform", Platform.OS);
    }
    return false;
  }
  try {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.WARN);
    }
    Purchases.configure({ apiKey });
    configured = true;
    if (__DEV__) console.log("[RC] configured");
    return true;
  } catch (error) {
    console.log("[RC] configure failed", error);
    return false;
  }
}

export function isConfigured(): boolean {
  return configured;
}

/** Identify the current Supabase user inside RevenueCat. */
export async function loginUser(userId: string): Promise<void> {
  if (!configurePurchases()) return;
  try {
    await Purchases.logIn(userId);
  } catch (error) {
    console.log("[RC] logIn failed", error);
  }
}

export async function logoutUser(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch (error) {
    console.log("[RC] logOut failed", error);
  }
}

export function hasProEntitlement(info: CustomerInfo | null | undefined): boolean {
  if (!info) return false;
  return info.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
}

export async function fetchCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configurePurchases()) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.log("[RC] getCustomerInfo failed", error);
    return null;
  }
}

export async function fetchCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!configurePurchases()) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? offerings.all[DEFAULT_OFFERING_ID] ?? null;
  } catch (error) {
    console.log("[RC] getOfferings failed", error);
    return null;
  }
}

// Configure immediately on module import — top-level, not inside a hook.
configurePurchases();
