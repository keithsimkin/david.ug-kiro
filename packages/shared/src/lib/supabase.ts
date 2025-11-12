import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const initializeSupabase = (url: string, anonKey: string): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(url, anonKey);
  }
  return supabaseInstance;
};

export const getSupabase = (): SupabaseClient => {
  if (!supabaseInstance) {
    throw new Error('Supabase client not initialized. Call initializeSupabase first.');
  }
  return supabaseInstance;
};
