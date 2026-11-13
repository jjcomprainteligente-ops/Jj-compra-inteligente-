import { defineConfig } from '@playwright/test';
import path from 'node:path';
import os from 'node:os';

const evidence = process.env.QUALITY_EVIDENCE_DIR ?? path.join(os.tmpdir(), 'jj-quality', new Date().toISOString().replace(/[:.]/g, '-'));
process.env.QUALITY_AUDIT = '1';
process.env.QUALITY_MOBILE_ONLY = '1';
process.env.COVERAGE_EVIDENCE_DIR = evidence;

export default defineConfig({
  testDir: './tests/e2e', testMatch: 'coverage-visual.spec.ts', workers: 1, fullyParallel: false,
  timeout: 180_000, retries: 0, outputDir: path.join(evidence, 'artifacts'),
  reporter: [['line'], ['json', { outputFile: path.join(evidence, 'results.json') }]],
  projects: [{ name: 'desktop', use: { browserName: 'chromium', launchOptions: {
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? '/usr/bin/chromium', args: ['--no-sandbox'],
  } } }],
});
