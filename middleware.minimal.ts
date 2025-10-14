import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log(`🔍 Middleware running for: ${pathname}`)

  // Only run middleware on specific routes that need authentication
  const protectedRoutes = [
    '/dashboard',
    '/properties',
    '/services',
    '/reports', 
    '/billing',
    '/team',
    '/onboarding',
    '/management',
    '/super-admin',
    '/templates',
    '/schedule',
    '/jobs',
    '/equipment',
    '/profile',
    '/settings'
  ]

  const authRoutes = ['/login', '/signup']

  // Check if this is a route that needs middleware
  const needsAuth = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.includes(pathname)

  console.log(`  - needsAuth: ${needsAuth}`)
  console.log(`  - isAuthRoute: ${isAuthRoute}`)

  // If no middleware needed, return immediately
  if (!needsAuth && !isAuthRoute) {
    console.log(`  ✅ SKIP: No middleware needed for ${pathname}`)
    return NextResponse.next()
  }

  console.log(`  🔐 AUTH: Middleware would run for ${pathname}`)
  
  // For now, just return next without any Supabase calls
  // This will help us isolate if the issue is with Supabase or the middleware itself
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only run on specific routes that need authentication
    '/dashboard/:path*',
    '/properties/:path*', 
    '/services/:path*',
    '/reports/:path*',
    '/billing/:path*',
    '/team/:path*',
    '/onboarding/:path*',
    '/management/:path*',
    '/super-admin/:path*',
    '/templates/:path*',
    '/schedule/:path*',
    '/jobs/:path*',
    '/equipment/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/login',
    '/signup'
  ],
}
