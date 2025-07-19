// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  /* Fail the build if CI is true and tests failed */
  forbidOnly: !!process.env.CI,
  /* Re-run failed tests in CI */
  retries: process.env.CI ? 2 : 0,
  /* Reporter config */
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in tests */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    /* Record trace on failure. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Capture screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'on-first-retry',
    /* Enable all browser permissions */
    permissions: ['geolocation', 'notifications'],
    /* Collect test coverage */
    ...(process.env.COVERAGE && {
      launchOptions: {
        extensions: [require.resolve('playwright-test-coverage')],
      },
    }),
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* Test against mobile viewports */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
    /* Visual testing project */
    {
      name: 'visual',
      use: {
        ...devices['Desktop Chrome'],
        screenshot: 'on',
        video: 'off',
      },
      testMatch: /visual\.spec\.js/,
    },
  ],
  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'test-results/',
  /* Folder for storing cache between test runs */
  snapshotDir: './snapshots/',
  /* Run webserver before tests */
  webServer: {
    command: 'cd ../frontend && npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
