const { chromium } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');

(async () => {
  const evidence = path.resolve(__dirname, '../previews/b05-web/.vercel/hosted-evidence');
  await fs.mkdir(evidence, { recursive: true });
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium',
    headless: true,
    args: ['--no-sandbox'],
    ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}),
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  // Playwright's Node-side HTTPS client uses the configured environment CA.
  // Keep TLS verification on; do not change the user's browser trust store.
  await context.route('**/*', async route => {
    const response = await route.fetch({ timeout: 45000 });
    await route.fulfill({ response });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  const errors = [];
  const responses = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => {
    const url = new URL(r.url());
    if (url.hostname.endsWith('.vercel.app')) responses.push({ path: url.pathname, status: r.status(), type: r.headers()['content-type'] || '' });
  });
  const checks = [];
  try {
    const response = await page.goto(process.env.JJ_B05_SHARE_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.getByRole('heading', { name: 'Tu compra,\nbajo control.', exact: true }).waitFor();
    checks.push('Home visible on 390x844 viewport');
    await page.evaluate(() => document.fonts.ready);
    const fontStatus = await page.evaluate(() => ({ loaded: document.fonts.status, overflow: document.documentElement.scrollWidth > innerWidth }));
    if (fontStatus.overflow) throw new Error('Horizontal overflow');
    await page.screenshot({ path: path.join(evidence, 'home-390x844.png'), fullPage: true });

    await page.getByTestId('create-list').click();
    const form = page.getByTestId('app-sheet');
    await form.getByRole('textbox', { name: 'Nombre de la lista', exact: true }).fill('Prueba de publicación');
    await form.getByTestId('save-list').click();
    await form.waitFor({ state: 'detached' });
    const key = 'jjcompraintelwgiemt.shopping.v1';
    const before = await page.evaluate(k => localStorage.getItem(k), key);
    if (!before || !before.includes('Prueba de publicación')) throw new Error('List not persisted in fresh browser context');
    checks.push('Create list and browser-local persistence');

    await page.getByRole('tab', { name: 'Menús', exact: true }).click();
    await page.getByTestId('prepare-menu').click();
    await page.getByTestId('review-menu').click();
    const sheet = page.getByTestId('menu-sheet');
    await sheet.getByRole('heading', { name: 'Esto he entendido', exact: true }).waitFor();
    await page.screenshot({ path: path.join(evidence, 'menu-review-390x844.png'), fullPage: true });
    await sheet.getByRole('button', { name: 'Cancelar propuesta', exact: true }).click();
    await sheet.getByRole('button', { name: 'Cancelar sin añadir', exact: true }).click();
    await sheet.waitFor({ state: 'detached' });
    const after = await page.evaluate(k => localStorage.getItem(k), key);
    if (after !== before) throw new Error('Cancel changed shopping data');
    checks.push('Generate menu, review ingredients, cancel without changing shopping data');
    if (errors.length) throw new Error('Browser JavaScript errors: ' + JSON.stringify(errors));
    const bad = responses.filter(r => r.status >= 400 && r.path !== '/favicon.ico');
    if (bad.length) throw new Error('Failed deployment resources: ' + JSON.stringify(bad));
    const js = responses.find(r => r.path === '/_expo/static/js/web/index-8af4e805238fbf59fa096d0478793882.js' && r.status === 200);
    if (!js) throw new Error('Stable B05 bundle not loaded');
    const fontResponses = responses.filter(r => /\.(ttf|woff2?)$/.test(r.path) && r.status === 200);
    if (!fontResponses.length) throw new Error('No font loaded');
    checks.push('B05 bundle and fonts loaded over HTTPS; no JavaScript errors or horizontal overflow');
    const report = { verifiedAt: new Date().toISOString(), origin: new URL(page.url()).origin, viewport: { width: 390, height: 844 }, networkMethod: 'Playwright Node HTTPS fetch with configured CA, TLS verification enabled; responses fulfilled into Chromium without modifying its certificate store', status: 'passed', checks, httpStatus: response?.status(), fontStatus, fontResponses, responses, pageErrors: errors };
    await fs.writeFile(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ status: report.status, checks, evidence }));
  } catch (e) {
    await page.screenshot({ path: path.join(evidence, 'failure.png'), fullPage: true }).catch(() => {});
    await fs.writeFile(path.join(evidence, 'failure.json'), JSON.stringify({ at: new Date().toISOString(), message: e.message, url: page.url().split('?')[0], errors, responses, checks }, null, 2) + '\n');
    throw e;
  } finally {
    await context.close();
    await browser.close();
  }
})().catch(e => { console.error(e.message); process.exitCode = 1; });
