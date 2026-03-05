import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// Client-side client for standard operations with RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role key for administrative tasks (if needed)
export const getSupabaseServer = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!serviceRoleKey || !url) {
    throw new Error('Supabase server-side configuration missing');
  }
  return createClient(url, serviceRoleKey);
};
