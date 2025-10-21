import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Avoid auth redirects on prefetch requests to prevent navigation bounce
  const isPrefetch =
    req.headers.get('x-middleware-prefetch') === '1' ||
    req.headers.get('next-router-prefetch') === '1' ||
    req.headers.get('purpose') === 'prefetch'

  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Log incoming cookies
  const incomingCookies = req.cookies.getAll()
  const hasAuthCookie = incomingCookies.some(c => c.name.includes('auth-token'))
  console.log(`[Middleware] ${pathname} - Incoming cookies: ${incomingCookies.length}, Has auth: ${hasAuthCookie}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = req.cookies.getAll()
          console.log(`[Middleware] getAll() called - returning ${cookies.length} cookies`)
          return cookies
        },
        setAll(cookiesToSet) {
          console.log(`[Middleware] setAll() called with ${cookiesToSet.length} cookies to set`)
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              console.log(`[Middleware] Setting cookie: ${name}, options:`, options)
              req.cookies.set(name, value)
            })
            res = NextResponse.next({
              request: req,
            })
            cookiesToSet.forEach(({ name, value, options }) => {
              res.cookies.set(name, value, options)
            })
          } catch (error) {
            console.error('[Middleware] Error setting cookies:', error)
          }
        },
      },
    }
  )

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  console.log(`[Middleware] ${pathname} - Session found: ${!!session}, Error: ${sessionError?.message || 'none'}`)

  // Define protected routes (all main app areas)
  const protectedRoutes = [
    '/dashboard',
    '/customers',
    '/customer-portal',
    '/properties',
    '/services',
    '/jobs',
    '/reports',
    '/team',
    '/profile',
    '/settings',
    '/management',
    '/schedule',
    '/equipment',
    '/super-admin',
    '/templates',
    '/onboarding',
  ]

  // Define public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/customer-portal/login',
    '/super-admin-login',
    '/invite/accept',
    '/style-guide',
  ]

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  // If accessing a protected route without a session, redirect to login
  if (isProtectedRoute && !session) {
    if (isPrefetch) {
      return res
    }
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    // Preserve any cookies set by Supabase during getSession (e.g., token refresh)
    res.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c))
    return redirectResponse
  }

  // If accessing login/signup with a session, redirect to dashboard
  if ((pathname === '/login' || pathname === '/signup') && session) {
    if (isPrefetch) {
      return res
    }
    const redirectResponse = NextResponse.redirect(new URL('/dashboard', req.url))
    res.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c))
    return redirectResponse
  }

  return res
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
