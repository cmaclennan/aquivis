#!/usr/bin/env tsx
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

async function main() {
  const envLocal = path.resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envLocal)) {
    dotenv.config({ path: envLocal })
  } else {
    dotenv.config()
  }
  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY

  const errors: string[] = []
  if (!email) errors.push('E2E_EMAIL is not set')
  if (!password) errors.push('E2E_PASSWORD is not set')
  if (!url) errors.push('NEXT_PUBLIC_SUPABASE_URL is not set')
  if (!anon) errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set')
  if (!service) errors.push('SUPABASE_SERVICE_ROLE_KEY is not set')

  if (errors.length) {
    console.error('Configuration errors:')
    for (const e of errors) console.error(' -', e)
    process.exit(2)
  }

  const supabaseAnon = createClient(url!, anon!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const supabaseAdmin = createClient(url!, service!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('Verifying E2E user...')
  console.log(' - email:', email)

  // 1) Verify password via Auth
  const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
    email: email!,
    password: password!,
  })
  if (authError || !authData?.user) {
    console.error('Auth sign-in failed:', authError?.message || 'Unknown error')
    process.exit(1)
  }
  console.log(' ✓ Auth sign-in succeeded')
  const authUserId = authData.user.id

  // 2) Verify profiles row exists and matches
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles' as any)
    .select('id, email, role, company_id')
    .eq('email', email!)
    .single()

  if (profileError || !profile) {
    console.error('Profile lookup failed:', profileError?.message || 'No profile')
    process.exit(1)
  }

  if (profile.id !== authUserId) {
    console.error('Profile.id does not match Auth user id')
    console.error(' - Auth user id:', authUserId)
    console.error(' - Profile id  :', profile.id)
    process.exit(1)
  }

  // 3) Require company_id for dashboard access
  if (!profile.company_id) {
    console.error('Profile is missing company_id (onboarding required)')
    process.exit(1)
  }

  console.log(' ✓ Profile found and matches Auth user')
  console.log(' ✓ company_id present:', profile.company_id)
  console.log(' ✓ role:', profile.role || '(none)')

  console.log('\nE2E user verification: OK')
  process.exit(0)
}

main().catch((e) => {
  console.error('Unexpected error:', e?.message || e)
  process.exit(1)
})
