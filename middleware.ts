import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Do absolutely nothing - just pass through
  console.log('Middleware called for:', request.nextUrl.pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only test on a few routes to minimize impact
    '/dashboard/:path*',
    '/login',
    '/signup'
  ],
}
