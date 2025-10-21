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
          // Log auth cookies for debugging
          const authCookies = allCookies.filter(c =>
            c.name.includes('auth') || c.name.includes('sb-')
          )
          if (authCookies.length === 0) {
            console.warn('[SUPABASE] No auth cookies found in server request')
          }
          return allCookies
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            console.error('[SUPABASE] Error setting cookies:', error)
          }
        },
      },
    }
  )
}

