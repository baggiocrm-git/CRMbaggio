import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Supabase: Inicializando com URL:', supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'Vazia');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
}

let supabaseInstance: any;
try {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} catch (e) {
  console.error('Erro ao inicializar Supabase:', e);
  // Fallback to a dummy object with auth to prevent crashes
  supabaseInstance = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: new Error('Supabase não inicializado') }),
      signInWithOAuth: async () => ({ data: { url: null }, error: new Error('Supabase não inicializado') }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: null, error: null }) }),
        order: () => ({ limit: async () => ({ data: [], error: null }) }),
        neq: () => ({ count: 'exact' }),
      }),
      upsert: async () => ({ data: null, error: null }),
    }),
  } as any;
}

export const supabase = supabaseInstance;
