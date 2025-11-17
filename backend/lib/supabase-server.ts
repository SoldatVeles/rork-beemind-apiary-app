import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dnoqtpdgdhxemaymidjv.supabase.co';

// For server-side operations, you need the service role key from Supabase dashboard
// Go to: Project Settings > API > service_role key (secret)
// This key bypasses Row Level Security (RLS) - keep it secure!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceRoleKey) {
  console.warn('[Supabase Server] Warning: SUPABASE_SERVICE_ROLE_KEY not set. Database operations may fail.');
}

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
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRub3F0cGRnZGh4ZW1heW1pZGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMzY5MjYsImV4cCI6MjA3ODkxMjkyNn0.ffL_q_QbRuQVnT6wYsI0N9uGRCH-IMRELcspDGDXkN4';
  
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
