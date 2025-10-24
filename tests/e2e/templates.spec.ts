import { test, expect } from '@playwright/test'

test('templates: create, list, patch, delete', async ({ page }) => {
  await page.goto('/')
  const created = await page.evaluate(async () => {
    const body = {
      template_name: `E2E Template ${Date.now()}`,
      template_type: 'simple',
      template_config: { frequency: 'weekly', time_preference: '09:00', service_types: { weekly: ['test_only'] } },
      applicable_unit_types: ['main_pool'],
      applicable_water_types: ['saltwater'],
      description: 'E2E',
      is_active: true,
    }
    const res = await fetch('/api/templates', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json()
    return { ok: res.ok && !json.error, id: json?.template?.id, name: json?.template?.template_name }
  })
  expect(created.ok).toBeTruthy()
  expect(created.id).toBeTruthy()

  const listed = await page.evaluate(async () => {
    const res = await fetch('/api/templates')
    const json = await res.json()
    return { ok: res.ok && !json.error, items: json?.templates || [] }
  })
  expect(listed.ok).toBeTruthy()
  expect(listed.items.some((t: any) => t.id === created.id)).toBeTruthy()

  const patched = await page.evaluate(async (id) => {
    const res = await fetch(`/api/templates/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ description: 'Updated by E2E' }) })
    const json = await res.json()
    return { ok: res.ok && !json.error }
  }, created.id)
  expect(patched.ok).toBeTruthy()

  const deleted = await page.evaluate(async (id) => {
    const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    const json = await res.json().catch(() => ({}))
    return { ok: res.ok && !json.error }
  }, created.id)
  expect(deleted.ok).toBeTruthy()
})
