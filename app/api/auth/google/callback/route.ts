import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    // Store tokens in Supabase
    // Assuming a table 'company_settings' or 'google_tokens' exists
    const updateData: any = {
      id: 2, // Fixed ID for company-wide token
      access_token: tokens.access_token,
      expiry_date: tokens.expiry_date,
      updated_at: new Date().toISOString()
    };
    if (tokens.refresh_token) {
      updateData.refresh_token = tokens.refresh_token;
    }

    const { error } = await supabase
      .from('google_tokens')
      .upsert(updateData);

    if (error) throw error;

    return new NextResponse(`
      <html>
        <body>
          <script>
            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
            window.close();
          </script>
          <p>Conexão com Google Drive realizada com sucesso! Esta janela fechará automaticamente.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error: any) {
    console.error('Error exchanging code for tokens:', error);
    return NextResponse.json({ 
      error: 'Failed to exchange code', 
      details: error.message || String(error),
      code: error.code
    }, { status: 500 });
  }
}
