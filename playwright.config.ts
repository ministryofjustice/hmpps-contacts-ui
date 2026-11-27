import { defineConfig, devices } from '@playwright/test'

// Runs against the app started with feature.env (wiremock on :9091, redis on :6379, app on :3007).
// Start dependencies with `docker compose -f docker-compose-test.yml up -d` and the app with `npm run start-feature`.
export default defineConfig({
  testDir: 'playwright_tests',
  testMatch: '**/*.pw.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3007',
    testIdAttribute: 'data-qa',
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 1400 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
