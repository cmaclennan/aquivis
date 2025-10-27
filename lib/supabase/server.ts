import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types'
import { logger } from '@/lib/logger'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const allCookies = cookieStore.getAll()
          // Optional debug: only log when explicitly enabled
          const debug = process.env.SUPABASE_DEBUG_COOKIES === 'true'
          if (debug) {
            const hasAuth = allCookies.some(c => c.name.includes('auth') || c.name.includes('sb-'))
            if (!hasAuth && (logger as any)?.debug) {
              ;(logger as any).debug('[SUPABASE] No auth cookies found in server request')
            }
          }
          return allCookies
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            logger.error('[SUPABASE] Error setting cookies:', error)
          }
        },
      },
    }
  )
}

