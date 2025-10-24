import { test, expect } from '@playwright/test'

test('property rules: create, list, patch, delete', async ({ page }) => {
  await page.goto('/')
  const property = await page.evaluate(async () => {
    const res = await fetch('/api/reports/lookups')
    const json = await res.json()
    const p = (json?.properties || [])[0]
    return { ok: res.ok && !!p?.id, id: p?.id, name: p?.name }
  })
  expect(property.ok).toBeTruthy()

  const created = await page.evaluate(async (propertyId) => {
    const payload = {
      property_id: propertyId,
      rule_name: `E2E Random ${Date.now()}`,
      rule_config: { frequency: 'weekly', time_preference: '09:00', selection_count: 1, service_types: { weekly: ['test_only'] } },
      is_active: true,
    }
    const res = await fetch('/api/property-rules', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
    const json = await res.json()
    return { ok: res.ok && !json.error, id: json?.rule?.id }
  }, property.id)
  expect(created.ok).toBeTruthy()

  const listed = await page.evaluate(async (propertyId) => {
    const res = await fetch(`/api/property-rules?propertyId=${propertyId}`)
    const json = await res.json()
    return { ok: res.ok && !json.error, items: json?.rules || [] }
  }, property.id)
  expect(listed.ok).toBeTruthy()
  expect(listed.items.some((r: any) => r.id === created.id)).toBeTruthy()

  const patched = await page.evaluate(async (ruleId) => {
    const res = await fetch(`/api/property-rules/${ruleId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ is_active: false }) })
    const json = await res.json()
    return { ok: res.ok && !json.error }
  }, created.id)
  expect(patched.ok).toBeTruthy()

  const deleted = await page.evaluate(async (ruleId) => {
    const res = await fetch(`/api/property-rules/${ruleId}`, { method: 'DELETE' })
    const json = await res.json().catch(() => ({}))
    return { ok: res.ok && !json.error }
  }, created.id)
  expect(deleted.ok).toBeTruthy()
})
