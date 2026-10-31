/* B03/B04: screenshots of the exported production app at CSS iPhone sizes.
 * Requires the app to be served separately at B034_ORIGIN (default localhost:8081).
 * No native iOS, Dynamic Type, VoiceOver or functional acceptance claim is made here.
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');

const origin = process.env.B034_ORIGIN || 'http://127.0.0.1:8081';
const base = path.resolve(__dirname, '../design/b03-b04');
const output = path.join(base, 'evidence');
const shoppingKey = 'jjcompraintelwgiemt.shopping.v1';
const viewports = [
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];
const products = [
  { id: 'milk', name: 'Leche', quantityMilli: 2000, unit: 'L', category: 'Lácteos y huevos', checked: true, unitPriceCents: 120, priceKind: 'entered' },
  { id: 'rice', name: 'Arroz', quantityMilli: 500, unit: 'kg', category: 'Despensa', unitPriceCents: 250, priceKind: 'estimated' },
  { id: 'tomato', name: 'Tomates', quantityMilli: 1000, unit: 'kg', category: 'Fruta y verdura', unitPriceCents: null, priceKind: null },
  { id: 'banana', name: 'Plátanos', quantityMilli: 1500, unit: 'kg', category: 'Fruta y verdura', unitPriceCents: 210, priceKind: 'estimated' },
  { id: 'bread', name: 'Pan', quantityMilli: 2000, unit: 'ud', category: 'Panadería', unitPriceCents: 85, priceKind: 'entered' },
  { id: 'eggs', name: 'Huevos', quantityMilli: 6000, unit: 'ud', category: 'Lácteos y huevos', unitPriceCents: null, priceKind: null },
  { id: 'lentils', name: 'Lentejas', quantityMilli: 500, unit: 'kg', category: 'Despensa', unitPriceCents: 300, priceKind: 'entered' },
  { id: 'carrot', name: 'Zanahorias', quantityMilli: 500, unit: 'kg', category: 'Fruta y verdura', unitPriceCents: 180, priceKind: 'estimated' },
  { id: 'oil', name: 'Aceite de oliva', quantityMilli: 1000, unit: 'L', category: 'Despensa', unitPriceCents: 575, priceKind: 'entered' },
  { id: 'soap', name: 'Jabón de manos', quantityMilli: 1000, unit: 'ud', category: 'Hogar', unitPriceCents: null, priceKind: null },
  { id: 'yogurt', name: 'Yogur natural', quantityMilli: 4000, unit: 'ud', category: 'Lácteos y huevos', unitPriceCents: 45, priceKind: 'entered' },
  { id: 'fish', name: 'Pescado', quantityMilli: 500, unit: 'kg', category: 'Carne y pescado', unitPriceCents: null, priceKind: null },
].map(product => ({ checked: false, note: '', ...product }));
const populated = JSON.stringify({ version: 1, state: {
  lists: [{ id: 'demo-list', name: 'Compra de revisión', budgetCents: 2000, items: products }],
  activeListId: 'demo-list',
} });

const scenes = [
  { id: 'empty-home', label: 'Inicio · sin listas', screen: 'Inicio', seed: 'empty' },
  { id: 'empty-list', label: 'Mi compra · sin listas', screen: 'Mi compra', seed: 'empty' },
  { id: 'home', label: 'Inicio · lista guardada', screen: 'Inicio' },
  { id: 'list', label: 'Mi compra · 12 productos', screen: 'Mi compra' },
  { id: 'list-products', label: 'Mi compra · productos al desplazar', screen: 'Mi compra', action: 'products' },
  { id: 'list-end', label: 'Mi compra · final de 12 productos', screen: 'Mi compra', action: 'last' },
  { id: 'savings', label: 'Ahorro · importes separados', screen: 'Ahorro' },
  { id: 'over-budget', label: 'Ahorro · previsión sobre presupuesto', screen: 'Ahorro', seed: 'over' },
  { id: 'menus', label: 'Menús · vista previa explícita', screen: 'Menús' },
  { id: 'profile', label: 'Perfil · datos locales', screen: 'profile' },
  { id: 'add-product', label: 'Añadir producto · formulario', screen: 'Mi compra', action: 'add' },
  { id: 'invalid-product', label: 'Cantidad inválida · formulario conservado', screen: 'Mi compra', action: 'invalid' },
  { id: 'write-error', label: 'Fallo de guardado · borrador conservado', screen: 'Mi compra', action: 'write-error' },
  { id: 'budget', label: 'Editar presupuesto', screen: 'Mi compra', action: 'budget' },
  { id: 'delete-product', label: 'Confirmación de eliminación', screen: 'Mi compra', action: 'delete' },
  { id: 'load-error', label: 'Error de lectura · datos intactos', seed: 'corrupt' },
];

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function openScene(browser, scene, viewport, runtimeErrors) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => runtimeErrors.push({ scene: scene.id, viewport, message: error.message }));
  const over = JSON.parse(populated);
  over.state.lists[0].budgetCents = 500;
  await page.addInitScript(({ key, value }) => {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  }, { key: shoppingKey, value: scene.seed === 'empty' ? null : scene.seed === 'corrupt' ? '{corrupto' : scene.seed === 'over' ? JSON.stringify(over) : populated });
  await page.goto(origin, { waitUntil: 'networkidle' });
  if (scene.seed === 'corrupt') {
    await page.getByRole('alert').filter({ hasText: 'No se han modificado' }).first().waitFor();
  } else {
    await page.getByRole('heading', { name: 'Tu compra,\nbajo control.', exact: true }).waitFor();
    if (scene.screen === 'profile') await page.getByRole('button', { name: 'Abrir perfil', exact: true }).click();
    else if (scene.screen && scene.screen !== 'Inicio') await page.getByRole('tab', { name: scene.screen, exact: true }).click();
    if (['add', 'invalid', 'write-error'].includes(scene.action)) {
      await page.getByTestId('add-item').click();
      await page.getByTestId('app-sheet').waitFor();
      await page.getByRole('textbox', { name: 'Nombre del producto', exact: true }).fill('Calabacín');
      if (scene.action === 'invalid') {
        await page.getByRole('textbox', { name: 'Cantidad', exact: true }).fill('-2');
        await page.getByTestId('save-item').click();
        await page.getByRole('alert').scrollIntoViewIfNeeded();
      } else if (scene.action === 'write-error') {
        await page.evaluate(key => {
          const original = Storage.prototype.setItem;
          Storage.prototype.setItem = function (name, value) {
            if (name === key) throw new Error('Fallo simulado para captura');
            original.call(this, name, value);
          };
        }, shoppingKey);
        await page.getByTestId('save-item').click();
        await page.getByRole('alert').filter({ hasText: 'No se pudieron guardar' }).scrollIntoViewIfNeeded();
      }
    } else if (scene.action === 'products') {
      await page.getByTestId('shopping-item').first().scrollIntoViewIfNeeded();
    } else if (scene.action === 'last') {
      await page.getByTestId('shopping-item').last().scrollIntoViewIfNeeded();
    } else if (scene.action === 'budget') {
      await page.getByTestId('edit-budget').click();
      await page.getByTestId('app-sheet').waitFor();
    } else if (scene.action === 'delete') {
      await page.getByRole('button', { name: 'Eliminar Leche', exact: true }).click();
      await page.getByTestId('confirmation-dialog').waitFor();
    }
  }
  await settle(page);
  return { context, page };
}

async function capture(browser, scene, viewport, runtimeErrors, scale = 1) {
  const { page, context } = await openScene(browser, scene, viewport, runtimeErrors);
  try {
    let textScaleSimulation = null;
    if (scale !== 1) {
      textScaleSimulation = await page.locator('[dir="auto"]').evaluateAll((nodes, multiplier) => {
        const computed = nodes.filter(node => !['INPUT', 'TEXTAREA'].includes(node.tagName)).map(node => ({ node,
          size: parseFloat(getComputedStyle(node).fontSize), lineHeight: parseFloat(getComputedStyle(node).lineHeight) }));
        for (const { node, size, lineHeight } of computed) {
          if (Number.isFinite(size)) node.style.fontSize = `${size * multiplier}px`;
          if (Number.isFinite(lineHeight)) node.style.lineHeight = `${lineHeight * multiplier}px`;
        }
        return { multiplier, textElements: computed.length, method: 'DOM font-size and line-height only; not native iOS Dynamic Type' };
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
    const id = scale === 1 ? scene.id : `text-130-${scene.id}`;
    const filename = `${id}-${viewport.width}.png`;
    await page.screenshot({ path: path.join(output, filename), fullPage: false });
    return { id, label: scene.label, viewport, deviceScaleFactor: 2, filename, ...layout,
      demonstrationData: scene.seed !== 'empty' && scene.seed !== 'corrupt', textScaleSimulation };
  } finally { await context.close(); }
}

function escape(value) { return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }

function writeReview(checks) {
  const groups = viewports.map(viewport => `<section><h2>${viewport.width} × ${viewport.height} CSS px</h2><div class="grid">${checks.filter(check => check.viewport.width === viewport.width && !check.textScaleSimulation).map(card).join('')}</div></section>`).join('');
  const scaled = `<section><h2>Texto al 130 % · simulación web</h2><p>Se modifican font-size y line-height en el DOM. Esto no valida Dynamic Type de iOS.</p><div class="grid">${checks.filter(check => check.textScaleSimulation).map(card).join('')}</div></section>`;
  function card(check) { return `<figure><figcaption>${escape(check.label)}${check.textScaleSimulation ? ' · 130 %' : ''}</figcaption><a href="evidence/${escape(check.filename)}"><img loading="lazy" src="evidence/${escape(check.filename)}" alt="${escape(check.label)}" width="${check.viewport.width}" height="${check.viewport.height}"></a><p>${check.viewport.width} × ${check.viewport.height} CSS px · ${check.viewport.width * 2} × ${check.viewport.height * 2} px</p></figure>`; }
  const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JJ Compra Inteligente · B03 y B04</title><style>body{margin:0;background:#fff9ef;color:#253d2b;font:16px/1.6 system-ui,sans-serif}main{max-width:1500px;margin:auto;padding:32px}h1{font-size:36px;line-height:1.2}h2{margin-top:48px}a{color:#167347}header{max-width:1000px}aside{padding:18px;border-radius:14px;background:#f2f2df}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;align-items:start}figure{margin:0;max-width:430px}figcaption{font-weight:700;margin-bottom:10px}img{display:block;width:100%;height:auto;border:1px solid #e5e5d1;border-radius:18px;background:white}figure p{font-size:13px;color:#5c6651}section{break-before:page}@media print{.grid{grid-template-columns:repeat(3,1fr)}main{padding:0}figure{break-inside:avoid}}</style><main><header><h1>JJ Compra Inteligente · B03 y B04</h1><p>Aplicación principal exportada, ejecutada en Chromium. Verde Mercado con M3 provisional; el logo definitivo queda pendiente.</p><aside><strong>Alcance de esta evidencia.</strong> Capturas web en tamaños de iPhone. Los 12 productos e importes son datos ficticios introducidos solo en los contextos de revisión; no se precargan en la app. Menús sigue siendo una vista previa. Quedan pendientes capturas nativas, teclado, safe area, VoiceOver y Dynamic Type en iPhone. Estas imágenes no certifican pruebas funcionales.</aside><p><a href="evidence/report.json">Informe de dimensiones, errores JavaScript y comprobaciones de desbordamiento</a></p></header>${groups}${scaled}</main></html>`;
  fs.writeFileSync(path.join(base, 'review.html'), html);
}

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
  const browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
  const checks = [];
  const runtimeErrors = [];
  try {
    for (const viewport of viewports) {
      for (const scene of scenes) {
        const check = await capture(browser, scene, viewport, runtimeErrors);
        checks.push(check);
        console.log(`${check.filename}: horizontalOverflow=${!check.noHorizontalOverflow}; textOutside=${check.visibleTextOutsideViewport.length}`);
      }
    }
    for (const id of ['list', 'savings']) checks.push(await capture(browser, scenes.find(scene => scene.id === id), viewports[0], runtimeErrors, 1.3));
    writeReview(checks);
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({
      generatedAt: new Date().toISOString(), origin, app: 'Production export from dist; no design/b02 app',
      method: 'Chromium screenshots; deviceScaleFactor 2; web CSS viewports, not native iOS',
      data: 'Fictitious localStorage seeds in isolated review contexts only; production starts empty',
      nativeChecksPending: ['iPhone screenshots', 'VoiceOver', 'Dynamic Type', 'native keyboard', 'native safe areas and gestures'],
      screenshots: checks.length, runtimeErrors, checks,
    }, null, 2));
    if (runtimeErrors.length) process.exitCode = 1;
    console.log(`Saved ${checks.length} screenshots and ${path.join(base, 'review.html')}`);
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
