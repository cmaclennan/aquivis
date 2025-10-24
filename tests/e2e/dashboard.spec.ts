import { test, expect } from '@playwright/test'

// Uses global storage state produced by the setup project.
test('dashboard shows stat cards', async ({ page }) => {
  await page.goto('/dashboard')

  // If we got redirected to login, storage state is missing.
  if (page.url().includes('/login')) {
    throw new Error('Not authenticated. Ensure setup project created storage state and E2E creds are set for auth.setup.ts')
  }

  await expect(page.getByText('Properties', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Units', { exact: true }).first()).toBeVisible()
  await expect(page.getByText(/Today'?s Services/i).first()).toBeVisible()
  await expect(page.getByText(/This Week/i).first()).toBeVisible()
})
