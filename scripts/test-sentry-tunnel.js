#!/usr/bin/env node

// Simple integration test for the Sentry tunnel.
// Sends a valid envelope to `${BASE_URL}/monitoring` and asserts 200/202.
// Usage:
//   BASE_URL=https://www.aquivis.co NEXT_PUBLIC_SENTRY_DSN=... node scripts/test-sentry-tunnel.js

const BASE_URL = process.env.BASE_URL || 'https://www.aquivis.co'
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN

if (!DSN) {
  console.error('[sentry-tunnel-test] Missing NEXT_PUBLIC_SENTRY_DSN or SENTRY_DSN in env')
  process.exit(2)
}

function generateEventId() {
  return crypto.randomUUID().replace(/-/g, '')
}

async function main() {
  const eventId = generateEventId()
  const sentAt = new Date().toISOString()
  const timestamp = Math.floor(Date.now() / 1000)

  const envelope = [
    JSON.stringify({ sent_at: sentAt, dsn: DSN, sdk: { name: 'sentry.javascript.nextjs', version: '10.20.0' } }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify({
      event_id: eventId,
      timestamp,
      level: 'info',
      platform: 'javascript',
      message: 'Automated tunnel test event',
      environment: process.env.NODE_ENV || 'test-script'
    })
  ].join('\n')

  const res = await fetch(`${BASE_URL}/monitoring`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-sentry-envelope' },
    body: envelope
  })

  const ok = res.status === 200 || res.status === 202
  const headers = {}
  res.headers.forEach((v, k) => (headers[k] = v))

  if (!ok) {
    const text = await res.text().catch(() => '')
    console.error('[sentry-tunnel-test] FAIL', { status: res.status, headers, text })
    process.exit(1)
  }

  console.log('[sentry-tunnel-test] PASS', { status: res.status })
}

main().catch(err => {
  console.error('[sentry-tunnel-test] ERROR', err)
  process.exit(1)
})


