import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  await supabase.auth.signOut()

  // Use request URL for proper environment handling (dev, staging, production)
  const requestUrl = new URL(request.url)
  const redirectUrl = new URL('/login', requestUrl.origin)

  return NextResponse.redirect(redirectUrl)
}

