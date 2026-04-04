import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getDisplayName(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}) {
  const metadata = user.user_metadata || {};
  const fullName = typeof metadata.full_name === 'string' ? metadata.full_name : null;
  const name = typeof metadata.name === 'string' ? metadata.name : null;
  return fullName || name || user.email?.split('@')[0] || 'Usuario';
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Token de autenticacao ausente.' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Configuracao do Supabase ausente no servidor.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !requester) {
      return NextResponse.json({ error: 'Usuario nao autenticado.' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const users = data.users.map((user) => ({
      id: user.id,
      email: user.email || '',
      name: getDisplayName({
        email: user.email,
        user_metadata: user.user_metadata || {},
      }),
      role: user.user_metadata?.role || 'Usuario',
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Chat interno: erro ao listar usuarios.', error);
    return NextResponse.json({ error: 'Falha ao listar usuarios do chat.' }, { status: 500 });
  }
}
