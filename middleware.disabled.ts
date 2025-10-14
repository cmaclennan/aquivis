import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Completely disabled middleware for testing
  console.log(`🔍 Middleware DISABLED - Path: ${request.nextUrl.pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match nothing - completely disable middleware
    '/__test__',
  ],
}