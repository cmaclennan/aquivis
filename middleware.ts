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

  // Allow NextAuth API routes to pass through
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Secure E2E bypass: require env + header; otherwise skip API processing
  const hasBypassHeader = req.headers.get('x-e2e-bypass') === '1'
  const testMode = process.env.E2E_TEST_MODE === '1'
  const e2eEnabled = testMode && hasBypassHeader
  if (pathname.startsWith('/api') && !e2eEnabled) {
    return NextResponse.next()
  }

  // E2E bypass: inject x-user-* headers from e2e-auth cookie
  if (e2eEnabled) {
    const bypass = req.cookies.get('e2e-auth')?.value
    if (bypass) {
      try {
        const payload = JSON.parse(bypass) as {
          id?: string
          email?: string
          role?: string
          company_id?: string
        }
        const requestHeaders = new Headers(req.headers)
        if (payload.id) requestHeaders.set('x-user-id', payload.id)
        if (payload.email) requestHeaders.set('x-user-email', payload.email)
        if (payload.role) requestHeaders.set('x-user-role', payload.role)
        if (payload.company_id) requestHeaders.set('x-user-company-id', payload.company_id)
        return NextResponse.next({
          request: { headers: requestHeaders },
        })
      } catch {}
      try {
        const decoded = decodeURIComponent(bypass)
        const payload = JSON.parse(decoded) as {
          id?: string
          email?: string
          role?: string
          company_id?: string
        }
        const requestHeaders = new Headers(req.headers)
        if (payload.id) requestHeaders.set('x-user-id', payload.id)
        if (payload.email) requestHeaders.set('x-user-email', payload.email)
        if (payload.role) requestHeaders.set('x-user-role', payload.role)
        if (payload.company_id) requestHeaders.set('x-user-company-id', payload.company_id)
        return NextResponse.next({
          request: { headers: requestHeaders },
        })
      } catch {}
    }
  }

  // Get NextAuth token (unified secret resolution)
  const SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
  const token = await getToken({ req, secret: SECRET })

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/signup', '/super-admin-login', '/customer-portal/login', '/', '/onboarding']

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

  // If no token and trying to access protected route, redirect to login
  if (!token && !isPublicRoute) {
    // Determine which login page to redirect to
    if (pathname.startsWith('/super-admin')) {
      return NextResponse.redirect(new URL('/super-admin-login', req.url))
    } else if (pathname.startsWith('/customer-portal')) {
      return NextResponse.redirect(new URL('/customer-portal/login', req.url))
    } else {
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

  // Pass user data to layouts via headers (so server components can access it)
  if (token) {
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set('x-user-id', token.id as string)
    requestHeaders.set('x-user-email', token.email as string)
    requestHeaders.set('x-user-role', token.role as string)
    requestHeaders.set('x-user-company-id', (token.company_id as string) || '')

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|monitoring|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
