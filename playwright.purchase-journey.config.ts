import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { tmpdir } from 'node:os';

// Serve the reviewed web export first. Every case gets an empty browser context;
// neither a source checkout nor a mobile viewport certifies a physical iPhone.
const evidence = process.env.JJ_JOURNEY_EVIDENCE_DIR ?? path.join(
  tmpdir(), `jj-purchase-journey-${new Date().toISOString().replace(/[:.]/g, '-')}`,
);

export default defineConfig({
  testDir: './tests/purchase-journey',
  testMatch: ['journey.spec.ts', 'home-entry-layout.spec.ts'],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  outputDir: path.join(evidence, 'artifacts'),
  reporter: [['line'], ['json', { outputFile: path.join(evidence, 'results.json') }]],
  use: {
    baseURL: process.env.JJ_JOURNEY_BASE_URL ?? 'http://127.0.0.1:8095',
    timezoneId: 'UTC',
    storageState: { cookies: [], origins: [] },
    screenshot: 'only-on-failure',
    // Share credentials must never be recorded in a trace or public evidence.
    trace: 'off',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        browserName: 'chromium', viewport: { width: 1280, height: 1000 },
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {},
      },
    },
    ...[
      { name: 'webkit-375', viewport: { width: 375, height: 812 }, deviceScaleFactor: 2 },
      { name: 'webkit-430', viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 },
    ].map(project => ({
      name: project.name,
      use: {
        browserName: 'webkit' as const,
        viewport: project.viewport, deviceScaleFactor: project.deviceScaleFactor,
        isMobile: true, hasTouch: true,
        launchOptions: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH
          ? { executablePath: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH } : {},
      },
    })),
  ],
});
