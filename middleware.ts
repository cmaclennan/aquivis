import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Skip middleware for static files and API routes
  if (request.nextUrl.pathname.startsWith('/_next') || 
      request.nextUrl.pathname.startsWith('/api') ||
      request.nextUrl.pathname.includes('.')) {
    return response
  }

  // Check if Supabase environment variables are available
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Supabase environment variables not configured')
    return response
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            response = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Only check authentication for protected routes
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                            request.nextUrl.pathname.startsWith('/properties') ||
                            request.nextUrl.pathname.startsWith('/service') ||
                            request.nextUrl.pathname.startsWith('/reports') ||
                            request.nextUrl.pathname.startsWith('/billing') ||
                            request.nextUrl.pathname.startsWith('/team') ||
                            request.nextUrl.pathname.startsWith('/onboarding')

    const isAuthRoute = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup'

    if (isProtectedRoute || isAuthRoute) {
      // Refresh session if expired
      const { data: { user } } = await supabase.auth.getUser()

      // Protected routes require authentication
      if (isProtectedRoute && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // Redirect authenticated users from login/signup
      if (isAuthRoute && user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

  } catch (error) {
    console.error('Middleware error:', error)
    // Don't fail the request, just continue without auth checks
    return response
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

