#!/usr/bin/env node
// Anonymous QA timings only. Never imports owner storage or sends analytics.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { createHash } = require('node:crypto');

const base = process.env.JJ_BENCHMARK_URL || 'http://127.0.0.1:8085';
const url = new URL(base);
if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname)
  || url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
  throw new Error('Benchmark requires a loopback HTTP origin.');
}
const repetitions = Number(process.env.JJ_BENCHMARK_REPETITIONS || '3');
if (!Number.isInteger(repetitions) || repetitions < 1 || repetitions > 5) throw new Error('Use one to five repetitions.');
const locales = { es: 'es-ES', en: 'en-GB', de: 'de-DE', fr: 'fr-FR' };
const viewports = [{ width: 375, height: 667 }, { width: 430, height: 932 }];
const reviewLabels = {
  es: 'Revisar ingredientes de esta receta', en: 'Review this recipe’s ingredients',
  de: 'Zutaten dieses Rezepts prüfen', fr: 'Vérifier les ingrédients de cette recette',
};
const key = 'jjcompraintelwgiemt.shopping.v1';

async function main() {
  const root = path.resolve(__dirname, '..');
  const parent = path.resolve(process.env.JJ_BENCHMARK_EVIDENCE_DIR || path.join(root, 'design/quality/local-evidence'));
  await fs.mkdir(parent, { recursive: true });
  const directory = await fs.mkdtemp(path.join(parent, 'benchmark-'));
  const document = await fetch(url.origin + '/');
  if (!document.ok) throw new Error('Compiled benchmark page is unavailable.');
  const entry = (await document.text()).match(/<script\b[^>]*\bsrc=["'](\/_expo\/static\/js\/web\/[a-zA-Z0-9-]+\.js)["']/i)?.[1];
  if (!entry) throw new Error('Expected one local compiled web entry.');
  const response = await fetch(url.origin + entry);
  if (!response.ok) throw new Error('Compiled benchmark bundle is unavailable.');
  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length || bytes.length > 32 * 1024 * 1024) throw new Error('Unexpected compiled bundle size.');
  const result = { startedAt: new Date().toISOString(), status: 'running',
    compiled: { entry, decodedBytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') },
    method: 'Chromium loopback export, isolated empty browser context per run; automation action-to-ready timings include browser/automation overhead. Shared cloud CPU and OS caches are uncontrolled. Not physical iPhone, real-network or Web Vitals certification.',
    privacy: 'Only fixed route names, durations, resource byte counts, language and CSS size. No names, notes, prices, identifiers, account/session data or persistent browser state in this report; no telemetry service or network destination.',
    repetitions, runs: [], summaries: [], errors: [] };
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium',
      headless: true, args: ['--no-sandbox'] });
    for (const viewport of viewports) for (const [language, locale] of Object.entries(locales)) {
      for (let repetition = 1; repetition <= repetitions; repetition++) {
        const context = await browser.newContext({ baseURL: url.origin, viewport, locale, isMobile: true, hasTouch: true,
          storageState: { cookies: [], origins: [] } });
        const page = await context.newPage(); page.setDefaultTimeout(25000);
        const runtimeErrors = [], externalRequests = [], timings = {};
        page.on('pageerror', () => runtimeErrors.push('pageerror'));
        page.on('request', request => {
          if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== url.origin) externalRequests.push('external-origin');
        });
        const measure = async (name, action) => {
          const started = performance.now(); await action(); timings[name] = Math.round((performance.now() - started) * 100) / 100;
        };
        try {
          await measure('export_to_welcome', async () => {
            await page.goto('/'); await expect(page.getByTestId('welcome-title')).toBeVisible();
            await page.evaluate(() => document.fonts.ready);
          });
          await page.getByTestId('start-app').click();
          await expect(page.getByTestId('tab-home')).toBeVisible();
          await measure('create_list', async () => {
            await page.getByTestId('create-list').click();
            const sheet = page.getByTestId('app-sheet');
            await sheet.getByRole('textbox').first().fill('QA benchmark');
            await sheet.getByTestId('save-list').click(); await expect(sheet).toHaveCount(0);
          });
          await page.getByTestId('tab-menus').click();
          await measure('open_catalogue', async () => {
            await page.getByTestId('menus-section-discover').click();
            await expect(page.getByTestId('menu-catalog-count')).toBeVisible();
            await expect(page.getByTestId('menu-catalog-recipe-JJ-E03-001')).toBeAttached();
          });
          await measure('open_recipe', async () => {
            await page.getByTestId('menu-catalog-recipe-JJ-E03-001').click();
            await expect(page.getByTestId('recipe-servings')).toHaveText('2');
          });
          await measure('review_ingredients', async () => {
            await page.getByTestId('menu-sheet').getByRole('button', { name: reviewLabels[language], exact: true }).click();
            await expect(page.getByTestId('confirm-ingredients')).toBeVisible();
          });
          await measure('save_reviewed_ingredients', async () => {
            await page.getByTestId('confirm-ingredients').click();
            await expect(page.getByTestId('menu-sheet')).toHaveCount(0);
            await expect(page.getByTestId('tab-list')).toHaveAttribute('aria-selected', 'true');
            await expect.poll(() => page.evaluate(key => {
              const stored = JSON.parse(localStorage.getItem(key) || 'null');
              return stored?.state?.lists?.[0]?.items?.length || 0;
            }, key)).toBeGreaterThan(0);
          });
          await measure('reload_saved_list', async () => {
            await page.reload(); await expect(page.getByTestId('welcome-title')).toHaveCount(0);
            await expect(page.getByTestId('tab-home')).toBeVisible();
          });
          expect(runtimeErrors).toEqual([]); expect(externalRequests).toEqual([]);
          const resources = await page.evaluate(() => {
            const entries = performance.getEntriesByType('resource');
            return { count: entries.length, transferBytes: entries.reduce((sum, entry) => sum + entry.transferSize, 0),
              decodedBodyBytes: entries.reduce((sum, entry) => sum + entry.decodedBodySize, 0) };
          });
          result.runs.push({ language, viewport, repetition, timings, resourcesAfterReload: resources, passed: true });
          console.log(JSON.stringify({ language, width: viewport.width, repetition, passed: true }));
        } finally { await context.close(); }
      }
    }
    for (const name of Object.keys(result.runs[0].timings)) {
      const values = result.runs.map(run => run.timings[name]).sort((a, b) => a - b);
      result.summaries.push({ action: name, samples: values.length, minimumMs: values[0],
        medianMs: values[Math.floor(values.length / 2)], p95Ms: values[Math.ceil(values.length * .95) - 1], maximumMs: values.at(-1) });
    }
    result.status = 'passed';
  } catch (error) {
    result.status = 'failed'; result.errors.push({ name: error.name, message: 'Benchmark did not complete; inspect private runner output.' });
    process.exitCode = 1;
  } finally {
    await browser?.close(); result.finishedAt = new Date().toISOString();
    await fs.writeFile(path.join(directory, 'report.json'), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify({ status: result.status, completedRuns: result.runs.length, report: path.join(directory, 'report.json') }));
  }
}
main().catch(error => { console.error(error.name + ': Benchmark setup failed.'); process.exitCode = 1; });
