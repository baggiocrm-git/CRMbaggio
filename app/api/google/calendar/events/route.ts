import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authorizeRequest } from '@/lib/server-auth';
import { getCalendarService } from '@/lib/google-drive';

const COMPANY_CALENDAR_ID = process.env.GOOGLE_COMPANY_CALENDAR_ID || 'primary';

type EventPayloadInput = {
  title?: string;
  description?: string;
  location?: string;
  start?: string;
  end?: string;
  allDay?: boolean;
  reminderMinutes?: number | null;
};

async function getStoredGoogleTokens() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Configuração do banco de dados ausente');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase
    .from('google_tokens')
    .select('access_token, refresh_token, expiry_date')
    .eq('id', 2)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Google token not found. Please connect your account.');
  }

  return data;
}

async function getCompanyCalendar(req: NextRequest) {
  const authorization = await authorizeRequest(req);
  if (!authorization.ok) {
    return { error: authorization.response };
  }

  try {
    return { calendar: await getCalendarService() };
  } catch {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return {
        error: NextResponse.json({ error: 'Credenciais do Google não configuradas' }, { status: 500 }),
      };
    }

    const tokens = await getStoredGoogleTokens();
    return { calendar: await getCalendarService(tokens) };
  }
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
    const calendarId = searchParams.get('calendarId') || COMPANY_CALENDAR_ID;

    const result = await getCompanyCalendar(req);
    if ('error' in result) return result.error;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const response = await result.calendar.events.list({
      calendarId,
      timeMin: firstDayOfMonth.toISOString(),
      maxResults: 250,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return NextResponse.json(response.data.items || []);
  } catch (error: unknown) {
    console.error('Google Calendar API Error:', error);
    const message = error instanceof Error ? error.message : 'Erro interno no servidor';
    const status = message.toLowerCase().includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { calendarId = COMPANY_CALENDAR_ID, title, description, location, start, end, allDay, reminderMinutes } = body as EventPayloadInput & { calendarId?: string };

    if (!title?.trim() || !start || !end) {
      return NextResponse.json({ error: 'Título, início e fim são obrigatórios.' }, { status: 400 });
    }

    const result = await getCompanyCalendar(req);
    if ('error' in result) return result.error;

    const response = await result.calendar.events.insert({
      calendarId,
      requestBody: buildEventPayload({ title, description, location, start, end, allDay, reminderMinutes }),
    });

    return NextResponse.json({ event: response.data });
  } catch (error: unknown) {
    console.error('Google Calendar Create Event Error:', error);
    const message = error instanceof Error ? error.message : 'Erro interno no servidor';
    const status = message.toLowerCase().includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { calendarId = COMPANY_CALENDAR_ID, eventId, title, description, location, start, end, allDay, reminderMinutes } = body as EventPayloadInput & { calendarId?: string; eventId?: string };

    if (!eventId || !title?.trim() || !start || !end) {
      return NextResponse.json({ error: 'Evento, título, início e fim são obrigatórios.' }, { status: 400 });
    }

    const result = await getCompanyCalendar(req);
    if ('error' in result) return result.error;

    const response = await result.calendar.events.patch({
      calendarId,
      eventId,
      requestBody: buildEventPayload({ title, description, location, start, end, allDay, reminderMinutes }),
    });

    return NextResponse.json({ event: response.data });
  } catch (error: unknown) {
    console.error('Google Calendar Update Event Error:', error);
    const message = error instanceof Error ? error.message : 'Erro interno no servidor';
    const status = message.toLowerCase().includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const calendarId = searchParams.get('calendarId') || COMPANY_CALENDAR_ID;
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Evento não informado.' }, { status: 400 });
    }

    const result = await getCompanyCalendar(req);
    if ('error' in result) return result.error;

    await result.calendar.events.delete({
      calendarId,
      eventId,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Google Calendar Delete Event Error:', error);
    const message = error instanceof Error ? error.message : 'Erro interno no servidor';
    const status = message.toLowerCase().includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
