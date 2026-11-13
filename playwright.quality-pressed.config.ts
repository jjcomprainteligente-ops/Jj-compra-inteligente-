import { defineConfig } from '@playwright/test';
import path from 'node:path';
import os from 'node:os';

const evidence = process.env.QUALITY_PRESSED_EVIDENCE_DIR ?? path.join(os.tmpdir(), 'jj-quality-pressed', new Date().toISOString().replace(/[:.]/g, '-'));
export default defineConfig({
  testDir: './tests/quality', testMatch: 'pressed-controls.spec.ts', workers: 1, retries: 0,
  timeout: 60_000, outputDir: path.join(evidence, 'artifacts'),
  reporter: [['line'], ['json', { outputFile: path.join(evidence, 'results.json') }]],
  use: { browserName: 'chromium', launchOptions: {
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? '/usr/bin/chromium', args: ['--no-sandbox'],
  } },
});
