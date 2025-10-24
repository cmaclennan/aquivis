import { test, expect } from '@playwright/test'

function iso(d: Date) { return d.toISOString().slice(0,10) }

test('reports: services, chemicals, equipment logs, billing, lookups', async ({ page }) => {
  await page.goto('/')
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 30)

  const services = await page.evaluate<{ ok: boolean; items: any[] }, { start: string; end: string }>(
    async ({ start, end }) => {
      const res = await fetch('/api/reports/services', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ dateRange: 'custom', startDate: start, endDate: end }) })
      const json = await res.json()
      return { ok: res.ok && !json.error, items: json?.services || [] }
    },
    { start: iso(start), end: iso(end) }
  )
  expect(services.ok).toBeTruthy()
  expect(Array.isArray(services.items)).toBeTruthy()

  const chems = await page.evaluate<{ ok: boolean; totals: Record<string, any> }, { start: string; end: string }>(
    async ({ start, end }) => {
      const res = await fetch('/api/reports/chemicals/summary', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ dateRange: 'custom', startDate: start, endDate: end }) })
      const json = await res.json()
      return { ok: res.ok && !json.error, totals: json?.totals || {} }
    },
    { start: iso(start), end: iso(end) }
  )
  expect(chems.ok).toBeTruthy()
  expect(typeof chems.totals).toBe('object')

  const logs = await page.evaluate<{ ok: boolean; items: any[] }, { start: string; end: string }>(
    async ({ start, end }) => {
      const res = await fetch('/api/reports/equipment/logs', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ startDate: start, endDate: end }) })
      const json = await res.json()
      return { ok: res.ok && !json.error, items: json?.logs || [] }
    },
    { start: iso(start), end: iso(end) }
  )
  expect(logs.ok).toBeTruthy()
  expect(Array.isArray(logs.items)).toBeTruthy()

  const billing = await page.evaluate<{ ok: boolean; keys: string[] }, { start: string; end: string }>(
    async ({ start, end }) => {
      const res = await fetch('/api/reports/billing', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ startDate: start, endDate: end }) })
      const json = await res.json()
      return { ok: res.ok && !json.error, keys: Object.keys(json || {}) }
    },
    { start: iso(start), end: iso(end) }
  )
  expect(billing.ok).toBeTruthy()
  expect(billing.keys.includes('chemicals')).toBeTruthy()

  const lookups = await page.evaluate<{ ok: boolean; props: any[] }>(async () => {
    const res = await fetch('/api/reports/lookups')
    const json = await res.json()
    return { ok: res.ok && !json.error, props: json?.properties || [] }
  })
  expect(lookups.ok).toBeTruthy()
  expect(Array.isArray(lookups.props)).toBeTruthy()
})
