import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Google Calendar: Supabase configuration missing');
    return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 200 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Get the token (assuming id: 1 for now as per existing code)
  const { data: tokenData, error: tokenError } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('id', 1)
    .maybeSingle();

  if (tokenError || !tokenData) {
    return NextResponse.json({ error: 'Google token not found' }, { status: 404 });
  }

  let accessToken = tokenData.access_token;

  // Function to fetch events
  const fetchEvents = async (token: string) => {
    // Fetch events from today onwards
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const timeMin = now.toISOString();
    
    return fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=50&singleEvents=true&orderBy=startTime`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
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
        updated_at: new Date().toISOString()
      }).eq('id', 1);

      // Retry fetching events
      response = await fetchEvents(accessToken);
    }
  }

  if (!response.ok) {
    const err = await response.json();
    return NextResponse.json({ error: err.error?.message || 'Failed to fetch events' }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data.items || []);
}
