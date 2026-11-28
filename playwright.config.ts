import { defineConfig, devices } from '@playwright/test'
import { E2E_ENV, E2E_PORT, E2E_STATE, E2E_URL } from './e2e/env.ts'

// End-to-end tests for the flows users depend on (AGENTS.md): quick add, Undo, edit, delete, and
// axe on every screen. They run against a production build on a separate database file.
export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: E2E_URL,
    storageState: E2E_STATE,
    locale: 'cs-CZ',
    timezoneId: 'Europe/Prague',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'phone',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm start --port ${E2E_PORT}`,
    url: `${E2E_URL}/prihlaseni`,
    env: E2E_ENV,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
})
