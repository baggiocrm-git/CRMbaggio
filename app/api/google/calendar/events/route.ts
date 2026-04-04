import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const calendarId = searchParams.get('calendarId') || 'primary';
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Configuração do banco de dados ausente' }, { status: 500 });
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({ error: 'Credenciais do Google não configuradas' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get the token (assuming id: 2 for now as per existing code)
    const { data: tokenData, error: tokenError } = await supabase
      .from('google_tokens')
      .select('access_token, refresh_token, expiry_date')
      .eq('id', 2)
      .maybeSingle();

    if (tokenError || !tokenData) {
      return NextResponse.json({ error: 'Google token not found. Please connect your account.' }, { status: 404 });
    }

    let accessToken = tokenData.access_token;

    // Function to fetch events
    const fetchEvents = async (token: string) => {
      // Fetch events from the beginning of the current month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const timeMin = firstDayOfMonth.toISOString();
      
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&maxResults=250&singleEvents=true&orderBy=startTime`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return res;
    };

    let response = await fetchEvents(accessToken);

    // If unauthorized, try to refresh the token
    if (response.status === 401 && tokenData.refresh_token) {
      console.log('Access token expired, attempting to refresh...');
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: tokenData.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (refreshResponse.ok) {
        const newTokens = await refreshResponse.json();
        accessToken = newTokens.access_token;

        // Update the database
        await supabase.from('google_tokens').update({
          access_token: accessToken,
          expiry_date: newTokens.expiry_date ? new Date(newTokens.expiry_date).toISOString() : null,
          updated_at: new Date().toISOString()
        }).eq('id', 2);

        // Retry fetching events
        response = await fetchEvents(accessToken);
      } else {
        const refreshError = await refreshResponse.json();
        console.error('Failed to refresh token:', refreshError);
        return NextResponse.json({ error: 'Sua sessão do Google expirou. Por favor, conecte-se novamente.' }, { status: 401 });
      }
    }

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.error?.message || 'Failed to fetch events' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data.items || []);
  } catch (error: unknown) {
    console.error('Google Calendar API Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno no servidor' }, { status: 500 });
  }
}
