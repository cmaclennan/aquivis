import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  // Clear NextAuth session cookies
  const cookieStore = await cookies()

  // Clear all auth-related cookies
  const authCookies = [
    '__Secure-authjs.session-token',
    'authjs.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.session-token',
    'authjs.csrf-token',
    '__Host-authjs.csrf-token',
  ]

  authCookies.forEach(cookieName => {
    cookieStore.delete(cookieName)
  })

  // Use request URL for proper environment handling (dev, staging, production)
  const requestUrl = new URL(request.url)
  const redirectUrl = new URL('/login', requestUrl.origin)

  return NextResponse.redirect(redirectUrl)
}

