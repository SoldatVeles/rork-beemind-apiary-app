import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = 'https://dnoqtpdgdhxemaymidxv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRub3F0cGRnZGh4ZW1heW1pZGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMzY5MjYsImV4cCI6MjA3ODkxMjkyNn0.ffL_q_QbRuQVnT6wYsI0N9uGRCH-IMRELcspDGDXkN4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
