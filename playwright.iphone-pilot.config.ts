import { defineConfig } from '@playwright/test';
import path from 'node:path';

// An existing static export must already be served here. This configuration
// does not start Expo, change the Chromium matrices or publish a development server.
const evidence = process.env.IPHONE_PILOT_EVIDENCE_DIR ?? path.resolve(
  'design/iphone-pilot/local-evidence', new Date().toISOString().replace(/[:.]/g, '-'),
);

export default defineConfig({
  testDir: './tests/iphone-pilot',
  testMatch: ['purchase-journey.spec.ts', 'v83-recipes.spec.ts'],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  outputDir: path.join(evidence, 'artifacts'),
  reporter: [['line'], ['json', { outputFile: path.join(evidence, 'results.json') }]],
  use: {
    browserName: 'webkit',
    baseURL: process.env.IPHONE_PILOT_BASE_URL ?? 'http://127.0.0.1:8081',
    timezoneId: 'UTC',
    storageState: { cookies: [], origins: [] },
    isMobile: true,
    hasTouch: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH }
      : {},
  },
  projects: [
    { name: 'webkit-375', use: { viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 } },
    { name: 'webkit-430', use: { viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 } },
  ],
});
