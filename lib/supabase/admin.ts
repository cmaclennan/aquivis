import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

/**
 * Supabase Admin Client
 * 
 * This client uses the service role key and bypasses RLS.
 * Use ONLY in server-side code where you need to:
 * - Query data without user authentication
 * - Bypass Row Level Security policies
 * - Perform admin operations
 * 
 * NEVER expose this client to the browser!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for admin client')
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

