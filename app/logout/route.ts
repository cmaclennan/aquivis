import { NextResponse } from 'next/server'
import { signOut } from '@/lib/auth'

export async function GET(request: Request) {
  // Use NextAuth signOut to clear session reliably
  try {
    await signOut({ redirect: false })
  } catch {
    // no-op: fallback redirect will still occur
  }

  const url = new URL(request.url)
  return NextResponse.redirect(new URL('/login', url.origin))
}

