import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getSupabaseConfig } from "./env";

const result = getSupabaseConfig();

if (!result.ok) {
  console.warn(
    `[supabase] Missing config: ${result.missing.join(", ")}. ` +
      `App will render the setup screen until Supabase env vars are provided.`,
  );
}

/**
 * Supabase client. If config is missing we create a placeholder client with
 * dummy URL/key so that simply importing this module never throws. Any actual
 * call (auth, query) will fail – but the app will already have shown the
 * setup screen instead of getting that far.
 */
export const supabase: SupabaseClient = createClient(
  result.ok ? result.config.url : "https://placeholder.supabase.co",
  result.ok ? result.config.anonKey : "placeholder-anon-key",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: result.ok,
      persistSession: result.ok,
      detectSessionInUrl: Platform.OS === "web",
    },
  },
);

export { getSupabaseConfig, isSupabaseConfigured } from "./env";
