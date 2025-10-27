import { test } from '@playwright/test'
import { mkdir } from 'fs/promises'
import { dirname, resolve } from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
import { createHmac } from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Logs in once and saves the authenticated storage state for all other tests.
// Requires E2E_EMAIL and E2E_PASSWORD to be set in the environment.
// Storage state is written to playwright/.auth/user.json

test('authenticate', async ({ page }) => {
  const envLocal = resolve(process.cwd(), '.env.local')
  if (fs.existsSync(envLocal)) {
    dotenv.config({ path: envLocal })
  } else {
    dotenv.config()
  }
  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD
  if (!email || !password) {
    throw new Error('Set E2E_EMAIL and E2E_PASSWORD environment variables to run E2E with authenticated storage state')
  }

  // Try real UI login first (uses NextAuth). If it doesn't reach dashboard, fall back to cookie bypass when E2E_TEST_MODE=1
  try {
    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL((url) => url.toString().includes('/dashboard'), { timeout: 15000 })
  } catch {
    // Fall back only in test mode
  }

  if (process.env.E2E_TEST_MODE === '1' && page.url().includes('/login')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing Supabase env for e2e-auth cookie injection')
    }
    const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const { data: profile, error } = await admin
      .from('profiles')
      .select('id, email, role, company_id')
      .eq('email', email)
      .single()
    if (error || !profile) {
      throw new Error('Profile not found for E2E user')
    }
    const cookieValue = JSON.stringify({
      id: profile.id,
      email: profile.email,
      role: profile.role || 'user',
      company_id: profile.company_id,
    })
    await page.context().addCookies([
      {
        name: 'e2e-auth',
        value: cookieValue,
        url: 'http://localhost:3000/',
        httpOnly: false,
        sameSite: 'Lax',
      },
    ])
    await page.goto('/dashboard')
    if (page.url().includes('/login')) {
      throw new Error('E2E auth cookie injection failed: still on login')
    }
  }

  const statePath = 'playwright/.auth/user.json'
  await mkdir(dirname(statePath), { recursive: true })
  await page.context().storageState({ path: statePath })
})
