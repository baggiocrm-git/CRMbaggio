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

  // In a real app, you would exchange the code for tokens here
  // const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     code,
  //     client_id: process.env.GOOGLE_CLIENT_ID,
  //     client_secret: process.env.GOOGLE_CLIENT_SECRET,
  //     redirect_uri: `${process.env.APP_URL}/api/auth/google/callback`,
  //     grant_type: 'authorization_code',
  //   }),
  // });
  // const tokens = await tokenResponse.json();
  // Store tokens in DB or session

  return new NextResponse(`
    <html>
      <body style="background: #0a0a0a; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
        <div style="text-align: center;">
          <h2 style="color: #d4ff3f;">Conexão Bem-sucedida!</h2>
          <p>Sincronizando seu Google Agenda...</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              setTimeout(() => window.close(), 1500);
            } else {
              window.location.href = '/calendar';
            }
          </script>
        </div>
      </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } });
}
