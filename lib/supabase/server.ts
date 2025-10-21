import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const allCookies = cookieStore.getAll()
          console.log('[ServerClient] getAll() - returning', allCookies.length, 'cookies')
          return allCookies
        },
        setAll(cookiesToSet) {
          console.log('[ServerClient] setAll() - setting', cookiesToSet.length, 'cookies')
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              console.log('[ServerClient] Setting cookie:', name, 'with options:', options)
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            console.error('[ServerClient] Error setting cookies:', error)
          }
        },
      },
    }
  )
}

