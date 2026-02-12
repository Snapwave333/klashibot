const { defineConfig, devices } = require('@playwright/test');

/**
 * Advanced Playwright Configuration for Kalshi Trading Bot Dashboard
 * Comprehensive E2E testing with multiple browsers, parallel execution, and detailed reporting
 */
module.exports = defineConfig({
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
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  // Output settings
  outputDir: 'test-results',

  // Global settings
  use: {
    baseURL: 'http://localhost:3003',

    // Screenshots and traces
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'on-first-retry',

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

  // Testing running Docker container directly
  // webServer block removed to avoid conflict with running container

  // Global setup/teardown
});
