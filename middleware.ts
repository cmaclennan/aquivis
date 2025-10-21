import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Simplified Middleware
 *
 * This middleware now only handles basic routing and does NOT check authentication.
 * Authentication is now handled by the (protected) layout component which runs
 * in Node.js runtime with full cookie support.
 *
 * Why this change?
 * - Edge Runtime (where middleware runs) has limitations with cookie handling
 * - Node.js Runtime (where layouts run) has full cookie support
 * - This separation of concerns is cleaner and more reliable
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

  // Just pass through - let layouts handle auth
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
