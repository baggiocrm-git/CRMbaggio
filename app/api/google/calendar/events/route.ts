import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { authorizeRequest } from '@/lib/server-auth';

type GoogleTokenData = {
  access_token: string;
  refresh_token?: string | null;
  expiry_date?: string | null;
};

type EventPayloadInput = {
  title?: string;
  description?: string;
  location?: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  reminderMinutes?: number | null;
};

async function getGoogleToken(req: NextRequest) {
  const authorization = await authorizeRequest(req);
  if (!authorization.ok) {
    return { error: authorization.response };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { error: NextResponse.json({ error: 'Configuração do banco de dados ausente' }, { status: 500 }) };
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return { error: NextResponse.json({ error: 'Credenciais do Google não configuradas' }, { status: 500 }) };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: tokenData, error: tokenError } = await supabase
    .from('google_tokens')
    .select('access_token, refresh_token, expiry_date')
    .eq('id', 2)
    .maybeSingle();

  if (tokenError || !tokenData) {
    return { error: NextResponse.json({ error: 'Google token not found. Please connect your account.' }, { status: 404 }) };
  }

  return {
    supabase,
    tokenData: tokenData as GoogleTokenData,
  };
}

async function buildAccessTokenTools(
  supabase: any,
  tokenData: GoogleTokenData
) {
  let accessToken = tokenData.access_token;

  const refreshToken = async () => {
    if (!tokenData.refresh_token) return null;

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

    if (!refreshResponse.ok) return null;

    const newTokens = await refreshResponse.json();
    accessToken = newTokens.access_token;

    await supabase
      .from('google_tokens')
      .update({
        access_token: accessToken,
        expiry_date: newTokens.expiry_date ? new Date(newTokens.expiry_date).toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 2);

    return accessToken;
  };

  return { accessToken, refreshToken };
}

function buildEventPayload({
  title,
  description,
  location,
  start,
  end,
  allDay,
  reminderMinutes,
}: EventPayloadInput) {
  const reminders =
    typeof reminderMinutes === 'number' && reminderMinutes >= 0
      ? {
          useDefault: false,
          overrides: [{ method: 'popup', minutes: reminderMinutes }],
        }
      : undefined;

  if (allDay) {
    const endDate = new Date((end || '').slice(0, 10));
    endDate.setDate(endDate.getDate() + 1);

    return {
      summary: title?.trim(),
      description: description?.trim() || undefined,
      location: location?.trim() || undefined,
      start: { date: (start || '').slice(0, 10) },
      end: { date: endDate.toISOString().slice(0, 10) },
      reminders,
    };
  }

  return {
    summary: title?.trim(),
    description: description?.trim() || undefined,
    location: location?.trim() || undefined,
    start: { dateTime: new Date(start || '').toISOString() },
    end: { dateTime: new Date(end || '').toISOString() },
    reminders,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const calendarId = searchParams.get('calendarId') || 'primary';

    const tokenResult = await getGoogleToken(req);
    if ('error' in tokenResult) return tokenResult.error;

    const { supabase, tokenData } = tokenResult;
    const { accessToken: initialAccessToken, refreshToken } = await buildAccessTokenTools(supabase, tokenData);
    let accessToken = initialAccessToken;

    const fetchEvents = async (token: string) => {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const timeMin = firstDayOfMonth.toISOString();

      return fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&maxResults=250&singleEvents=true&orderBy=startTime`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    };

    let response = await fetchEvents(accessToken);

    if (response.status === 401 && tokenData.refresh_token) {
      const refreshedAccessToken = await refreshToken();
      if (refreshedAccessToken) {
        accessToken = refreshedAccessToken;
        response = await fetchEvents(accessToken);
      } else {
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      calendarId = 'primary',
      title,
      description,
      location,
      start,
      end,
      allDay,
      reminderMinutes,
    } = body as {
      calendarId?: string;
      title?: string;
      description?: string;
      location?: string;
      start?: string;
      end?: string;
      allDay?: boolean;
      reminderMinutes?: number | null;
    };

    if (!title?.trim() || !start || !end) {
      return NextResponse.json({ error: 'Título, início e fim são obrigatórios.' }, { status: 400 });
    }

    const tokenResult = await getGoogleToken(req);
    if ('error' in tokenResult) return tokenResult.error;

    const { supabase, tokenData } = tokenResult;
    const { accessToken: initialAccessToken, refreshToken } = await buildAccessTokenTools(supabase, tokenData);
    let accessToken = initialAccessToken;

    const createEvent = async (token: string) => {
      return fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildEventPayload({ title, description, location, start, end, allDay, reminderMinutes })),
      });
    };

    let response = await createEvent(accessToken);

    if (response.status === 401 && tokenData.refresh_token) {
      const refreshedAccessToken = await refreshToken();
      if (refreshedAccessToken) {
        accessToken = refreshedAccessToken;
        response = await createEvent(accessToken);
      } else {
        return NextResponse.json({ error: 'Sua sessão do Google expirou. Por favor, conecte-se novamente.' }, { status: 401 });
      }
    }

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.error?.message || 'Falha ao criar evento no Google Calendar.' }, { status: response.status });
    }

    const createdEvent = await response.json();
    return NextResponse.json({ event: createdEvent });
  } catch (error: unknown) {
    console.error('Google Calendar Create Event Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      calendarId = 'primary',
      eventId,
      title,
      description,
      location,
      start,
      end,
      allDay,
      reminderMinutes,
    } = body as {
      calendarId?: string;
      eventId?: string;
      title?: string;
      description?: string;
      location?: string;
      start?: string;
      end?: string;
      allDay?: boolean;
      reminderMinutes?: number | null;
    };

    if (!eventId || !title?.trim() || !start || !end) {
      return NextResponse.json({ error: 'Evento, título, início e fim são obrigatórios.' }, { status: 400 });
    }

    const tokenResult = await getGoogleToken(req);
    if ('error' in tokenResult) return tokenResult.error;

    const { supabase, tokenData } = tokenResult;
    const { accessToken: initialAccessToken, refreshToken } = await buildAccessTokenTools(supabase, tokenData);
    let accessToken = initialAccessToken;

    const updateEvent = async (token: string) => {
      return fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildEventPayload({ title, description, location, start, end, allDay, reminderMinutes })),
      });
    };

    let response = await updateEvent(accessToken);

    if (response.status === 401 && tokenData.refresh_token) {
      const refreshedAccessToken = await refreshToken();
      if (refreshedAccessToken) {
        accessToken = refreshedAccessToken;
        response = await updateEvent(accessToken);
      } else {
        return NextResponse.json({ error: 'Sua sessão do Google expirou. Por favor, conecte-se novamente.' }, { status: 401 });
      }
    }

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err.error?.message || 'Falha ao atualizar evento no Google Calendar.' }, { status: response.status });
    }

    const updatedEvent = await response.json();
    return NextResponse.json({ event: updatedEvent });
  } catch (error: unknown) {
    console.error('Google Calendar Update Event Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno no servidor' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const calendarId = searchParams.get('calendarId') || 'primary';
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Evento não informado.' }, { status: 400 });
    }

    const tokenResult = await getGoogleToken(req);
    if ('error' in tokenResult) return tokenResult.error;

    const { supabase, tokenData } = tokenResult;
    const { accessToken: initialAccessToken, refreshToken } = await buildAccessTokenTools(supabase, tokenData);
    let accessToken = initialAccessToken;

    const deleteEvent = async (token: string) =>
      fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

    let response = await deleteEvent(accessToken);

    if (response.status === 401 && tokenData.refresh_token) {
      const refreshedAccessToken = await refreshToken();
      if (refreshedAccessToken) {
        accessToken = refreshedAccessToken;
        response = await deleteEvent(accessToken);
      } else {
        return NextResponse.json({ error: 'Sua sessão do Google expirou. Por favor, conecte-se novamente.' }, { status: 401 });
      }
    }

    if (!response.ok) {
      let message = 'Falha ao remover evento no Google Calendar.';
      try {
        const err = await response.json();
        message = err.error?.message || message;
      } catch {}
      return NextResponse.json({ error: message }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Google Calendar Delete Event Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro interno no servidor' }, { status: 500 });
  }
}

