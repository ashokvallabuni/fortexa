import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

function loginRedirect(request: Request, reason: string) { const url = new URL('/login', request.url); url.searchParams.set('error', reason); return NextResponse.redirect(url); }

export async function GET(request: Request) {
  const url = new URL(request.url); const oauthError = url.searchParams.get('error'); const code = url.searchParams.get('code');
  if (oauthError === 'access_denied') return loginRedirect(request, 'oauth_denied');
  if (oauthError) return loginRedirect(request, 'oauth_error');
  if (!code) return loginRedirect(request, 'missing_code');
  try { const { error } = await (await createClient()).auth.exchangeCodeForSession(code); if (error) { console.error('Supabase OAuth exchange failed:', error.message); return loginRedirect(request, 'code_exchange_failed'); } return NextResponse.redirect(new URL('/workspace', request.url)); }
  catch (error) { console.error('OAuth callback failed:', error); return loginRedirect(request, 'oauth_callback_failed'); }
}