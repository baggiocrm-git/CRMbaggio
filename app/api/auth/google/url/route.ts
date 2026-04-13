import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { authorizeRequest } from '@/lib/server-auth';

const COMPANY_GOOGLE_ACCOUNT_EMAIL =
  process.env.GOOGLE_COMPANY_ACCOUNT_EMAIL?.toLowerCase().trim() || 'baggiosilveiraconstrutora@gmail.com';

export async function GET(req: NextRequest) {
  const authorization = await authorizeRequest(req, { adminOnly: true });
  if (!authorization.ok) {
    return authorization.response;
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent select_account',
    login_hint: COMPANY_GOOGLE_ACCOUNT_EMAIL,
  });

  return NextResponse.json({ url });
}
