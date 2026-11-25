import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { tmpdir } from 'node:os';

// Run against the reviewed export. Evidence and browser state stay outside Git.
const evidence = process.env.JJ_VARIABLE_EVIDENCE_DIR ?? path.join(
  tmpdir(), `jj-variable-meals-${new Date().toISOString().replace(/[:.]/g, '-')}`,
);

export default defineConfig({
  testDir: './tests/variable-meals',
  testMatch: 'variable-meals.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 240_000,
  outputDir: path.join(evidence, 'artifacts'),
  reporter: [['line'], ['json', { outputFile: path.join(evidence, 'results.json') }]],
  use: {
    baseURL: process.env.JJ_VARIABLE_BASE_URL ?? 'http://127.0.0.1:8096',
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
