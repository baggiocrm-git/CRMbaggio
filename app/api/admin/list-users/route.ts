import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/server-auth';

export async function GET(req: Request) {
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

    const { data, error } = await supabaseAdmin.auth.admin.listUsers();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ users: data.users });
  } catch (err) {
    console.error('Error in list-users API:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
