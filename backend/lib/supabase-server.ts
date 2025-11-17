import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  console.error('[Supabase Server] Missing SUPABASE_URL environment variable');
  throw new Error('SUPABASE_URL is required');
}

if (!supabaseServiceRoleKey) {
  console.warn('[Supabase Server] Warning: SUPABASE_SERVICE_ROLE_KEY not set. Database operations may fail.');
}

if (!supabaseAnonKey) {
  console.warn('[Supabase Server] Warning: SUPABASE_ANON_KEY not set. User operations may fail.');
}

console.log('[Supabase Server] Initializing with URL:', supabaseUrl);

// Server-side Supabase client with service role key
// This bypasses RLS and should only be used in backend/server code
export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper to get authenticated Supabase client for a specific user
export const getSupabaseForUser = (accessToken: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
