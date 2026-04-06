import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Check if the requester is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if requester is lucabaggio28@gmail.com or has admin role
    const isAdmin = requester.email === 'lucabaggio28@gmail.com' || requester.user_metadata?.role === 'Administrador';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { name, email, password, role } = await req.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: role
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

<<<<<<< HEAD
=======
    // Sync with public.equipe table
    if (data.user) {
      const { error: equipeError } = await supabaseAdmin
        .from('equipe')
        .insert({
          id: data.user.id,
          nome: name,
          id_funcionario: data.user.id.substring(0, 8).toUpperCase(), // Gera um ID automático
          cargo: role,
          status: 'Ativo',
          departamento: 'Geral'
        });

      if (equipeError) {
        console.error('Error syncing with equipe table:', equipeError);
      }
    }

>>>>>>> d554f446d82c927bc09f0bd637f90b16474ed18b
    return NextResponse.json({ user: data.user });
  } catch (err) {
    console.error('Error in create-user API:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
