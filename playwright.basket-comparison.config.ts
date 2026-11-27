import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { tmpdir } from 'node:os';

// Private browser artifacts only. A protected share URL is navigation input only.
const evidence = process.env.JJ_BASKET_COMPARISON_EVIDENCE_DIR ?? path.join(
  tmpdir(), `jj-basket-comparison-${new Date().toISOString().replace(/[:.]/g, '-')}`,
);

export default defineConfig({
  testDir: './tests/basket-comparison',
  testMatch: 'comparison.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 240_000,
  outputDir: path.join(evidence, 'artifacts'),
  reporter: [['line'], ['json', { outputFile: path.join(evidence, 'results.json') }]],
  use: {
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    baseURL: process.env.JJ_BASKET_COMPARISON_BASE_URL ?? 'http://127.0.0.1:8099',
    timezoneId: 'UTC',
    storageState: { cookies: [], origins: [] },
    screenshot: 'only-on-failure',
    trace: 'off',
    video: 'off',
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
