import { defineConfig } from '@playwright/test';
import path from 'node:path';

// Bloque 02 acceptance only. Serve a reviewed static export first, or pass the
// protected staging origin and a private share URL through the environment.
// No Expo server, persisted credentials, owner storage or prior browser state is used.
const evidence = process.env.JJ_DAILY_EVIDENCE_DIR ?? path.resolve(
  'design/iphone-pilot/local-evidence', `recipe-first-${new Date().toISOString().replace(/[:.]/g, '-')}`,
);

export default defineConfig({
  testDir: './tests/iphone-pilot',
  testMatch: 'recipe-first.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  outputDir: path.join(evidence, 'artifacts'),
  reporter: [['line'], ['json', { outputFile: path.join(evidence, 'results.json') }]],
  use: {
    baseURL: process.env.JJ_DAILY_BASE_URL ?? 'http://127.0.0.1:8092',
    timezoneId: 'UTC',
    storageState: { cookies: [], origins: [] },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        browserName: 'chromium',
        viewport: { width: 1280, height: 1000 },
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
          : {},
      },
    },
    ...[
      { name: 'webkit-375', viewport: { width: 375, height: 667 }, deviceScaleFactor: 2 },
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
