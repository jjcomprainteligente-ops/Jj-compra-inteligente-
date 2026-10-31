import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:8081',
    locale: 'es-ES',
    // Existing Spanish regression cases start beyond onboarding; i18n cases
    // create independent, empty contexts to exercise first-run detection.
    storageState: { cookies: [], origins: [{ origin: 'http://127.0.0.1:8081', localStorage: [{
      name: 'jjcompraintelwgiemt.preferences.v1',
      value: JSON.stringify({ version: 1, language: 'es', welcomeCompleted: true }),
    }] }] },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: 'npx expo start --web --offline --port 8081 --max-workers 2',
    url: 'http://127.0.0.1:8081',
    reuseExistingServer: process.env.PLAYWRIGHT_EXPORTED_APP === '1' || !process.env.CI,
    timeout: 120_000,
    env: { EXPO_NO_TELEMETRY: '1' },
  },
});
