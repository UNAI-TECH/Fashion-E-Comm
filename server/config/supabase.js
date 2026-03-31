import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

// Usually in a Node.js backend using Supabase, you want the service_role key to bypass RLS
// because the backend itself enforces authorization via `req.user` JWTs.
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
// Fallback to anon key if service role is missing, but service role is highly recommended.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
