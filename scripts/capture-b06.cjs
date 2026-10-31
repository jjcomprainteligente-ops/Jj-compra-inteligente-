/* Screenshots of the B06 production app. Serve dist separately on localhost:8081.
 * All fixture prices and shops are fictional; no native iPhone verification.
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');

const origin = process.env.B06_ORIGIN || 'http://127.0.0.1:8081';
const base = path.resolve(__dirname, '../design/b06');
const output = path.join(base, 'evidence');
const priceKey = 'jjcompraintelwgiemt.price-observations.v1';
const viewports = [{ width: 375, height: 667 }, { width: 390, height: 844 }, { width: 430, height: 932 }];

function iso(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
const today = new Date();
const old = new Date(today); old.setDate(old.getDate() - 10);
const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
const manual = {
  product: 'Arroz', brand: 'Marca de prueba', format: 'Bolsa', quality: 'Redondo',
  quantityMilli: 500000, unit: 'g', priceCents: 180, observedOn: iso(today), sourceKind: 'manual',
  sourceReference: 'Dato ficticio para captura; no observación comercial.', url: null,
};
const observations = [
  { ...manual, id: 'half-kilo', store: 'Comercio ficticio A' },
  { ...manual, id: 'one-kilo', store: 'Comercio ficticio B', quantityMilli: 1000, unit: 'kg', priceCents: 300 },
  { ...manual, id: 'old-observation', store: 'Comercio ficticio antiguo', observedOn: iso(old), priceCents: 100 },
  { ...manual, id: 'demo-observation', store: 'Comercio ficticio demo', sourceKind: 'demo', priceCents: 1 },
  { ...manual, id: 'missing-price', store: 'Comercio ficticio sin precio', priceCents: null },
  { ...manual, id: 'other-quality', store: 'Comercio ficticio integral', quality: 'Integral' },
  { ...manual, id: 'unit-conflict', store: 'Comercio ficticio volumen', unit: 'L', quantityMilli: 1000 },
  { ...manual, id: 'unknown-source', store: 'Comercio ficticio sin origen', sourceKind: 'unknown', priceCents: 120 },
];
const priceFixture = JSON.stringify({ version: 1, observations });
const previousFixtures = {
  'jjcompraintelwgiemt.shopping.v1': JSON.stringify({ version: 1, state: { activeListId: 'protected-list', lists: [{ id: 'protected-list', name: 'Compra anterior de prueba', budgetCents: 6000, items: [] }] } }),
  'jjcompraintelwgiemt.menus.v1': JSON.stringify({ version: 1, plan: { servings: 2, recipeIds: ['arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate'] } }),
  'jjcompraintelwgiemt.comparisons.v1': JSON.stringify({ version: 1, comparisons: [{ id: 'protected-comparison', name: 'Comparación anterior de prueba', offers: [] }] }),
};
const scenes = [
  { id: 'savings-entry', label: 'Ahorro · entrada al piloto', action: 'savings' },
  { id: 'empty-price', label: 'Piloto · sin observaciones', seed: 'empty' },
  { id: 'ranking', label: 'Importes por unidad · aportaciones ficticias', action: 'ranking' },
  { id: 'ranking-exclusions', label: 'Excepciones · fecha, origen, calidad y unidad', action: 'excluded' },
  { id: 'new-observation', label: 'Nueva observación · sin guardar', action: 'new' },
  { id: 'edit-observation', label: 'Editar observación · datos revisables', action: 'edit' },
  { id: 'reference-picker', label: 'Elegir referencia declarada', action: 'reference' },
  { id: 'demo-reference', label: 'Demostración · excluida de la comparación', action: 'demo' },
  { id: 'invalid-quantity', label: 'Cantidad inválida · datos conservados', action: 'invalid-quantity' },
  { id: 'invalid-future', label: 'Fecha futura · corrección obligatoria', action: 'invalid-future' },
  { id: 'corrupt-load', label: 'Datos ilegibles · sin sobrescritura', seed: 'corrupt' },
  { id: 'write-error', label: 'Error al guardar · formulario conservado', action: 'write-error' },
  { id: 'delete-confirm', label: 'Eliminar observación · confirmación', action: 'delete' },
];

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function fillNewObservation(page) {
  const sheet = page.getByTestId('price-sheet');
  await sheet.getByRole('textbox', { name: 'Nombre del producto', exact: true }).fill('Arroz');
  await sheet.getByRole('textbox', { name: 'Marca', exact: true }).fill('Marca de prueba');
  await sheet.getByRole('textbox', { name: 'Formato', exact: true }).fill('Bolsa');
  await sheet.getByRole('textbox', { name: 'Calidad o variante', exact: true }).fill('Redondo');
  await sheet.getByRole('textbox', { name: 'Tienda', exact: true }).fill('Comercio ficticio nuevo');
  await sheet.getByRole('textbox', { name: 'Contenido del envase', exact: true }).fill('0,5');
  await sheet.getByRole('button', { name: 'Unidad kg', exact: true }).click();
  await sheet.getByRole('textbox', { name: 'Precio del envase (€)', exact: true }).fill('1,70');
  await sheet.getByRole('textbox', { name: 'Procedencia', exact: true }).fill('Dato ficticio para captura; no observación comercial.');
  return sheet;
}

async function openScene(browser, scene, viewport, runtimeErrors) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  page.on('pageerror', error => runtimeErrors.push({ scene: scene.id, viewport, message: error.message }));
  const originalPrice = scene.seed === 'empty' ? null : scene.seed === 'corrupt' ? '{precio-corrupto' : priceFixture;
  try {
    await page.addInitScript(({ oldValues, priceKey, priceValue }) => {
      for (const [key, value] of Object.entries(oldValues)) localStorage.setItem(key, value);
      if (priceValue === null) localStorage.removeItem(priceKey);
      else localStorage.setItem(priceKey, priceValue);
    }, { oldValues: previousFixtures, priceKey, priceValue: originalPrice });
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Tu compra,\nbajo control.', exact: true }).waitFor();
    await page.getByRole('tab', { name: 'Ahorro', exact: true }).click();
    await page.getByTestId('open-price-pilot').waitFor();
    if (scene.action !== 'savings') {
      await page.getByTestId('open-price-pilot').click();
      if (scene.seed === 'corrupt') {
        await page.getByRole('alert').filter({ hasText: 'No se han modificado' }).first().waitFor();
      } else {
        await page.getByTestId('add-observation').waitFor();
        if (scene.action === 'ranking') {
          await page.getByTestId('comparison-result').first().scrollIntoViewIfNeeded();
        } else if (scene.action === 'excluded') {
          await page.getByTestId('excluded-observation').last().scrollIntoViewIfNeeded();
        } else if (scene.action === 'reference' || scene.action === 'demo') {
          await page.getByTestId('comparison-reference').click();
          const sheet = page.getByTestId('price-sheet');
          await sheet.getByRole('heading', { name: 'Elige una referencia', exact: true }).waitFor();
          if (scene.action === 'demo') {
            await sheet.getByRole('button', { name: 'Comparar desde Arroz en Comercio ficticio demo', exact: true }).click();
            await sheet.waitFor({ state: 'detached' });
            await page.getByText('No hay comparación suficiente', { exact: true }).scrollIntoViewIfNeeded();
          }
        } else if (scene.action === 'edit' || scene.action === 'delete') {
          const action = scene.action === 'edit' ? 'Editar' : 'Eliminar';
          await page.getByRole('button', { name: `${action} observación de Comercio ficticio A`, exact: true }).click();
          await page.getByTestId('price-sheet').waitFor();
        } else if (['new', 'invalid-quantity', 'invalid-future', 'write-error'].includes(scene.action)) {
          await page.getByTestId('add-observation').click();
          const sheet = await fillNewObservation(page);
          if (scene.action === 'invalid-quantity') {
            await sheet.getByRole('textbox', { name: 'Contenido del envase', exact: true }).fill('-1');
          } else if (scene.action === 'invalid-future') {
            await sheet.getByRole('textbox', { name: 'Fecha de observación (AAAA-MM-DD)', exact: true }).fill(iso(tomorrow));
          } else if (scene.action === 'write-error') {
            await page.evaluate(key => {
              const original = Storage.prototype.setItem;
              Storage.prototype.setItem = function (name, value) {
                if (name === key) throw new Error('Fallo simulado de escritura B06');
                original.call(this, name, value);
              };
            }, priceKey);
          }
          if (scene.action !== 'new') {
            await sheet.getByTestId('save-observation').click();
            await sheet.getByRole('alert').scrollIntoViewIfNeeded();
          } else {
            await sheet.getByRole('textbox', { name: 'Nombre del producto', exact: true }).scrollIntoViewIfNeeded();
          }
        }
      }
    }
    await settle(page);
    return { context, page, originalPrice };
  } catch (error) { await context.close(); throw error; }
}

async function capture(browser, scene, viewport, runtimeErrors, scale = 1) {
  const { context, page, originalPrice } = await openScene(browser, scene, viewport, runtimeErrors);
  try {
    let textScaleSimulation = null;
    if (scale !== 1) {
      textScaleSimulation = await page.locator('[dir="auto"]').evaluateAll((nodes, multiplier) => {
        const values = nodes.filter(node => !['INPUT', 'TEXTAREA'].includes(node.tagName)).map(node => ({
          node, size: parseFloat(getComputedStyle(node).fontSize), lineHeight: parseFloat(getComputedStyle(node).lineHeight),
        }));
        for (const { node, size, lineHeight } of values) {
          if (Number.isFinite(size)) node.style.fontSize = `${size * multiplier}px`;
          if (Number.isFinite(lineHeight)) node.style.lineHeight = `${lineHeight * multiplier}px`;
        }
        return { multiplier, textElements: values.length, method: 'DOM font-size and line-height; not native iOS Dynamic Type' };
      }, scale);
      await settle(page);
    }
    const layout = await page.evaluate(() => ({
      noHorizontalOverflow: document.documentElement.scrollWidth <= innerWidth,
      visibleTextOutsideViewport: [...document.querySelectorAll('[dir="auto"]')].flatMap(node => {
        const box = node.getBoundingClientRect();
        if (!box.width || !box.height || box.bottom <= 0 || box.top >= innerHeight || (box.left >= -1 && box.right <= innerWidth + 1)) return [];
        return [{ text: node.textContent.slice(0, 100), left: box.left, right: box.right }];
      }),
    }));
    const preservation = await page.evaluate(({ previous, priceKey, priceValue }) => ({
      previousKeysUnchanged: Object.entries(previous).every(([key, value]) => localStorage.getItem(key) === value),
      priceFixtureUnchanged: localStorage.getItem(priceKey) === priceValue,
    }), { previous: previousFixtures, priceKey, priceValue: originalPrice });
    const id = scale === 1 ? scene.id : `text-130-${scene.id}`;
    const filename = `${id}-${viewport.width}.png`;
    await page.screenshot({ path: path.join(output, filename), fullPage: false });
    return { id, label: scene.label, viewport, deviceScaleFactor: 2, filename, ...layout, ...preservation,
      fictionalData: true, sourceKindsInFixture: ['manual', 'demo', 'unknown'], textScaleSimulation };
  } finally { await context.close(); }
}

function escape(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
function writeReview(checks) {
  const card = check => `<figure><figcaption>${escape(check.label)}${check.textScaleSimulation ? ' · 130 %' : ''}</figcaption><a href="evidence/${escape(check.filename)}"><img loading="lazy" src="evidence/${escape(check.filename)}" alt="${escape(check.label)}" width="${check.viewport.width}" height="${check.viewport.height}"></a><p>${check.viewport.width} × ${check.viewport.height} CSS px · ${check.viewport.width * 2} × ${check.viewport.height * 2} px</p></figure>`;
  const groups = viewports.map(viewport => `<section><h2>${viewport.width} × ${viewport.height} CSS px</h2><div class="grid">${checks.filter(check => check.viewport.width === viewport.width && !check.textScaleSimulation).map(card).join('')}</div></section>`).join('');
  const scaled = `<section><h2>Texto al 130 % · simulación web</h2><p>Se modifican font-size y line-height en el DOM. No es Dynamic Type de iOS.</p><div class="grid">${checks.filter(check => check.textScaleSimulation).map(card).join('')}</div></section>`;
  fs.writeFileSync(path.join(base, 'review.html'), `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JJ Compra Inteligente · B06</title><style>body{margin:0;background:#fff9ef;color:#253d2b;font:16px/1.6 system-ui,sans-serif}main{max-width:1500px;margin:auto;padding:32px}h1{font-size:36px;line-height:1.2}h2{margin-top:48px}a{color:#167347}header{max-width:1000px}aside{padding:18px;border-radius:14px;background:#f2f2df}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;align-items:start}figure{margin:0;max-width:430px}figcaption{font-weight:700;margin-bottom:10px}img{display:block;width:100%;height:auto;border:1px solid #e5e5d1;border-radius:18px;background:white}figure p{font-size:13px;color:#5c6651}section{break-before:page}@media print{.grid{grid-template-columns:repeat(3,1fr)}main{padding:0}figure{break-inside:avoid}}</style><main><header><h1>JJ Compra Inteligente · B06</h1><p>Comparador piloto manual en la aplicación principal. Verde Mercado, M3 provisional.</p><aside><strong>DATOS FICTICIOS EXCLUSIVOS DE ESTA EVIDENCIA.</strong> Tiendas, marcas, precios, presupuestos y procedencias son muestras creadas solo en contextos aislados de navegador. Las filas «manual» permiten revisar el flujo de aportación; no son precios comerciales reales ni verificados. No se precargan en la app. No hay API de tiendas, scraping, acuerdos, stock, ahorro realizado ni fuentes verificadas conectadas.</aside><p>El piloto distingue aportación manual reciente, dato antiguo, precio/origen desconocido y demostración. Normaliza €/kg, €/L o €/ud y excluye incompatibilidades declaradas. Estas capturas Chromium a tamaños CSS de iPhone no validan una app nativa. Continúan pendientes VoiceOver, teclado, zonas seguras, Dynamic Type y los avisos existentes de herramientas Expo.</p><p><a href="evidence/report.json">Dimensiones, errores JavaScript, desbordamientos y conservación de almacenamiento</a></p></header>${groups}${scaled}</main></html>`);
}

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
  const checks = [];
  const runtimeErrors = [];
  try {
    for (const viewport of viewports) for (const scene of scenes) {
      const check = await capture(browser, scene, viewport, runtimeErrors);
      checks.push(check);
      console.log(`${check.filename}: horizontalOverflow=${!check.noHorizontalOverflow}; textOutside=${check.visibleTextOutsideViewport.length}; oldKeysUnchanged=${check.previousKeysUnchanged}; pricesUnchanged=${check.priceFixtureUnchanged}`);
    }
    for (const id of ['ranking', 'new-observation']) checks.push(await capture(browser, scenes.find(scene => scene.id === id), viewports[0], runtimeErrors, 1.3));
    writeReview(checks);
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({
      generatedAt: new Date().toISOString(), origin, app: 'Production app exported in dist',
      method: 'Chromium screenshots at CSS iPhone viewports, deviceScaleFactor 2; not native iOS',
      data: 'Fictional shops, prices and manual references in isolated review contexts only; never a commercial verification',
      integrations: 'No retailer API, scraping, verified feed or payments',
      nativeChecksPending: ['iPhone usage/screenshots', 'VoiceOver', 'Dynamic Type', 'native keyboard', 'safe areas and gestures'],
      security: 'Existing Expo tooling advisories remain unresolved; see technical delivery',
      screenshots: checks.length, runtimeErrors, checks,
    }, null, 2) + '\n');
    if (runtimeErrors.length || checks.some(check => !check.noHorizontalOverflow || check.visibleTextOutsideViewport.length || !check.previousKeysUnchanged || !check.priceFixtureUnchanged)) process.exitCode = 1;
    console.log(`Saved ${checks.length} screenshots and ${path.join(base, 'review.html')}`);
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
