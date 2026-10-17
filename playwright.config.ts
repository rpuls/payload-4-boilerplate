import { defineConfig } from '@playwright/test'

import { baseURL, databaseURL, payloadSecret, port } from './tests/e2e/env'

const slowMo = Number(process.env.PLAYWRIGHT_SLOW_MO ?? '0')

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 180000,
  expect: {
    timeout: 15000,
  },
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    launchOptions: slowMo > 0 ? { slowMo } : undefined,
  },
  webServer: {
    command: 'node ./tests/e2e/web-server.mjs',
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_URL: databaseURL,
      PAYLOAD_SECRET: payloadSecret,
      NEXT_PUBLIC_SERVER_URL: baseURL,
      // Keep e2e runs local and deterministic: no bucket, no SMTP, no background job runner
      S3_BUCKET: '',
      SMTP_HOST: '',
      DISABLE_JOBS_AUTORUN: 'true',
    },
    timeout: 600000,
  },
})
