import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return new NextResponse(`
      <html>
        <body style="background: #0a0a0a; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center;">
            <h2 style="color: #ff4444;">Erro na Autenticação</h2>
            <p>${error}</p>
            <button onclick="window.close()" style="background: #1a1a1a; color: white; border: 1px solid #333; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Fechar</button>
          </div>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }

  if (!code) {
    return new NextResponse('Código não fornecido', { status: 400 });
  }

  try {
    const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    console.log('Google Auth Callback: Using redirectUri:', redirectUri);

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Google Client ID or Secret missing in environment');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    console.log('Google Token Response Status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      let errorMsg = 'Falha ao trocar código por tokens';
      try {
        const errorData = await tokenResponse.json();
        console.error('Google Token Error Data:', errorData);
        errorMsg = errorData.error_description || errorData.error || errorMsg;
      } catch (e) {
        console.error('Failed to parse Google Token Error JSON:', e);
        errorMsg = `HTTP ${tokenResponse.status}: ${tokenResponse.statusText}`;
      }
      throw new Error(errorMsg);
    }

    const tokens = await tokenResponse.json();
    
    // Store tokens in Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Configuração do Supabase ausente no servidor');
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get existing token to preserve refresh_token if not provided in this flow
    const { data: existingToken } = await supabase
      .from('google_tokens')
      .select('refresh_token')
      .eq('id', 1)
      .maybeSingle();

    // Prepare data for upsert
    const upsertData: {
      id: number;
      access_token: string;
      expiry_date: string;
      scope: string;
      token_type: string;
      refresh_token?: string;
    } = {
      id: 1,
      access_token: tokens.access_token,
      expiry_date: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString(),
      scope: tokens.scope,
      token_type: tokens.token_type,
      refresh_token: tokens.refresh_token || existingToken?.refresh_token
    };

    const { error: upsertError } = await supabase.from('google_tokens').upsert(upsertData);
    
    if (upsertError) {
      throw new Error(`Erro ao salvar no banco: ${upsertError.message}`);
    }

    return new NextResponse(`
      <html>
        <body style="background: #0a0a0a; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center;">
            <h2 style="color: #d4ff3f;">Conexão Bem-sucedida!</h2>
            <p>Sincronizando seus serviços Google...</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                setTimeout(() => window.close(), 1500);
              } else {
                window.location.href = '/documents';
              }
            </script>
          </div>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  } catch (err) {
    const error = err as Error;
    const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
    const redirectUri = `${appUrl}/api/auth/google/callback`;
    
    return new NextResponse(`
      <html>
        <body style="background: #0a0a0a; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 500px; padding: 20px;">
            <h2 style="color: #ff4444;">Erro na Conexão</h2>
            <p style="margin-bottom: 20px;">${error.message}</p>
            <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; text-align: left; font-size: 12px; border: 1px solid #333; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0; color: #888;">Certifique-se de que esta URL está cadastrada no Google Cloud Console:</p>
              <code style="color: #d4ff3f; word-break: break-all;">${redirectUri}</code>
            </div>
            <button onclick="window.close()" style="background: #d4ff3f; color: #0a0a0a; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">Fechar Janela</button>
          </div>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
}
