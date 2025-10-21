import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * NextAuth.js Middleware
 *
 * This middleware checks NextAuth JWT tokens and handles role-based redirects.
 * - Protects routes that require authentication
 * - Redirects to appropriate login page based on route
 * - Redirects authenticated users away from login pages
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Avoid processing prefetch requests
  const isPrefetch =
    req.headers.get('x-middleware-prefetch') === '1' ||
    req.headers.get('next-router-prefetch') === '1' ||
    req.headers.get('purpose') === 'prefetch'

  if (isPrefetch) {
    return NextResponse.next()
  }

  // Get NextAuth token (unified secret resolution)
  const SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  const token = await getToken({ req, secret: SECRET })

  console.log('[Middleware] Token check:', {
    pathname,
    hasToken: !!token,
    tokenRole: token?.role,
    secretSource: process.env.AUTH_SECRET ? 'AUTH_SECRET' : 'NEXTAUTH_SECRET',
  })

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/signup', '/super-admin-login', '/customer-portal/login', '/']

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

  // If no token and trying to access protected route, redirect to login
  if (!token && !isPublicRoute) {
    // Determine which login page to redirect to
    if (pathname.startsWith('/super-admin')) {
      return NextResponse.redirect(new URL('/super-admin-login', req.url))
    } else if (pathname.startsWith('/customer-portal')) {
      return NextResponse.redirect(new URL('/customer-portal/login', req.url))
    } else if (pathname.startsWith('/dashboard') || pathname.startsWith('/properties') || pathname.startsWith('/services') || pathname.startsWith('/customers') || pathname.startsWith('/jobs') || pathname.startsWith('/schedule') || pathname.startsWith('/reports') || pathname.startsWith('/settings') || pathname.startsWith('/team') || pathname.startsWith('/profile') || pathname.startsWith('/equipment') || pathname.startsWith('/management') || pathname.startsWith('/monitoring')) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // If token exists and trying to access login pages, redirect to dashboard
  if (token && (pathname === '/login' || pathname === '/super-admin-login' || pathname === '/customer-portal/login')) {
    // Redirect based on role
    if (token.role === 'super_admin') {
      return NextResponse.redirect(new URL('/super-admin', req.url))
    } else {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next({
    request: {
      headers: req.headers,
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|monitoring|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
