import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

console.log('Supabase lib: Inicializando cliente...', { url: supabaseUrl });

// Client-side client for standard operations with RLS
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    debug: true, // Enable debug logs for auth
  }
});

if (typeof window !== 'undefined') {
  console.log('Supabase lib: Cliente inicializado no navegador.');
  console.log('Supabase lib: URL atual:', window.location.href);
  console.log('Supabase lib: Auth Config:', {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  });
  // Debug storage
  try {
    const testKey = 'sb-test-storage';
    localStorage.setItem(testKey, 'ok');
    const val = localStorage.getItem(testKey);
    console.log('Supabase lib: LocalStorage funcional:', val === 'ok' ? 'SIM' : 'NÃO');
    localStorage.removeItem(testKey);
  } catch (e) {
    console.error('Supabase lib: LocalStorage BLOQUEADO ou INDISPONÍVEL:', e);
  }
}
export const getSupabaseServer = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!serviceRoleKey || !url) {
    throw new Error('Supabase server-side configuration missing');
  }
  return createClient(url, serviceRoleKey);
};
