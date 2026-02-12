import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Kalashi Trading Bot Dashboard
 * E2E testing with Chromium in headless mode
 */
export default defineConfig({
  testDir: './tests',

  // Test execution settings
  timeout: 120000, // 2 minutes per test
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },

  // Parallel execution
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 2 : 1,

  // Reporting
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  // Output settings
  outputDir: 'test-results',

  // Global settings
  use: {
    baseURL: 'http://localhost:3003',

    // Screenshots and traces
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',

    // Browser settings
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 15000,
    navigationTimeout: 30000,

    // Network settings
    ignoreHTTPSErrors: true,

    // Accessibility
    colorScheme: 'dark',
  },

  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-web-security', '--allow-running-insecure-content'],
        },
      },
    },
  ],

  // Auto-start dev server before running tests
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3003',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start
  },
});
