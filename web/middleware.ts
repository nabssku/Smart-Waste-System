import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('sw_token')?.value;
  const role = request.cookies.get('sw_role')?.value;

  const isAdminPage = pathname.startsWith('/admin');
  const isUserDashboard = pathname.startsWith('/dashboard');

  // Protect /admin/* routes
  if (isAdminPage) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (role && role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Protect /dashboard/* routes
  if (isUserDashboard) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
