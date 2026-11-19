import { defineConfig } from '@playwright/test';
import path from 'node:path';

// This engine check uses an existing static export, without starting Expo or
// altering the Chromium configuration. It does not validate an Apple device.
const evidence = process.env.WEBKIT_EVIDENCE_DIR ?? path.resolve(
  'test-results-stores-webkit', new Date().toISOString().replace(/[:.]/g, '-'),
);
const baseURL = process.env.WEBKIT_BASE_URL ?? 'http://127.0.0.1:8081';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['store-pilot.spec.ts', 'list-sharing.spec.ts'],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  outputDir: path.join(evidence, 'artifacts'),
  reporter: [['line'], ['json', { outputFile: path.join(evidence, 'results.json') }]],
  use: {
    browserName: 'webkit',
    baseURL,
    locale: 'es-ES',
    timezoneId: 'UTC',
    // Legacy store cases start beyond onboarding. Language/share cases replace
    // these preferences with their own isolated, explicit QA fixture.
    storageState: { cookies: [], origins: [{ origin: new URL(baseURL).origin, localStorage: [{
      name: 'jjcompraintelwgiemt.preferences.v1',
      value: JSON.stringify({ version: 1, language: 'es', welcomeCompleted: true }),
    }] }] },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH }
      : {},
  },
  projects: [
    { name: 'stores-webkit-desktop', use: { viewport: { width: 1280, height: 1000 } } },
    { name: 'stores-webkit-mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
});
