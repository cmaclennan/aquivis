import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120 * 1000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    headless: true,
    extraHTTPHeaders: {
      'x-e2e-bypass': '1',
    },
  },
  projects: [
    {
      name: 'setup',
      testMatch: 'tests/e2e/auth.setup.ts',
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 300 * 1000,
    env: {
      E2E_TEST_MODE: '1',
    },
  },
})
