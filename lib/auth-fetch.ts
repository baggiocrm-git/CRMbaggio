'use client';

import { supabase } from '@/lib/supabase';

function mergeHeaders(initHeaders: HeadersInit | undefined, accessToken: string) {
  const headers = new Headers(initHeaders);
  headers.set('Authorization', `Bearer ${accessToken}`);
  return headers;
}

export async function getAccessToken() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Sessão não encontrada.');
  }

  return session.access_token;
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  const accessToken = await getAccessToken();
  return fetch(input, {
    ...init,
    cache: 'no-store',
    headers: mergeHeaders(init?.headers, accessToken),
  });
}
