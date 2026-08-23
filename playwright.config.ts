import { defineConfig } from '@playwright/test';

const isCI = !!process.env.CI;
const PORT = Number(process.env.PORT || 4280);

// Default to the local working tree so tests validate the commit under review.
// Set BASE_URL to smoke-test a deployed environment instead.
const baseURL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? 'html' : 'list',
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: `node scripts/static-server.mjs --port ${PORT}`,
        url: `http://127.0.0.1:${PORT}/`,
        reuseExistingServer: !isCI,
        timeout: 30_000,
      },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
