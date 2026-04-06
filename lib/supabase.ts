import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Supabase: Inicializando com URL:', supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'Vazia');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your environment variables.');
}

<<<<<<< HEAD
=======
const createDummyResponse = (data: any = null, error: any = null) => ({ data, error });

const createDummyChain = () => {
  const chain: any = {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    upsert: () => chain,
    delete: () => chain,
    eq: () => chain,
    neq: () => chain,
    gt: () => chain,
    gte: () => chain,
    lt: () => chain,
    lte: () => chain,
    like: () => chain,
    ilike: () => chain,
    is: () => chain,
    in: () => chain,
    contains: () => chain,
    containedBy: () => chain,
    rangeGt: () => chain,
    rangeGte: () => chain,
    rangeLt: () => chain,
    rangeLte: () => chain,
    rangeAdjacent: () => chain,
    overlaps: () => chain,
    textSearch: () => chain,
    match: () => chain,
    not: () => chain,
    or: () => chain,
    filter: () => chain,
    order: () => chain,
    limit: () => chain,
    range: () => chain,
    abortSignal: () => chain,
    single: async () => createDummyResponse(null, { message: 'Supabase não inicializado', code: 'MISSING_CONFIG' }),
    maybeSingle: async () => createDummyResponse(null, { message: 'Supabase não inicializado', code: 'MISSING_CONFIG' }),
    then: (resolve: any) => resolve(createDummyResponse(null, { message: 'Supabase não inicializado', code: 'MISSING_CONFIG' })),
  };
  return chain;
};

>>>>>>> d554f446d82c927bc09f0bd637f90b16474ed18b
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
<<<<<<< HEAD
    from: () => ({
      select: () => ({
        eq: () => ({ single: async () => ({ data: null, error: null }) }),
        order: () => ({ limit: async () => ({ data: [], error: null }) }),
        neq: () => ({ count: 'exact' }),
      }),
      upsert: async () => ({ data: null, error: null }),
    }),
=======
    from: () => createDummyChain(),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => ({ unsubscribe: () => {} }),
      track: async () => {},
      presenceState: () => ({}),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: new Error('Supabase não inicializado') }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
>>>>>>> d554f446d82c927bc09f0bd637f90b16474ed18b
  } as any;
}

export const supabase = supabaseInstance;
