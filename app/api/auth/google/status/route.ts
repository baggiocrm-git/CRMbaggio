import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authorizeRequest } from '@/lib/server-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const COMPANY_GOOGLE_ACCOUNT_EMAIL =
  process.env.GOOGLE_COMPANY_ACCOUNT_EMAIL?.toLowerCase().trim() || 'baggiosilveiraconstrutora@gmail.com';

export async function GET(req: NextRequest) {
  const authorization = await authorizeRequest(req);
  if (!authorization.ok) {
    return authorization.response;
  }

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const isServiceAccountConfigured = !!(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    );

    const { data, error } = await supabase
      .from('google_tokens')
      .select('id, access_token')
      .eq('id', 2)
      .maybeSingle();

    if (error) throw error;

    let connectedEmail: string | null = null;

    if (data?.access_token) {
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        connectedEmail = String(profile.email || '').toLowerCase().trim() || null;
      }
    }

    const hasValidCompanyToken = !!data && !!connectedEmail && connectedEmail === COMPANY_GOOGLE_ACCOUNT_EMAIL;

    return NextResponse.json({
      connected: isServiceAccountConfigured || hasValidCompanyToken,
      email: isServiceAccountConfigured ? 'Drive Corporativo (Automático)' : connectedEmail,
      expectedEmail: COMPANY_GOOGLE_ACCOUNT_EMAIL,
      isServiceAccount: isServiceAccountConfigured,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
