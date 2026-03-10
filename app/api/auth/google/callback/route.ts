import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return new NextResponse(`
      <html>
        <body>
          <script>
            window.close();
          </script>
          <p>Erro na autenticação: ${error}</p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }

  if (!code) {
    return new NextResponse('Código não fornecido', { status: 400 });
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.APP_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(errorData.error_description || 'Falha ao trocar código por tokens');
    }

    const tokens = await tokenResponse.json();
    
    // Store tokens in Supabase (we'll use a generic key for now since we don't have user sessions yet)
    // In a real app, you'd associate this with the logged-in user's ID
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await supabase.from('google_tokens').upsert({
      id: 1, // Using numeric ID for int8 column
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: new Date(Date.now() + (tokens.expires_in * 1000)).toISOString().split('T')[0],
      scope: tokens.scope,
      token_type: tokens.token_type,
    });

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
    return new NextResponse(`
      <html>
        <body style="background: #0a0a0a; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center;">
            <h2 style="color: #ff4444;">Erro na Conexão</h2>
            <p>${error.message}</p>
            <button onclick="window.close()" style="background: #1a1a1a; color: white; border: 1px solid #333; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Fechar</button>
          </div>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  }
}
