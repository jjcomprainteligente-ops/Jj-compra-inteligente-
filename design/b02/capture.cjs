/* B02 evidence: executable web mockups at iPhone-sized CSS viewports, never native iOS evidence. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');

const base = __dirname;
const output = path.join(base, 'evidence');
const port = Number(process.env.B02_PORT || 8084);
const origin = `http://127.0.0.1:${port}`;
const scenes = [
  { id: 'home', screen: 'home', state: 'default', cta: true },
  { id: 'list', screen: 'list', state: 'default', cta: true },
  { id: 'savings', screen: 'savings', state: 'default' },
  { id: 'menus', screen: 'menus', state: 'default' },
  { id: 'profile', screen: 'profile', state: 'default' },
  { id: 'empty', screen: 'list', state: 'empty', cta: true },
  { id: 'loading', screen: 'home', state: 'loading' },
  { id: 'offline', screen: 'list', state: 'offline', cta: true },
  { id: 'mic-denied', screen: 'home', state: 'mic-denied' },
  { id: 'error', screen: 'list', state: 'error' },
  { id: 'long-list', screen: 'list', state: 'long-list', cta: true },
  { id: 'no-price', screen: 'savings', state: 'no-price' },
  { id: 'over-budget', screen: 'list', state: 'over-budget', cta: true },
  { id: 'stale-price', screen: 'savings', state: 'stale-price' },
  { id: 'incomparable', screen: 'savings', state: 'incomparable' },
  { id: 'add', screen: 'list', state: 'default', sheet: 'add' },
  { id: 'review', screen: 'list', state: 'default', sheet: 'review' },
  { id: 'recipe', screen: 'menus', state: 'default', sheet: 'recipe' },
  { id: 'household', screen: 'profile', state: 'default', sheet: 'household' },
];
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.ttf': 'font/ttf', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = http.createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, origin).pathname); }
  catch { response.writeHead(400); response.end(); return; }
  const root = pathname === '/review.html' || pathname.startsWith('/evidence/') ? base : path.join(base, 'build');
  const file = pathname === '/brand.svg'
    ? path.join(base, '../b01/assets/v3-icon.svg')
    : path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  if (pathname !== '/brand.svg' && !file.startsWith(root + path.sep)) { response.writeHead(403); response.end(); return; }
  fs.readFile(file, (error, contents) => {
    if (error) { response.writeHead(404); response.end('Not found'); return; }
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    response.end(contents);
  });
});

async function settle(page, scene) {
  const query = new URLSearchParams({ screen: scene.screen, state: scene.state, ...(scene.sheet ? { sheet: scene.sheet } : {}) });
  await page.goto(`${origin}/?${query}`);
  await page.getByTestId('screen-ready').waitFor();
  if (scene.sheet) await page.getByTestId('sheet-ready').waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function checkAndCapture(page, scene, viewport, scale = 1) {
  await settle(page, scene);
  let textScaleSimulation = null;
  if (scale !== 1) {
    textScaleSimulation = await page.locator('[dir="auto"]').evaluateAll((nodes, multiplier) => {
      const texts = nodes.filter(node => !['INPUT', 'TEXTAREA'].includes(node.tagName));
      // Snapshot all sizes first; nested text never receives an accidental second multiplication.
      const computed = texts.map(node => ({ node, size: parseFloat(getComputedStyle(node).fontSize), lineHeight: parseFloat(getComputedStyle(node).lineHeight) }));
      for (const { node, size, lineHeight } of computed) {
        if (Number.isFinite(size)) node.style.fontSize = `${size * multiplier}px`;
        if (Number.isFinite(lineHeight)) node.style.lineHeight = `${lineHeight * multiplier}px`;
      }
      return { multiplier, textElements: computed.length, method: 'DOM text font-size and line-height only; no viewport zoom; not iOS Dynamic Type' };
    }, scale);
    if (!textScaleSimulation.textElements) throw new Error('No se encontraron textos para la simulación del 130 %');
  }
  const noHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  const clippedText = await page.locator('[dir="auto"]').evaluateAll(nodes => nodes.filter(node => {
    const box = node.getBoundingClientRect();
    return box.width && box.height && box.bottom > 0 && box.top < innerHeight && (box.left < -1 || box.right > innerWidth + 1);
  }).map(node => ({ text: node.textContent.slice(0, 100), left: node.getBoundingClientRect().left, right: node.getBoundingClientRect().right })));
  const localStorageEntries = await page.evaluate(() => localStorage.length);
  let ctaVisible = null;
  if (scene.cta && scale === 1) {
    const cta = await page.getByTestId('main-cta').boundingBox();
    const tab = await page.getByRole('tab', { name: 'Inicio', exact: true }).boundingBox();
    ctaVisible = !!cta && !!tab && cta.y >= 0 && cta.y + cta.height <= tab.y + 2;
  }
  const id = scale === 1 ? scene.id : `large-text-${scene.screen}`;
  await page.screenshot({ path: path.join(output, `${id}-${viewport.width}.png`) });
  console.log(`${id} ${viewport.width}×${viewport.height}: overflow=${!noHorizontalOverflow}; CTA=${ctaVisible === null ? 'no aplica' : ctaVisible}`);
  return { id, screen: scene.screen, state: scene.state, sheet: scene.sheet || null, viewport, noHorizontalOverflow, clippedText, localStorageEntries, ctaVisible, textScaleSimulation };
}

async function captureReview(browser) {
  const review = await browser.newPage({ viewport: { width: 1440, height: 1200 }, deviceScaleFactor: 1 });
  await review.goto(`${origin}/review.html`);
  await review.locator('img').first().waitFor();
  await review.evaluate(async () => { await Promise.all([...document.images].map(image => image.decode())); });
  await review.locator('#overview').screenshot({ path: path.join(output, 'B02-pantallas.png') });
  await review.locator('#secondary').screenshot({ path: path.join(output, 'B02-secundarias.png') });
  await review.pdf({ path: path.join(output, 'B02-diseno.pdf'), format: 'A3', landscape: true, printBackground: true, margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' } });
  await review.close();
}

async function exerciseFlows(page) {
  const flows = [];
  await settle(page, { screen: 'list', state: 'empty' });
  await page.getByTestId('main-cta').click();
  await page.getByRole('button', { name: 'Ver en la lista de ejemplo', exact: true }).click();
  await page.getByText('Escribe el nombre del producto.', { exact: true }).waitFor();
  await page.getByRole('textbox', { name: 'Nombre del producto', exact: true }).fill('Leche');
  await page.getByRole('button', { name: 'Unidad L', exact: true }).click();
  await page.getByRole('button', { name: 'Aumentar cantidad', exact: true }).click();
  await page.getByRole('button', { name: 'Ver en la lista de ejemplo', exact: true }).click();
  await page.getByTestId('main-cta').waitFor();
  await page.getByTestId('sheet-ready').waitFor({ state: 'detached' });
  assert.equal(await page.getByTestId('sheet-ready').count(), 0);
  flows.push('F1: empty → add → validation → preview list; no persistence');

  await settle(page, { screen: 'menus', state: 'default' });
  await page.getByRole('button', { name: 'Ver receta de ejemplo: Arroz con verduras', exact: true }).click();
  await page.getByTestId('sheet-ready').getByRole('button', { name: 'Revisar ingredientes', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Incluir Calabacín', exact: true }).click();
  assert.equal(await page.getByRole('checkbox', { name: 'Incluir Calabacín', exact: true }).getAttribute('aria-checked'), 'false');
  await page.getByRole('button', { name: 'Cancelar sin añadir', exact: true }).click();
  await page.getByRole('heading', { name: 'Esta semana, fácil.', exact: true }).waitFor();
  flows.push('F2: recipe → ingredient review → exclude → cancel');

  await settle(page, { screen: 'home', state: 'default' });
  await page.getByRole('button', { name: 'Escribir o pegar una lista para revisar', exact: true }).click();
  await page.getByRole('textbox', { name: 'Texto para revisar', exact: true }).fill('Leche, dos barras de pan y huevos');
  await page.getByRole('button', { name: 'Corregir Leche semidesnatada', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nombre del producto', exact: true }).fill('Leche sin lactosa');
  await page.getByRole('button', { name: 'Volver a la revisión', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Incluir Leche sin lactosa', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Confirmar vista de ejemplo', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(output, 'review-end-390.png') });
  await page.getByRole('button', { name: 'Cancelar sin añadir', exact: true }).click();
  flows.push('F3: external text draft → correct example → return to review → cancel; no AI');

  await settle(page, { screen: 'savings', state: 'no-price' });
  await page.getByTestId('savings-cta').click();
  await page.getByTestId('main-cta').waitFor();
  flows.push('F4: no price source → shopping list; no store required');

  await settle(page, { screen: 'profile', state: 'default' });
  await page.getByTestId('profile-cta').click();
  await page.getByText('Plan visual · Todavía sin sincronización', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Volver a mi perfil', exact: true }).click();
  await page.getByTestId('sheet-ready').waitFor({ state: 'detached' });
  assert.equal(await page.getByTestId('sheet-ready').count(), 0);
  flows.push('F5: household visual plan → close; no account or invitation');

  await settle(page, { screen: 'list', state: 'long-list' });
  assert.equal(await page.getByRole('checkbox').count(), 20);
  await page.getByRole('button', { name: /Editar Queso fresco/ }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(output, 'long-list-end-390.png') });
  const button = await page.getByTestId('main-cta').boundingBox();
  assert.ok(button && button.y >= 0 && button.y + button.height <= 844);
  assert.equal(await page.evaluate(() => localStorage.length), 0);
  flows.push('20-item list: last item reachable; add action stays visible');
  return flows;
}

async function main() {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  if (process.argv.includes('--serve')) { console.log(`B02: ${origin}/review.html`); return; }
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'], ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
  const checks = [];
  const runtimeErrors = [];
  let navigationChecks = 0;
  let flowChecks = [];
  try {
    if (!process.argv.includes('--review-only')) {
      for (const viewport of [{ width: 390, height: 844 }, { width: 375, height: 667 }, { width: 430, height: 932 }]) {
        const context = await browser.newContext({ viewport, deviceScaleFactor: 2, reducedMotion: 'reduce', isMobile: true, hasTouch: true });
        const page = await context.newPage();
        page.on('pageerror', error => runtimeErrors.push({ viewport, message: error.message }));
        for (const scene of scenes) checks.push(await checkAndCapture(page, scene, viewport));
        if (viewport.width === 390) {
          for (const screen of ['home', 'list']) checks.push(await checkAndCapture(page, { id: screen, screen, state: 'default' }, viewport, 1.3));
          await settle(page, scenes[0]);
          for (const [label, screen] of [['Mi compra', 'list'], ['Ahorro', 'savings'], ['Menús', 'menus'], ['Inicio', 'home']]) {
            await page.getByRole('tab', { name: label, exact: true }).click();
            await page.getByTestId('screen-ready').waitFor();
            await page.getByRole('tab', { name: label, exact: true, selected: true }).waitFor();
            navigationChecks++;
          }
          await page.getByRole('button', { name: 'Abrir perfil', exact: true }).click();
          await page.getByTestId('screen-ready').waitFor();
          await page.getByRole('heading', { name: /perfil|tu espacio|hogar/i }).first().waitFor();
          navigationChecks++;
          if (await page.evaluate(() => localStorage.length) !== 0) throw new Error('La navegación del prototipo escribió datos locales');
          flowChecks = await exerciseFlows(page);
        }
        await context.close();
      }
      const result = {
        timestamp: new Date().toISOString(),
        method: 'Chromium web; CSS viewport sizes, density 2×; not iPhone hardware or iOS Safari',
        scenes: scenes.map(({ id, screen, state, sheet }) => ({ id, screen, state, sheet: sheet || null })),
        runtimeErrors,
        navigationChecks,
        flowChecks,
        nativeKeyboardVerified: false,
        voiceOverVerified: false,
        dynamicTypeVerified: false,
        textScaleMethod: 'Simulación web de texto al 130 %, sin modificar el código ni escalar el viewport',
        checks,
      };
      fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify(result, null, 2));
      if (runtimeErrors.length || checks.some(item => !item.noHorizontalOverflow || item.clippedText.length || item.localStorageEntries !== 0 || item.ctaVisible === false)) process.exitCode = 1;
    }
    await captureReview(browser);
    console.log(`Evidencia B02: ${output}`);
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
}

if (require.main === module) main().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
module.exports = { scenes };
