import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PRIMARY_SUPER_ADMIN_EMAIL, normalizeEmail, accessRequestRedirect } from '@/utils/auth';

export const config = {
  matcher: [
    '/workspace/:path*',
    '/admin/:path*',
    '/pending',
    '/rejected',
    '/request-access',
  ],
};

const PUBLIC_ROUTES = new Set(['/login', '/', '/auth/callback']);

function decodeJwtEmail(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    return typeof payload.email === 'string' ? payload.email : null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get('__session')?.value ||
    request.cookies.get('sb-access-token')?.value;

  const userEmail = normalizeEmail(decodeJwtEmail(token));

  if (!userEmail) {
    const signInUrl = new URL('/login', request.url);
    signInUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (userEmail === PRIMARY_SUPER_ADMIN_EMAIL) {
    return NextResponse.next();
  }

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

  return NextResponse.redirect(new URL(accessRequestRedirect(null, false), request.url));
}
