import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authorizeRequest } from '@/lib/server-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
    // Check if Service Account is configured
    const isServiceAccountConfigured = !!(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && 
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
    );

    const { data, error } = await supabase
      .from('google_tokens')
      .select('id')
      .eq('id', 2) // Global company drive token
      .maybeSingle();

    if (error) throw error;
    
    return NextResponse.json({ 
      connected: isServiceAccountConfigured || !!data,
      email: isServiceAccountConfigured ? 'Drive Corporativo (Automático)' : (data ? 'Conectado via Token' : null),
      isServiceAccount: isServiceAccountConfigured
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
