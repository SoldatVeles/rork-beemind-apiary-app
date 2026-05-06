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

export type EnvDebugInfo = {
  processEnvUrlDefined: boolean;
  processEnvAnonKeyDefined: boolean;
  extraUrlDefined: boolean;
  extraAnonKeyDefined: boolean;
  localUrlDefined: boolean;
  localAnonKeyDefined: boolean;
  publicEnvKeys: string[];
  resolvedFrom: { url: string | null; anonKey: string | null };
};

let debugLogged = false;

/**
 * Collect a snapshot of all sources we look at for Supabase env vars,
 * without ever leaking the actual key values.
 */
export function getEnvDebugInfo(): EnvDebugInfo {
  const extra = readExtra();
  const publicEnvKeys = Object.keys(process.env ?? {})
    .filter((k) => k.startsWith("EXPO_PUBLIC_"))
    .sort();

  const resolvedFrom: { url: string | null; anonKey: string | null } = {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL
      ? "process.env"
      : extra.supabaseUrl
        ? "expoConfig.extra"
        : localEnv.EXPO_PUBLIC_SUPABASE_URL
          ? "env.local"
          : null,
    anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      ? "process.env"
      : extra.supabaseAnonKey
        ? "expoConfig.extra"
        : localEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY
          ? "env.local"
          : null,
  };

  return {
    processEnvUrlDefined: typeof process.env.EXPO_PUBLIC_SUPABASE_URL === "string" && process.env.EXPO_PUBLIC_SUPABASE_URL.length > 0,
    processEnvAnonKeyDefined: typeof process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY === "string" && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.length > 0,
    extraUrlDefined: typeof extra.supabaseUrl === "string" && extra.supabaseUrl.length > 0,
    extraAnonKeyDefined: typeof extra.supabaseAnonKey === "string" && extra.supabaseAnonKey.length > 0,
    localUrlDefined: typeof localEnv.EXPO_PUBLIC_SUPABASE_URL === "string" && (localEnv.EXPO_PUBLIC_SUPABASE_URL?.length ?? 0) > 0,
    localAnonKeyDefined: typeof localEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY === "string" && (localEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY?.length ?? 0) > 0,
    publicEnvKeys,
    resolvedFrom,
  };
}

/**
 * Log a one-time debug dump of env-var visibility. Triggered automatically
 * the first time `getSupabaseConfig()` cannot find EXPO_PUBLIC_SUPABASE_URL
 * via process.env, but also callable from a debug screen.
 */
export function logEnvDebugDump(reason: string): void {
  if (debugLogged) return;
  debugLogged = true;
  const info = getEnvDebugInfo();
  console.log(`[env] debug dump (${reason})`, {
    processEnvUrlDefined: info.processEnvUrlDefined,
    processEnvAnonKeyDefined: info.processEnvAnonKeyDefined,
    extraUrlDefined: info.extraUrlDefined,
    extraAnonKeyDefined: info.extraAnonKeyDefined,
    localUrlDefined: info.localUrlDefined,
    localAnonKeyDefined: info.localAnonKeyDefined,
    resolvedFrom: info.resolvedFrom,
    publicEnvKeys: info.publicEnvKeys,
  });
}

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
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
    logEnvDebugDump("process.env.EXPO_PUBLIC_SUPABASE_URL is undefined");
  }
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
