import { PlaywrightTestConfig } from '@playwright/test'

const config: PlaywrightTestConfig = {
  testDir: './e2e',
  use: {
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'vite e2e/test-app --port 3000',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  retries: process.env.CI ? 2 : 0,
}

export default config
