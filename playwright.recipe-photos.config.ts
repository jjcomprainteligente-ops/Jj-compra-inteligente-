import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { tmpdir } from 'node:os';

// Serve the reviewed export before running. This focused matrix does not start
// Expo or reuse browser state, and does not certify a physical iPhone.
const evidence = process.env.JJ_PHOTO_EVIDENCE_DIR ?? path.join(
  tmpdir(), `jj-photo-status-${new Date().toISOString().replace(/[:.]/g, '-')}`,
);

export default defineConfig({
  testDir: './tests/recipe-photos',
  testMatch: 'photo-status.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  outputDir: path.join(evidence, 'artifacts'),
  reporter: [['line'], ['json', { outputFile: path.join(evidence, 'results.json') }]],
  use: {
    baseURL: process.env.JJ_PHOTO_BASE_URL ?? 'http://127.0.0.1:8093',
    timezoneId: 'UTC',
    storageState: { cookies: [], origins: [] },
    screenshot: 'only-on-failure',
    // A staging share URL may contain a short-lived credential. Screenshots and
    // explicit reports suffice here; do not record that URL in a browser trace.
    trace: 'off',
  },
  projects: [
    ...[
      { name: 'chromium-375', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
      { name: 'chromium-430', viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true },
      { name: 'chromium-desktop', viewport: { width: 1280, height: 1000 }, isMobile: false, hasTouch: false },
    ].map(project => ({
      name: project.name,
      use: {
        browserName: 'chromium' as const,
        viewport: project.viewport,
        isMobile: project.isMobile,
        hasTouch: project.hasTouch,
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
          : {},
      },
    })),
    ...[
      { name: 'webkit-375', viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 },
      { name: 'webkit-430', viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 },
    ].map(project => ({
      name: project.name,
      use: {
        browserName: 'webkit' as const,
        viewport: project.viewport,
        deviceScaleFactor: project.deviceScaleFactor,
        isMobile: true,
        hasTouch: true,
        launchOptions: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH
          ? { executablePath: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH }
          : {},
      },
    })),
  ],
});
