import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Singleton instance
let supabaseInstance: SupabaseClient<Database> | null = null;

export function createBrowserClient() {
  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Create and cache the instance
  supabaseInstance = createClient<Database>(supabaseUrl, supabaseKey);
  return supabaseInstance;
}
