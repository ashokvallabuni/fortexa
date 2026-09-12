import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { PRIMARY_SUPER_ADMIN_EMAIL, normalizeEmail, accessRequestRedirect } from '@/utils/auth';

export const config = {
  matcher: [
    '/workspace/:path*',
    '/admin/:path*',
    '/pending',
    '/rejected',
    '/request-access',
    '/auth/callback',
  ],
};

const PUBLIC_ROUTES = new Set(['/login', '/']);

async function getSessionUser(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const token =
      req.cookies.get('__session')?.value || req.cookies.get('sb-access-token')?.value;
    if (!token) return null;
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();

  if (url.pathname.startsWith('/auth/callback')) {
    return NextResponse.next();
  }

  const user = await getSessionUser(request);
  const userEmail = normalizeEmail(user?.email ?? null);

  if (!user || !userEmail) {
    const signInUrl = new URL('/login', request.url);
    signInUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (userEmail === PRIMARY_SUPER_ADMIN_EMAIL) {
    if (
      pathname.startsWith('/pending') ||
      pathname.startsWith('/rejected') ||
      pathname.startsWith('/request-access') ||
      pathname === '/workspace'
    ) {
      return NextResponse.redirect(new URL('/admin/access-requests', request.url));
    }
    return NextResponse.next();
  }

  // Regular users: enforce access-request workflow before any restricted area.
  if (pathname.startsWith('/admin/')) {
    return NextResponse.redirect(new URL('/workspace', request.url));
  }

  if (
    pathname.startsWith('/pending') ||
    pathname.startsWith('/rejected') ||
    pathname.startsWith('/request-access') ||
    pathname === '/workspace'
  ) {
    return NextResponse.next();
  }

  const supabase = createAdminClient();
  const { data: req, error: reqError } = await supabase
    .from('access_requests')
    .select('status')
    .eq('email', userEmail)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (reqError || !req) {
    return NextResponse.redirect(new URL('/request-access', request.url));
  }

  const target = accessRequestRedirect(req.status, false);
  if (target === '/workspace') {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL(target, request.url));
}
