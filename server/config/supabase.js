import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

// Usually in a Node.js backend using Supabase, you want the service_role key to bypass RLS
// because the backend itself enforces authorization via `req.user` JWTs.
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://zofmwjuakybpuoiqzktm.supabase.co';
// Use service role key to bypass RLS in backend for authorized operations
const SERVICE_ROLE_KEY_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZm13anVha3licHVvaXF6a3RtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODc1MTgxNSwiZXhwIjoyMDk0MzI3ODE1fQ.B5LM0c9NoVypcJCUFzMlF2dlRh21bmb5FefDTn7zYko';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || SERVICE_ROLE_KEY_FALLBACK || process.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
