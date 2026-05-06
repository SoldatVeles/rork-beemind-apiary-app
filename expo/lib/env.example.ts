/**
 * Local development fallback for environment variables.
 *
 * HOW TO USE:
 * 1. Copy this file to `lib/env.local.ts` (gitignored).
 * 2. Fill in the values from Supabase Dashboard → Project Settings → API.
 * 3. Restart Expo / Rork preview.
 *
 * NEVER commit `lib/env.local.ts`. Real keys must stay out of git.
 * In production / Rork preview, prefer EXPO_PUBLIC_* env vars instead.
 */
export const localEnv = {
  EXPO_PUBLIC_SUPABASE_URL: "https://YOUR_PROJECT_ID.supabase.co",
  EXPO_PUBLIC_SUPABASE_ANON_KEY: "YOUR_SUPABASE_ANON_KEY",
} as const;
