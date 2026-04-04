import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Configuração ausente' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

    try {
      await supabase.from('google_tokens').delete().neq('id', 0);
      
      return new NextResponse(`
        <html>
          <head>
            <title>Saindo...</title>
            <style>
              body { background: #0a0a0a; color: white; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .loader { border: 3px solid #1a1a1a; border-top: 3px solid #d4ff3f; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              h1 { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #d4ff3f; }
              p { color: #666; font-size: 12px; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="loader"></div>
            <h1>Drive Desconectado</h1>
            <p>Redirecionando em instantes...</p>
            <script>
              setTimeout(() => {
                window.location.href = '/documents';
              }, 2000);
            </script>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    } catch (error) {
    return NextResponse.json({ error: 'Erro ao desconectar' }, { status: 500 });
  }
}
