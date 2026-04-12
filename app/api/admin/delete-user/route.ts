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

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    // Don't allow deleting yourself
    if (id === authorization.context.user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in delete-user API:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
