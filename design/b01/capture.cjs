/* Reproducible screenshots of the executable B01 prototype, not native iPhone captures. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');

const base = __dirname;
const output = path.join(base, 'evidence');
const port = Number(process.env.B01_PORT || 8083);
const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.ttf': 'font/ttf', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const isReview = pathname === '/review.html' || pathname.startsWith('/evidence/') || pathname.endsWith('.svg');
  const root = isReview ? base : path.join(base, 'build');
  const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (!file.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { response.writeHead(404); response.end('Not found'); return; }
    response.setHeader('Content-Type', contentTypes[path.extname(file)] || 'application/octet-stream');
    response.end(data);
  });
});

async function main() {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  if (process.argv.includes('--serve')) { console.log(`B01: http://127.0.0.1:${port}/review.html`); return; }
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}),
    args: ['--no-sandbox'],
  });
  const checks = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }, { width: 430, height: 932 }]) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 2, reducedMotion: 'reduce', isMobile: true, hasTouch: true });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const variant of ['v1', 'v2', 'v3']) {
        for (const screen of ['home', 'empty', 'list']) {
          await page.goto(`http://127.0.0.1:${port}/?variant=${variant}&screen=${screen}`);
          const cta = page.getByTestId(screen === 'home' ? 'main-cta' : screen === 'empty' ? 'empty-cta' : 'list-cta');
          await cta.waitFor();
          await page.evaluate(() => document.fonts.ready);
          const box = await cta.boundingBox();
          const nav = await page.getByRole('tab', { name: 'Inicio', exact: true }).boundingBox();
          const noHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
          const ctaVisible = !!box && !!nav && box.y >= 0 && box.y + box.height <= nav.y + 2;
          checks.push({ variant, screen, viewport, noHorizontalOverflow, ctaVisible });
          await page.screenshot({ path: path.join(output, `${variant}-${screen}-${viewport.width}.png`) });
          if (viewport.width === 390 && screen === 'home') {
            await cta.click();
            await page.getByTestId('list-cta').waitFor();
            await page.getByRole('tab', { name: 'Inicio', exact: true }).click();
            await page.getByTestId('main-cta').waitFor();
          }
          if (viewport.width === 390 && screen === 'empty') {
            await cta.click();
            await page.getByTestId('list-cta').waitFor();
          }
          if (viewport.width === 390 && screen === 'list') {
            await cta.click();
            await page.getByText('Estás viendo un prototipo', { exact: true }).waitFor();
            await page.getByRole('button', { name: 'Entendido', exact: true }).click();
            const count = await page.evaluate(() => localStorage.length);
            if (count !== 0) throw new Error('El prototipo ha escrito datos locales');
          }
          console.log(`${variant} ${screen} ${viewport.width}×${viewport.height}: overflow=${!noHorizontalOverflow}, CTA=${ctaVisible}`);
        }
      }
      if (errors.length) throw new Error(errors.join('\n'));
      await context.close();
    }
    const review = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 });
    await review.goto(`http://127.0.0.1:${port}/review.html`);
    await review.locator('img').first().waitFor();
    await review.evaluate(async () => { await Promise.all([...document.images].map(image => image.decode())); });
    await review.locator('#compare-home').screenshot({ path: path.join(output, 'B01-comparativa-inicio.png') });
    await review.locator('#brands').screenshot({ path: path.join(output, 'B01-marcas.png') });
    await review.pdf({ path: path.join(output, 'B01-propuestas.pdf'), format: 'A3', landscape: true, printBackground: true, margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' } });
    const result = { timestamp: new Date().toISOString(), method: 'Chromium web, CSS viewport sizes; not iPhone hardware or iOS Safari', runtimeErrors: 0, homeNavigationChecks: 3, emptyNavigationChecks: 3, prototypeNoticeChecks: 3, localStorageChecks: 3, checks };
    fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify(result, null, 2));
    if (checks.some(item => !item.noHorizontalOverflow || !item.ctaVisible)) process.exitCode = 1;
    console.log(`Evidencia: ${output}`);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}

main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
