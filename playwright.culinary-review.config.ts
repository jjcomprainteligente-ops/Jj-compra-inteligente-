import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { tmpdir } from 'node:os';

// Run against the reviewed static web export. Browser fixtures contain only QA
// data; the WebKit projects do not certify Safari or a physical iPhone.
const evidence = process.env.JJ_CULINARY_EVIDENCE_DIR ?? path.join(tmpdir(), 'jj-culinary-' + Date.now());
const baseURL = process.env.JJ_CULINARY_BASE_URL ?? 'http://127.0.0.1:8094';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'menus-privacy.spec.ts',
  grep: /(los filtros se aplican|preferencias y exclusiones|una nueva semana filtrada|una sustitución solo ofrece|(?:es|en|de|fr): filtros y privacidad traducidos)/,
  workers: 1,
  retries: 0,
  fullyParallel: false,
  timeout: 60_000,
  outputDir: path.join(evidence, 'artifacts'),
  reporter: [['line'], ['json', { outputFile: path.join(evidence, 'results.json') }]],
  use: {
    baseURL,
    locale: 'es-ES',
    timezoneId: 'UTC',
    // The four existing Spanish regression cases start after onboarding. The
    // four language cases create their own empty contexts and seed preferences.
    storageState: { cookies: [], origins: [{ origin: new URL(baseURL).origin, localStorage: [{
      name: 'jjcompraintelwgiemt.preferences.v1',
      value: JSON.stringify({ version: 1, language: 'es', welcomeCompleted: true }),
    }] }] },
    screenshot: 'only-on-failure',
    trace: 'off',
  },
  projects: [
    { name: 'chromium-desktop', use: {
      browserName: 'chromium', viewport: { width: 1280, height: 1000 },
      launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {},
    } },
    ...[
      { name: 'webkit-375', width: 375, height: 812, deviceScaleFactor: 2 },
      { name: 'webkit-430', width: 430, height: 932, deviceScaleFactor: 3 },
    ].map(project => ({
      name: project.name,
      use: {
        browserName: 'webkit' as const,
        viewport: { width: project.width, height: project.height },
        deviceScaleFactor: project.deviceScaleFactor,
        isMobile: true, hasTouch: true,
        launchOptions: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH
          ? { executablePath: process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE_PATH } : {},
      },
    })),
  ],
});
