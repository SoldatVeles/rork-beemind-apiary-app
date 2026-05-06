import { supabase } from "@/lib/supabase";

/**
 * BeeMind analytics events. Keep this list narrow on purpose:
 * we only track meaningful, successful product actions.
 */
export type AnalyticsEvent =
  | "user_signed_up"
  | "user_logged_in"
  | "yard_created"
  | "hive_created"
  | "inspection_created"
  | "task_created"
  | "harvest_created"
  | "inventory_item_created"
  | "upgrade_clicked"
  | "pro_enabled_dev";

export type AnalyticsData = Record<string, string | number | boolean | null | undefined>;

/**
 * Sanitize event data: drop undefined values and obvious sensitive keys.
 * We never want to log emails, passwords, tokens, or notes content.
 */
const SENSITIVE_KEYS = new Set<string>([
  "email",
  "password",
  "token",
  "access_token",
  "refresh_token",
  "notes",
  "address",
  "lot_code",
  "full_name",
  "name",
]);

function sanitize(data?: AnalyticsData): Record<string, string | number | boolean | null> {
  if (!data) return {};
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (SENSITIVE_KEYS.has(key)) continue;
    out[key] = value as string | number | boolean | null;
  }
  return out;
}

/**
 * Track a meaningful product event. Fire-and-forget: never throws,
 * never blocks the calling action. Only call after a successful action.
 */
export async function trackEvent(
  eventName: AnalyticsEvent,
  data?: AnalyticsData,
): Promise<void> {
  const safeData = sanitize(data);

  if (__DEV__) {
    console.log(`[Analytics] ${eventName}`, safeData);
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id ?? null;

    const { error } = await supabase.from("analytics_events").insert({
      user_id: userId,
      event_name: eventName,
      event_data: safeData,
    });

    if (error && __DEV__) {
      console.log(`[Analytics] insert failed for ${eventName}:`, error.message);
    }
  } catch (err) {
    if (__DEV__) {
      console.log(`[Analytics] unexpected error for ${eventName}:`, err);
    }
  }
}
