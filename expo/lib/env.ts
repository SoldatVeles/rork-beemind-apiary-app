import Constants from "expo-constants";

type LocalEnv = {
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
};

/**
 * Try to load `lib/env.local.ts` for local development only.
 * The file is gitignored and optional. We swallow the import error
 * so production / preview builds without it work just fine.
 */
function loadLocalEnv(): LocalEnv {
  if (!__DEV__) return {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("./env.local") as { localEnv?: LocalEnv };
    return mod?.localEnv ?? {};
  } catch {
    return {};
  }
}

const localEnv = loadLocalEnv();

function readExtra(): { supabaseUrl?: string; supabaseAnonKey?: string } {
  const extra =
    (Constants.expoConfig?.extra as Record<string, unknown> | undefined) ??
    (Constants.manifest2?.extra?.expoClient?.extra as
      | Record<string, unknown>
      | undefined) ??
    {};
  return {
    supabaseUrl:
      typeof extra.supabaseUrl === "string" ? extra.supabaseUrl : undefined,
    supabaseAnonKey:
      typeof extra.supabaseAnonKey === "string"
        ? extra.supabaseAnonKey
        : undefined,
  };
}

function pick(...values: (string | undefined | null)[]): string | undefined {
  for (const v of values) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return undefined;
}

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export type ConfigResult =
  | { ok: true; config: SupabaseConfig }
  | { ok: false; missing: string[] };

export function getSupabaseConfig(): ConfigResult {
  const extra = readExtra();
  const url = pick(
    process.env.EXPO_PUBLIC_SUPABASE_URL,
    extra.supabaseUrl,
    localEnv.EXPO_PUBLIC_SUPABASE_URL,
  );
  const anonKey = pick(
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    extra.supabaseAnonKey,
    localEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  );

  const missing: string[] = [];
  if (!url || url.includes("YOUR_PROJECT_ID")) {
    missing.push("EXPO_PUBLIC_SUPABASE_URL");
  }
  if (!anonKey || anonKey.includes("YOUR_SUPABASE_ANON_KEY")) {
    missing.push("EXPO_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (missing.length > 0) {
    return { ok: false, missing };
  }
  return { ok: true, config: { url: url as string, anonKey: anonKey as string } };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().ok;
}
