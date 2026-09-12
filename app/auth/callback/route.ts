import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ensurePrimarySuperAdmin } from '@/utils/supabase/primary-super-admin';
import {
  PRIMARY_SUPER_ADMIN_EMAIL,
  normalizeEmail,
} from '@/utils/auth';

function loginRedirect(request: Request, reason: string) {
  const url = new URL('/login', request.url);
  url.searchParams.set('error', reason);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const oauthError = url.searchParams.get('error');
  const code = url.searchParams.get('code');

  if (oauthError === 'access_denied') return loginRedirect(request, 'oauth_denied');
  if (oauthError) return loginRedirect(request, 'oauth_error');
  if (!code) return loginRedirect(request, 'missing_code');

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Supabase OAuth exchange failed:', error.message);
      return loginRedirect(request, 'code_exchange_failed');
    }

    const user = data.user;
    if (!user?.email) {
      return loginRedirect(request, 'missing_identity');
    }

    const email = normalizeEmail(user.email);

    if (email === PRIMARY_SUPER_ADMIN_EMAIL) {
      const result = await ensurePrimarySuperAdmin(user);
      if (!result.ok) {
        console.warn('Primary Super Admin login continued with provisioning error:', result.error);
      }
      return NextResponse.redirect(new URL('/admin/access-requests', request.url));
    }

    const { data: req, error: reqError } = await supabase
      .from('access_requests')
      .select('status')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reqError) {
      console.error('Access request check failed:', reqError.message);
      return loginRedirect(request, 'access_check_failed');
    }

    if (!req) {
      return NextResponse.redirect(new URL('/request-access', request.url));
    }
    if (req.status === 'PENDING') {
      return NextResponse.redirect(new URL('/pending', request.url));
    }
    if (req.status === 'REJECTED') {
      return NextResponse.redirect(new URL('/rejected', request.url));
    }

    return NextResponse.redirect(new URL('/workspace', request.url));
  } catch (error: unknown) {
    console.error('OAuth callback failed:', error);
    return loginRedirect(request, 'oauth_callback_failed');
  }
}
