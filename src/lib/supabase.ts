import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('your-project') &&
    supabaseAnonKey &&
    !supabaseAnonKey.includes('placeholder') &&
    !supabaseAnonKey.includes('your-anon-key')
);

if (!isSupabaseConfigured) {
  console.info(
    'ℹ️ Running Millennium Era in Local Demo Mode with pre-populated catalog and pictures. To link live Supabase, configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
