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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !requester) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = requester.email === 'lucabaggio28@gmail.com' || requester.user_metadata?.role === 'Administrador';

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, name, role } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: {
        full_name: name,
        role: role
      }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Sync with public.equipe table
    const { error: equipeError } = await supabaseAdmin
      .from('equipe')
      .update({
        nome: name,
        cargo: role
      })
      .eq('id', id);

    if (equipeError) {
      console.error('Error syncing with equipe table during update:', equipeError);
    }

    return NextResponse.json({ user: data.user });
  } catch (err) {
    console.error('Error in update-user API:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
