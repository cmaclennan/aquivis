import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log(`🔍 Middleware Debug - Path: ${pathname}`)
  
  // Log all requests to see what's causing 404s
  if (pathname === '/') {
    console.log('✅ Root path - should work')
  } else if (pathname.startsWith('/_next')) {
    console.log('✅ Static file - skipping')
  } else if (pathname.startsWith('/api')) {
    console.log('✅ API route - skipping')
  } else {
    console.log(`🔍 Processing route: ${pathname}`)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes to debug
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
