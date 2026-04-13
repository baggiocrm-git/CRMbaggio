import { google } from 'googleapis';
import { OAuth2Client, JWT } from 'google-auth-library';
import { calendar_v3, drive_v3 } from 'googleapis';

export function getOAuth2Client(redirectUri?: string) {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || process.env.GOOGLE_REDIRECT_URI
  );
}

export function getServiceAccountAuth(
  scopes: string[] = ['https://www.googleapis.com/auth/drive']
) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    return null;
  }

  return new JWT({
    email,
    key: privateKey,
    scopes,
  });
}

export function getAuthUrl(redirectUri?: string) {
  const client = getOAuth2Client(redirectUri);
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    prompt: 'consent',
  });
}

export async function getTokens(code: string, redirectUri?: string) {
  const client = getOAuth2Client(redirectUri);
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function getDriveService(tokens?: Parameters<OAuth2Client['setCredentials']>[0]) {
  if (tokens) {
    const client = getOAuth2Client();
    client.setCredentials(tokens);
    return google.drive({ version: 'v3', auth: client });
  }

  const serviceAuth = getServiceAccountAuth();
  if (serviceAuth) {
    return google.drive({ version: 'v3', auth: serviceAuth });
  }

  throw new Error('No authentication method available for Google Drive');
}

export async function getCalendarService(tokens?: Parameters<OAuth2Client['setCredentials']>[0]) {
  if (tokens) {
    const client = getOAuth2Client();
    client.setCredentials(tokens);
    return google.calendar({ version: 'v3', auth: client });
  }

  const serviceAuth = getServiceAccountAuth([
    'https://www.googleapis.com/auth/calendar',
  ]);

  if (serviceAuth) {
    return google.calendar({ version: 'v3', auth: serviceAuth });
  }

  throw new Error('No authentication method available for Google Calendar');
}

export async function uploadToDrive(drive: drive_v3.Drive, file: Buffer, filename: string, mimeType: string) {
  const response = await drive.files.create({
    requestBody: {
      name: filename,
      mimeType: mimeType,
    },
    media: {
      mimeType: mimeType,
      body: file,
    },
    fields: 'id, webViewLink',
  });
  return response.data;
}
