import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authorizeRequest } from '@/lib/server-auth';
import { getCalendarService } from '@/lib/google-drive';

const COMPANY_CALENDAR_ID = process.env.GOOGLE_COMPANY_CALENDAR_ID || '';
const COMPANY_CALENDAR_NAME = process.env.GOOGLE_COMPANY_CALENDAR_NAME || 'Agenda da Empresa';
const COMPANY_CALENDAR_IDS = (process.env.GOOGLE_COMPANY_CALENDAR_IDS || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const PRIMARY_COMPANY_CALENDAR_ID = COMPANY_CALENDAR_ID || COMPANY_CALENDAR_IDS[0] || '';

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

export async function GET(req: NextRequest) {
  try {
    const authorization = await authorizeRequest(req);
    if (!authorization.ok) {
      return authorization.response;
    }

    let calendar;
    try {
      calendar = await getCalendarService();
    } catch {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        return NextResponse.json({ error: 'Credenciais do Google não configuradas' }, { status: 500 });
      }

      const tokens = await getStoredGoogleTokens();
      calendar = await getCalendarService(tokens);
    }

    const response = await calendar.calendarList.list({
      maxResults: 250,
    });

    const items = (response.data.items || [])
      .filter((item) => item.id && item.summary)
      .map((item) => ({
        id: item.id,
        summary: item.summary,
        backgroundColor: item.backgroundColor || '#d4ff3f',
        foregroundColor: item.foregroundColor || '#0a0a0a',
        primary: !!item.primary,
      }));

    const explicitCalendarIds = Array.from(new Set([
      ...COMPANY_CALENDAR_IDS,
      ...(PRIMARY_COMPANY_CALENDAR_ID ? [PRIMARY_COMPANY_CALENDAR_ID] : []),
    ]));

    if (explicitCalendarIds.length > 0) {
      const missingCalendarIds = explicitCalendarIds.filter(
        (calendarId) => !items.some((item) => item.id === calendarId)
      );

      const explicitCalendarResults = await Promise.allSettled(
        missingCalendarIds.map(async (calendarId) => {
          const fallbackCalendar = await calendar.calendars.get({ calendarId });
          return {
            id: fallbackCalendar.data.id || calendarId,
            summary:
              fallbackCalendar.data.summary ||
              (calendarId === PRIMARY_COMPANY_CALENDAR_ID ? COMPANY_CALENDAR_NAME : calendarId),
            backgroundColor: fallbackCalendar.data.backgroundColor || '#d4ff3f',
            foregroundColor: fallbackCalendar.data.foregroundColor || '#0a0a0a',
            primary: calendarId === PRIMARY_COMPANY_CALENDAR_ID,
          };
        })
      );

      const explicitCalendars = explicitCalendarResults.flatMap((result, index) => {
        if (result.status === 'fulfilled') {
          return [result.value];
        }

        console.warn(
          `Google Calendar List API: failed to resolve explicit calendar "${missingCalendarIds[index]}"`,
          result.reason
        );
        return [];
      });

      const mergedCalendars = [...items, ...explicitCalendars];
      if (mergedCalendars.length > 0) {
        return NextResponse.json(mergedCalendars);
      }
    }

    return NextResponse.json(items);
  } catch (error: unknown) {
    console.error('Google Calendar List API Error:', error);
    const message = error instanceof Error ? error.message : 'Erro interno no servidor';
    const status = message.toLowerCase().includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
