import { defineConfig } from '@playwright/test';
import path from 'node:path';

// Run against an already-built, already-served export. This isolated config
// never starts Expo or changes the existing Chromium verification matrix.
const evidence = process.env.WEBKIT_EVIDENCE_DIR ?? path.resolve(
  'test-results-webkit', new Date().toISOString().replace(/[:.]/g, '-'),
);

export default defineConfig({
  testDir: './tests/webkit',
  testMatch: 'webkit-readiness.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  outputDir: path.join(evidence, 'artifacts'),
  reporter: [['line'], ['json', { outputFile: path.join(evidence, 'results.json') }]],
  use: {
    browserName: 'webkit',
    baseURL: 'http://127.0.0.1:8081',
    locale: 'es-ES',
    timezoneId: 'UTC',
    storageState: { cookies: [], origins: [] },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH }
      : {},
  },
  projects: [
    { name: 'webkit-desktop', use: { viewport: { width: 1280, height: 1000 } } },
    { name: 'webkit-mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
