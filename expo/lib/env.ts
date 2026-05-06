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

const PLACEHOLDER_FRAGMENTS = [
  "YOUR_PROJECT_ID",
  "YOUR_SUPABASE_ANON_KEY",
  "YOUR_PUBLIC_ANON_KEY",
  "your-project",
  "your_project",
  "placeholder",
];

function isPlaceholder(value: string): boolean {
  const v = value.toLowerCase();
  return PLACEHOLDER_FRAGMENTS.some((p) => v.includes(p.toLowerCase()));
}

function normalize(value: string | undefined | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().replace(/^['"]|['"]$/g, "");
  return trimmed.length > 0 ? trimmed : undefined;
}

export type ValidationIssue = {
  variable: "EXPO_PUBLIC_SUPABASE_URL" | "EXPO_PUBLIC_SUPABASE_ANON_KEY";
  reason: "missing" | "placeholder" | "invalid_format";
  message: string;
};

function validateUrl(raw: string | undefined): ValidationIssue | null {
  if (!raw) {
    return {
      variable: "EXPO_PUBLIC_SUPABASE_URL",
      reason: "missing",
      message: "EXPO_PUBLIC_SUPABASE_URL is not set.",
    };
  }
  if (isPlaceholder(raw)) {
    return {
      variable: "EXPO_PUBLIC_SUPABASE_URL",
      reason: "placeholder",
      message:
        "EXPO_PUBLIC_SUPABASE_URL still contains a placeholder value (e.g. YOUR_PROJECT_ID).",
    };
  }
  if (!raw.startsWith("https://")) {
    return {
      variable: "EXPO_PUBLIC_SUPABASE_URL",
      reason: "invalid_format",
      message: "EXPO_PUBLIC_SUPABASE_URL must start with https://",
    };
  }
  if (!raw.includes(".supabase.co") && !raw.includes(".supabase.in")) {
    return {
      variable: "EXPO_PUBLIC_SUPABASE_URL",
      reason: "invalid_format",
      message: "EXPO_PUBLIC_SUPABASE_URL must include .supabase.co",
    };
  }
  return null;
}

function validateAnonKey(raw: string | undefined): ValidationIssue | null {
  if (!raw) {
    return {
      variable: "EXPO_PUBLIC_SUPABASE_ANON_KEY",
      reason: "missing",
      message: "EXPO_PUBLIC_SUPABASE_ANON_KEY is not set.",
    };
  }
  if (isPlaceholder(raw)) {
    return {
      variable: "EXPO_PUBLIC_SUPABASE_ANON_KEY",
      reason: "placeholder",
      message:
        "EXPO_PUBLIC_SUPABASE_ANON_KEY still contains a placeholder value.",
    };
  }
  if (raw.length < 20) {
    return {
      variable: "EXPO_PUBLIC_SUPABASE_ANON_KEY",
      reason: "invalid_format",
      message: "EXPO_PUBLIC_SUPABASE_ANON_KEY looks too short to be valid.",
    };
  }
  return null;
}

export type EnvDebugInfo = {
  processEnvUrlDefined: boolean;
  processEnvAnonKeyDefined: boolean;
  extraUrlDefined: boolean;
  extraAnonKeyDefined: boolean;
  localUrlDefined: boolean;
  localAnonKeyDefined: boolean;
  publicEnvKeys: string[];
  resolvedFrom: { url: string | null; anonKey: string | null };
  resolvedUrlPreview: string | null;
  resolvedAnonKeyPreview: string | null;
  trimmedUrlLength: number;
  trimmedAnonKeyLength: number;
};

let debugLogged = false;

function maskUrl(value: string | undefined): string | null {
  if (!value) return null;
  return value.length > 40 ? `${value.slice(0, 30)}...` : value;
}

function maskKey(value: string | undefined): string | null {
  if (!value) return null;
  if (value.length <= 12) return `${value.length} chars`;
  return `${value.slice(0, 6)}...${value.slice(-4)} (${value.length} chars)`;
}

export function getEnvDebugInfo(): EnvDebugInfo {
  const extra = readExtra();
  const publicEnvKeys = Object.keys(process.env ?? {})
    .filter((k) => k.startsWith("EXPO_PUBLIC_"))
    .sort();

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

  const resolvedFrom: { url: string | null; anonKey: string | null } = {
    url: normalize(process.env.EXPO_PUBLIC_SUPABASE_URL)
      ? "process.env"
      : normalize(extra.supabaseUrl)
        ? "expoConfig.extra"
        : normalize(localEnv.EXPO_PUBLIC_SUPABASE_URL)
          ? "env.local"
          : null,
    anonKey: normalize(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)
      ? "process.env"
      : normalize(extra.supabaseAnonKey)
        ? "expoConfig.extra"
        : normalize(localEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY)
          ? "env.local"
          : null,
  };

  return {
    processEnvUrlDefined: !!normalize(process.env.EXPO_PUBLIC_SUPABASE_URL),
    processEnvAnonKeyDefined: !!normalize(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
    extraUrlDefined: !!normalize(extra.supabaseUrl),
    extraAnonKeyDefined: !!normalize(extra.supabaseAnonKey),
    localUrlDefined: !!normalize(localEnv.EXPO_PUBLIC_SUPABASE_URL),
    localAnonKeyDefined: !!normalize(localEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY),
    publicEnvKeys,
    resolvedFrom,
    resolvedUrlPreview: maskUrl(url),
    resolvedAnonKeyPreview: maskKey(anonKey),
    trimmedUrlLength: url?.length ?? 0,
    trimmedAnonKeyLength: anonKey?.length ?? 0,
  };
}

export function logEnvDebugDump(reason: string): void {
  if (debugLogged || !__DEV__) return;
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
    resolvedUrlPreview: info.resolvedUrlPreview,
    resolvedAnonKeyPreview: info.resolvedAnonKeyPreview,
    trimmedUrlLength: info.trimmedUrlLength,
    trimmedAnonKeyLength: info.trimmedAnonKeyLength,
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
    const n = normalize(v);
    if (n) return n;
  }
  return undefined;
}

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export type ConfigResult =
  | { ok: true; config: SupabaseConfig }
  | { ok: false; missing: string[]; issues: ValidationIssue[] };

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

  const issues: ValidationIssue[] = [];
  const urlIssue = validateUrl(url);
  if (urlIssue) issues.push(urlIssue);
  const anonIssue = validateAnonKey(anonKey);
  if (anonIssue) issues.push(anonIssue);

  if (issues.length > 0) {
    if (__DEV__) {
      logEnvDebugDump("validation failed");
      console.log("[env] validation issues", issues);
    }
    return {
      ok: false,
      missing: issues.map((i) => i.variable),
      issues,
    };
  }

  if (__DEV__ && !debugLogged) {
    debugLogged = true;
    console.log("[env] Supabase config OK", {
      urlPreview: maskUrl(url),
      anonKeyPreview: maskKey(anonKey),
    });
  }

  return {
    ok: true,
    config: { url: url as string, anonKey: anonKey as string },
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig().ok;
}
