import { test, expect } from '@playwright/test'

function nextMondayIso(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = (8 - day) % 7 || 7
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0,10)
}

test('units: create, set custom schedule, schedule includes unit', async ({ page }) => {
  await page.goto('/')
  const property = await page.evaluate(async () => {
    const res = await fetch('/api/reports/lookups')
    const json = await res.json()
    const p = (json?.properties || [])[0]
    return { ok: res.ok && !!p?.id, id: p?.id, name: p?.name }
  })
  expect(property.ok).toBeTruthy()

  const unit = await page.evaluate(async (propertyId) => {
    const payload = {
      property_id: propertyId,
      name: `E2E Unit ${Date.now()}`,
      unit_type: 'villa_pool',
      water_type: 'saltwater',
      volume_litres: 10000,
    }
    const res = await fetch('/api/units', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
    const json = await res.json()
    return { ok: res.ok && !json.error, id: json?.unit?.id }
  }, property.id)
  expect(unit.ok).toBeTruthy()

  const scheduleUpsert = await page.evaluate(async (unitId) => {
    const payload = {
      schedule_type: 'simple',
      schedule_config: { frequency: 'daily', time_preference: '09:00' },
      service_types: { daily: ['full_service'] },
      name: 'E2E Custom',
      description: 'E2E',
    }
    const res = await fetch(`/api/units/${unitId}/custom-schedule`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
    const json = await res.json()
    return { ok: res.ok && !json.error }
  }, unit.id)
  expect(scheduleUpsert.ok).toBeTruthy()

  const date = nextMondayIso()
  // Wait until the unit reflects service_frequency=custom
  const confirmed = await page.evaluate<{ ok: boolean }, { id: string }>(
    async ({ id }) => {
      for (let i = 0; i < 10; i++) {
        const r = await fetch(`/api/units/${id}`)
        const j = await r.json().catch(() => ({}))
        const freq = j?.unit?.service_frequency
        if (r.ok && !j?.error && freq === 'custom') return { ok: true }
        await new Promise(res => setTimeout(res, 300))
      }
      return { ok: false }
    },
    { id: unit.id }
  )
  expect(confirmed.ok).toBeTruthy()

  const schedule = await page.evaluate<{ ok: boolean; tasks: any[] }, { d: string; propertyId: string }>(
    async ({ d, propertyId }) => {
      const res = await fetch(`/api/schedule?date=${d}&propertyId=${propertyId}`)
      const json = await res.json()
      return { ok: res.ok && !json.error, tasks: json?.tasks || [] }
    },
    { d: date, propertyId: property.id }
  )
  expect(schedule.ok).toBeTruthy()
  expect(schedule.tasks.some((t: any) => t.unit_id === unit.id)).toBeTruthy()

  const cleanup = await page.evaluate(async (unitId) => {
    const res = await fetch(`/api/units/${unitId}`, { method: 'DELETE' })
    const json = await res.json().catch(() => ({}))
    return { ok: res.ok && !json.error }
  }, unit.id)
  expect(cleanup.ok).toBeTruthy()
})
