/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Only the anon key client is exposed to the browser.
// All admin operations go through the Express backend (which uses the service role key server-side).
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
