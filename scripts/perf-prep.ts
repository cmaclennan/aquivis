import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs/promises'
import * as path from 'path'
import dotenv from 'dotenv'

async function main() {
  // Load env from .env.local if present
  try {
    await fs.access('.env.local')
    dotenv.config({ path: '.env.local' })
  } catch {
    dotenv.config()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const email = process.env.E2E_EMAIL

  if (!supabaseUrl || !serviceKey) throw new Error('Missing Supabase env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
  if (!email) throw new Error('Set E2E_EMAIL to the test user email')

  const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, email, role, company_id')
    .eq('email', email)
    .single()
  if (error || !profile) throw new Error('Profile not found for E2E user')

  const cookiePayload = {
    id: profile.id,
    email: profile.email,
    role: profile.role || 'user',
    company_id: profile.company_id,
  }
  const cookieValue = encodeURIComponent(JSON.stringify(cookiePayload))

  // Build common authenticated headers
  const commonHeaders: Record<string, string> = {
    Cookie: `e2e-auth=${cookieValue}`,
    'x-user-id': profile.id,
    'x-user-email': profile.email,
    'x-user-role': (profile.role || 'user') as string,
    'x-user-company-id': profile.company_id || '',
    'x-e2e-bypass': '1',
  }

  // Write Lighthouse extra headers
  const lhciHeaders = commonHeaders
  await fs.writeFile(path.resolve('lhci-headers.json'), JSON.stringify(lhciHeaders, null, 2), 'utf-8')

  // Prepare dates for Artillery requests
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 30)
  const iso = (d: Date) => d.toISOString().slice(0, 10)

  // Write Artillery config (JSON)
  const artilleryConfig = {
    config: {
      target: 'http://localhost:3000',
      phases: [
        { duration: 30, arrivalRate: 3 },
        { duration: 120, arrivalRate: 5, rampTo: 10 },
        { duration: 60, arrivalRate: 10 },
      ],
      plugins: {
        expect: {}
      },
      processor: './scripts/artillery-processor.js',
      defaults: {
        headers: {
          ...commonHeaders,
          'content-type': 'application/json',
        },
      },
    },
    scenarios: [
      {
        name: 'Read endpoints',
        flow: [
          { get: { url: '/api/reports/lookups', expect: [ { statusCode: 200 } ], afterResponse: 'recordServerTiming' } },
          { get: { url: '/api/templates', expect: [ { statusCode: 200 } ], afterResponse: 'recordServerTiming' } },
          { get: { url: '/api/units', expect: [ { statusCode: 200 } ], afterResponse: 'recordServerTiming' } },
        ],
      },
      {
        name: 'Reports endpoints',
        flow: [
          { post: { url: '/api/reports/services', json: { dateRange: 'custom', startDate: iso(start), endDate: iso(end), limit: 100 }, expect: [ { statusCode: 200 } ], afterResponse: 'recordServerTiming' } },
          { post: { url: '/api/reports/chemicals/summary', json: { dateRange: 'custom', startDate: iso(start), endDate: iso(end) }, expect: [ { statusCode: 200 } ], afterResponse: 'recordServerTiming' } },
          { post: { url: '/api/reports/equipment/logs', json: { startDate: iso(start), endDate: iso(end), limit: 100 }, expect: [ { statusCode: 200 } ], afterResponse: 'recordServerTiming' } },
        ],
      },
    ],
  }

  await fs.writeFile(path.resolve('artillery.config.json'), JSON.stringify(artilleryConfig, null, 2), 'utf-8')

  console.log('[perf-prep] Wrote lhci-headers.json and artillery.config.json')
}

main().catch((e) => {
  console.error('[perf-prep] Error:', e.message)
  process.exit(1)
})
