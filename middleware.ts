import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only run middleware on specific routes that need authentication
  const protectedRoutes = [
    '/dashboard',
    '/properties',
    '/services',
    '/customers',        // ✅ ADDED - was missing!
    '/reports', 
    // '/billing',      // ❌ REMOVED - route doesn't exist!
    '/team',
    '/onboarding',
    '/management',
    '/super-admin',
    '/templates',
    '/schedule',
    '/jobs',
    '/equipment',
    '/profile',
    '/settings',
    '/customer-portal'
  ]

  const authRoutes = ['/login', '/signup']

  // Check if this is a route that needs middleware
  const needsAuth = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.includes(pathname)

  // If no middleware needed, return immediately
  if (!needsAuth && !isAuthRoute) {
    return NextResponse.next()
  }

  // Check environment variables first
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase environment variables not configured')
    // For protected routes, redirect to login on missing env vars
    if (needsAuth) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Create response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // Create Supabase client with error handling
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            try {
              return request.cookies.getAll()
            } catch (error) {
              console.error('Error getting cookies:', error)
              return []
            }
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                request.cookies.set(name, value)
              })
              response = NextResponse.next({
                request,
              })
              cookiesToSet.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options)
              })
            } catch (error) {
              console.error('Error setting cookies:', error)
            }
          },
        },
      }
    )

    // Get user with timeout and error handling
    const getUserPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Auth timeout')), 3000) // 3 second timeout
    })

    const { data: { user }, error: authError } = await Promise.race([
      getUserPromise,
      timeoutPromise
    ]) as any

    if (authError) {
      console.error('Auth error:', authError)
      // For protected routes, redirect to login on auth error
      if (needsAuth) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      return NextResponse.next()
    }

    // Protected routes require authentication
    if (needsAuth && !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Redirect authenticated users from login/signup
    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

  } catch (error) {
    console.error('Middleware error:', error)
    
    // For protected routes, redirect to login on any error
    if (needsAuth) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    // For auth routes, just continue
    return NextResponse.next()
  }

  return response
}

// Force Node.js runtime to avoid Edge Runtime compatibility issues with Supabase
export const runtime = 'nodejs'

export const config = {
  matcher: [
    // Only run on specific routes that need authentication
    '/dashboard/:path*',
    '/properties/:path*', 
    '/services/:path*',
    '/customers/:path*',        // ✅ ADDED - was missing!
    '/reports/:path*',
    // '/billing/:path*',     // ❌ REMOVED - route doesn't exist!
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
    '/customer-portal/:path*',
    '/login',
    '/signup'
  ],
}
