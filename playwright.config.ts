import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  name: 'CCU E2E Tests',
  testDir: './test/e2e',
  snapshotDir: './test/e2e/snapshots',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: Boolean(process.env.CI),
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [['blob', { outputDir: 'blob-report' }], ['github']]
    : [['html', { open: 'never' }]],
  timeout: 1 * 60 * 1000,
  reportSlowTests: {
    max: 10,
    threshold: 30_000,
  },
  expect: {
    timeout: 10_000,
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.VITE_APP_BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    // Set browsers for setups since playwright defaults to chromium
    // if no browsers are defined. By doing this, we don't have to download
    // chromium for non-chromium tests in CI.
    {
      name: 'chromium-setup',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'firefox-setup',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'webkit-setup',
      use: { ...devices['Desktop Safari'] },
      testMatch: /.*\.setup\.ts/,
    },

    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['chromium-setup'],
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['firefox-setup'],
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['webkit-setup'],
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ..devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.PW_SKIP_WEBSERVER
    ? []
    : [
        {
          command:
            'echo "Starting WEB SERVER on port 8080" && pnpm run preview --port 8080',
          url: 'http://localhost:8080',
          timeout: 120 * 1000,
          reuseExistingServer: !process.env.CI,
          stdout: 'pipe',
        },
      ],
});
