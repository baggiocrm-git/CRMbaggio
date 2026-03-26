import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/google-drive';

export async function GET(req: NextRequest) {
  // Reliable base URL detection
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || new URL(req.url).host;
  const protocol = req.headers.get('x-forwarded-proto') || (host.includes('localhost') || host.includes('0.0.0.0') ? 'http' : 'https');
  const baseUrl = (process.env.APP_URL || `${protocol}://${host}`).replace(/\/$/, '');
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  
  const url = getAuthUrl(redirectUri);
  return NextResponse.redirect(url);
}
