import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/server-auth';

export async function POST(req: Request) {
  try {
    const authorization = await authorizeRequest(req, { adminOnly: true });
    if (!authorization.ok) {
      return authorization.response;
    }

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

    return NextResponse.json({ user: data.user });
  } catch (err) {
    console.error('Error in create-user API:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
