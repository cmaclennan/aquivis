import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient()

    // Try to get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Get all cookies
    const allCookies = cookieStore.getAll()
    const supabaseCookies = allCookies.filter(c => 
      c.name.includes('supabase') || c.name.includes('sb-')
    )

    return NextResponse.json({
      status: 'ok',
      session: session ? { user: session.user.email, expiresAt: session.expires_at } : null,
      sessionError: sessionError ? { message: sessionError.message, status: sessionError.status } : null,
      cookies: {
        total: allCookies.length,
        supabase: supabaseCookies.length,
        names: allCookies.map(c => c.name),
      },
      env: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

