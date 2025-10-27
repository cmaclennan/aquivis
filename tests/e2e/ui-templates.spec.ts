import { test, expect } from '@playwright/test'

test('Templates UI: load, builder modal, rename, duplicate, delete', async ({ page }) => {
  await page.goto('/templates')
  await expect(page.getByRole('heading', { name: 'Schedule Templates' })).toBeVisible()

  await page.getByRole('button', { name: 'New Template' }).click()
  await expect(page.getByText('Create Template')).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()

  const templateName = `UI Template ${Date.now()}`
  const created = await page.evaluate(async (name) => {
    const body = {
      template_name: name,
      template_type: 'simple',
      template_config: { frequency: 'daily', time_preference: '09:00', service_types: { daily: ['test_only'] } },
      applicable_unit_types: ['villa_pool'],
      applicable_water_types: ['saltwater'],
      description: 'UI',
      is_active: true,
    }
    const res = await fetch('/api/templates', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json().catch(() => ({}))
    return { ok: res.ok && !json?.error, id: json?.template?.id }
  }, templateName)
  expect(created.ok).toBeTruthy()

  await page.reload()
  await page.waitForLoadState('networkidle')
  await expect(page.getByText(templateName)).toBeVisible({ timeout: 30000 })

  const rowByName = (name: string) => page.locator('div.py-3.flex.items-center.justify-between', { has: page.getByText(name, { exact: true }) }).first()

  const row = rowByName(templateName)
  await row.getByRole('button', { name: 'Rename' }).click()
  const newName = templateName + ' Renamed'
  const renameInput = page.getByRole('textbox').first()
  await renameInput.fill(newName)
  const saveBtn = page.getByRole('button', { name: 'Save' }).first()
  await saveBtn.click()
  await page.waitForLoadState('networkidle')
  await expect(page.getByText(newName)).toBeVisible({ timeout: 15000 })

  await rowByName(newName).getByRole('button', { name: 'Duplicate' }).click()
  const copyName = `Copy of ${newName}`
  await page.waitForLoadState('networkidle')
  await expect(page.getByText(copyName)).toBeVisible({ timeout: 15000 })

  await rowByName(copyName).getByRole('button', { name: 'Delete' }).click()
  await page.waitForLoadState('networkidle')
  await expect(page.getByText(copyName)).toHaveCount(0)

  await rowByName(newName).getByRole('button', { name: 'Delete' }).click()
  await page.waitForLoadState('networkidle')
  await expect(page.getByText(newName)).toHaveCount(0)
})
