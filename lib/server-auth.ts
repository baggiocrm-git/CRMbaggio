import { createClient, type User } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const MASTER_ADMIN_EMAIL = 'lucabaggio28@gmail.com';

export type AppRole =
  | 'Administrador'
  | 'Usuário'
  | 'Cliente'
  | 'Auxiliar Administrativo Nível 1'
  | 'Auxiliar Administrativo Nível 2'
  | 'Administrativo Financeiro 1'
  | 'Administrativo Financeiro 2'
  | 'Administrador Master'
  | 'Administrador Financeiro';

export type AuthorizedUser = {
  user: User;
  email: string;
  role: string | null;
  isAdmin: boolean;
  isInternalUser: boolean;
};

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin credentials are missing on the server.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function extractBearerToken(request: NextRequest | Request) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice('Bearer '.length).trim();
}

export function isAdminUser(user: { email?: string | null; user_metadata?: Record<string, unknown> | null }) {
  const email = user.email?.toLowerCase().trim() || '';
  const role = typeof user.user_metadata?.role === 'string' ? user.user_metadata.role : null;
  return email === MASTER_ADMIN_EMAIL || role === 'Administrador';
}

export function isInternalUser(user: { user_metadata?: Record<string, unknown> | null }) {
  const role = typeof user.user_metadata?.role === 'string' ? user.user_metadata.role : null;
  return role !== 'Cliente';
}

export async function authorizeRequest(
  request: NextRequest | Request,
  options?: { adminOnly?: boolean; allowClient?: boolean }
): Promise<{ ok: boolean; context?: AuthorizedUser; response?: NextResponse }> {
  const token = extractBearerToken(request);
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  let supabaseAdmin;
  try {
    supabaseAdmin = getSupabaseAdminClient();
  } catch (error) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: error instanceof Error ? error.message : 'Supabase admin unavailable.' },
        { status: 500 }
      ),
    };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const email = user.email?.toLowerCase().trim() || '';
  const role = typeof user.user_metadata?.role === 'string' ? user.user_metadata.role : null;
  const authorizedUser: AuthorizedUser = {
    user,
    email,
    role,
    isAdmin: isAdminUser(user),
    isInternalUser: isInternalUser(user),
  };

  if (options?.adminOnly && !authorizedUser.isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  if (!options?.allowClient && !authorizedUser.isInternalUser) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }

  return { ok: true, context: authorizedUser };
}
