import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  await supabase.auth.signOut()
  
  // Use relative URL to avoid HTTPS/HTTP issues
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'https://www.aquivis.co'))
}

