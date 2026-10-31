/* B05 evidence from the exported production app.
 * Serve dist separately at B05_ORIGIN (default localhost:8081).
 * Chromium CSS viewports are not native iPhone, VoiceOver or Dynamic Type tests.
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');

const origin = process.env.B05_ORIGIN || 'http://127.0.0.1:8081';
const base = path.resolve(__dirname, '../design/b05');
const output = path.join(base, 'evidence');
const shoppingKey = 'jjcompraintelwgiemt.shopping.v1';
const menuKey = 'jjcompraintelwgiemt.menus.v1';
const viewports = [
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];
const mealPlan = JSON.stringify({ version: 1, plan: {
  servings: 2,
  recipeIds: ['arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate'],
} });
// Review fixtures are isolated to each browser context. The app itself never seeds these lists.
const shopping = JSON.stringify({ version: 1, state: {
  lists: [{ id: 'review-list', name: 'Compra de revisión', budgetCents: 6000, items: [{
    id: 'review-rice', name: 'Arroz', quantityMilli: 500, unit: 'kg', category: 'Despensa',
    note: 'Producto de demostración para revisar unidades equivalentes.', checked: false,
    unitPriceCents: null, priceKind: null,
  }] }], activeListId: 'review-list',
} });
const exampleText = '2 ud Pan\n500 g Tomates\n1 L Leche';
const ambiguousText = '500 g arroz\n2-3 tomates\naceite al gusto';
const scenes = [
  { id: 'empty-menus', label: 'Menús · sin plan guardado', menu: 'empty' },
  { id: 'plan', label: 'Menús · cinco cenas para dos personas' },
  { id: 'plan-bottom', label: 'Menús · últimas cenas y revisión', action: 'plan-bottom' },
  { id: 'recipe', label: 'Receta · cantidades y pasos', action: 'recipe' },
  { id: 'review-menu', label: 'Esto he entendido · primeros ingredientes', action: 'review-menu' },
  { id: 'review-menu-last', label: 'Esto he entendido · últimos ingredientes', action: 'review-menu-last' },
  { id: 'review-duplicates', label: 'Duplicado · sumar gramos a kilogramos', action: 'review-duplicates' },
  { id: 'import-text', label: 'Traer ingredientes en texto', action: 'text' },
  { id: 'parse-issues', label: 'Texto ambiguo · corregir antes de continuar', action: 'parse-issues' },
  { id: 'review-text', label: 'Texto revisable · sin cambios silenciosos', action: 'review-text' },
  { id: 'menu-loaderror', label: 'Menú ilegible · compras independientes', menu: 'corrupt' },
  { id: 'shopping-savefailure', label: 'Fallo al guardar · propuesta conservada', action: 'shopping-savefailure' },
];

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function openText(page, text) {
  await page.getByTestId('import-text').click();
  const sheet = page.getByTestId('menu-sheet');
  await sheet.waitFor();
  await sheet.getByTestId('ingredient-text').fill(text);
  return sheet;
}

async function openScene(browser, scene, viewport, runtimeErrors) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  page.on('pageerror', error => runtimeErrors.push({ scene: scene.id, viewport, message: error.message }));
  try {
    await page.addInitScript(({ shoppingKey, shoppingValue, menuKey, menuValue }) => {
      localStorage.setItem(shoppingKey, shoppingValue);
      if (menuValue === null) localStorage.removeItem(menuKey);
      else localStorage.setItem(menuKey, menuValue);
    }, { shoppingKey, shoppingValue: shopping, menuKey,
      menuValue: scene.menu === 'empty' ? null : scene.menu === 'corrupt' ? '{menú-ilegible' : mealPlan });
    await page.goto(origin, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Tu compra,\nbajo control.', exact: true }).waitFor();
    await page.getByRole('tab', { name: 'Menús', exact: true }).click();
    if (scene.menu === 'corrupt') {
      await page.getByRole('alert').filter({ hasText: 'No se han modificado' }).first().waitFor();
    } else if (scene.menu === 'empty') {
      await page.getByTestId('prepare-menu').waitFor();
    } else {
      await page.getByRole('button', { name: 'Receta de Arroz con verduras', exact: true }).waitFor();
      if (scene.action === 'plan-bottom') {
        await page.getByTestId('review-menu').scrollIntoViewIfNeeded();
      } else if (scene.action === 'recipe') {
        await page.getByRole('button', { name: 'Receta de Arroz con verduras', exact: true }).click();
        await page.getByTestId('menu-sheet').getByRole('heading', { name: 'Arroz con verduras', exact: true }).waitFor();
      } else if (scene.action?.startsWith('review-menu') || scene.action === 'review-duplicates') {
        await page.getByTestId('review-menu').click();
        const sheet = page.getByTestId('menu-sheet');
        await sheet.getByRole('heading', { name: 'Esto he entendido', exact: true }).waitFor();
        if (scene.action === 'review-menu-last') {
          await sheet.getByTestId('ingredient-review-row').last().scrollIntoViewIfNeeded();
        } else if (scene.action === 'review-duplicates') {
          const combine = sheet.getByRole('button', { name: 'Sumar cantidades del ingrediente 1', exact: true });
          await combine.click();
          await combine.scrollIntoViewIfNeeded();
        } else {
          await sheet.getByRole('textbox', { name: 'Nombre del ingrediente 1', exact: true }).scrollIntoViewIfNeeded();
        }
      } else if (['text', 'parse-issues', 'review-text', 'shopping-savefailure'].includes(scene.action)) {
        const sheet = await openText(page, scene.action === 'parse-issues' ? ambiguousText : exampleText);
        if (scene.action !== 'text') {
          await sheet.getByTestId('parse-ingredients').click();
          if (scene.action === 'parse-issues') {
            await sheet.getByRole('alert').filter({ hasText: 'Hay líneas' }).scrollIntoViewIfNeeded();
          } else {
            await sheet.getByRole('heading', { name: 'Esto he entendido', exact: true }).waitFor();
            if (scene.action === 'shopping-savefailure') {
              await page.evaluate(key => {
                const original = Storage.prototype.setItem;
                Storage.prototype.setItem = function (name, value) {
                  if (name === key) throw new Error('Fallo de escritura simulado para la captura B05');
                  original.call(this, name, value);
                };
              }, shoppingKey);
              await sheet.getByTestId('confirm-ingredients').click();
              await sheet.getByRole('alert').filter({ hasText: 'No se pudieron guardar' }).scrollIntoViewIfNeeded();
            }
          }
        }
      }
    }
    await settle(page);
    return { context, page };
  } catch (error) {
    await context.close();
    throw error;
  }
}

async function capture(browser, scene, viewport, runtimeErrors, scale = 1) {
  const { context, page } = await openScene(browser, scene, viewport, runtimeErrors);
  try {
    let textScaleSimulation = null;
    if (scale !== 1) {
      textScaleSimulation = await page.locator('[dir="auto"]').evaluateAll((nodes, multiplier) => {
        const computed = nodes.filter(node => !['INPUT', 'TEXTAREA'].includes(node.tagName)).map(node => ({
          node, size: parseFloat(getComputedStyle(node).fontSize), lineHeight: parseFloat(getComputedStyle(node).lineHeight),
        }));
        for (const { node, size, lineHeight } of computed) {
          if (Number.isFinite(size)) node.style.fontSize = `${size * multiplier}px`;
          if (Number.isFinite(lineHeight)) node.style.lineHeight = `${lineHeight * multiplier}px`;
        }
        return { multiplier, textElements: computed.length, method: 'DOM font-size and line-height; not native Dynamic Type' };
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
    const storedShopping = await page.evaluate(key => localStorage.getItem(key), shoppingKey);
    return { id, label: scene.label, viewport, deviceScaleFactor: 2, filename, ...layout,
      demonstrationData: true, textScaleSimulation, shoppingFixtureUnchanged: storedShopping === shopping };
  } finally { await context.close(); }
}

function escape(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function writeReview(checks) {
  const card = check => `<figure><figcaption>${escape(check.label)}${check.textScaleSimulation ? ' · 130 %' : ''}</figcaption><a href="evidence/${escape(check.filename)}"><img loading="lazy" src="evidence/${escape(check.filename)}" alt="${escape(check.label)}" width="${check.viewport.width}" height="${check.viewport.height}"></a><p>${check.viewport.width} × ${check.viewport.height} CSS px · ${check.viewport.width * 2} × ${check.viewport.height * 2} px</p></figure>`;
  const groups = viewports.map(viewport => `<section><h2>${viewport.width} × ${viewport.height} CSS px</h2><div class="grid">${checks.filter(check => check.viewport.width === viewport.width && !check.textScaleSimulation).map(card).join('')}</div></section>`).join('');
  const scaled = `<section><h2>Texto al 130 % · simulación web</h2><p>Se modifican font-size y line-height en el DOM. No es Dynamic Type de iOS.</p><div class="grid">${checks.filter(check => check.textScaleSimulation).map(card).join('')}</div></section>`;
  fs.writeFileSync(path.join(base, 'review.html'), `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JJ Compra Inteligente · B05</title><style>body{margin:0;background:#fff9ef;color:#253d2b;font:16px/1.6 system-ui,sans-serif}main{max-width:1500px;margin:auto;padding:32px}h1{font-size:36px;line-height:1.2}h2{margin-top:48px}a{color:#167347}header{max-width:1000px}aside{padding:18px;border-radius:14px;background:#f2f2df}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;align-items:start}figure{margin:0;max-width:430px}figcaption{font-weight:700;margin-bottom:10px}img{display:block;width:100%;height:auto;border:1px solid #e5e5d1;border-radius:18px;background:white}figure p{font-size:13px;color:#5c6651}section{break-before:page}@media print{.grid{grid-template-columns:repeat(3,1fr)}main{padding:0}figure{break-inside:avoid}}</style><main><header><h1>JJ Compra Inteligente · B05</h1><p>Menús locales, recetas ajustables y revisión de ingredientes en la aplicación principal. Verde Mercado, M3 provisional.</p><aside><strong>Alcance de esta evidencia.</strong> Capturas Chromium en tamaños CSS de iPhone. La lista «Compra de revisión», su presupuesto y el menú son datos ficticios introducidos exclusivamente en contextos aislados del capturador; no se precargan en la app. Los ingredientes se proponen sin precios. El catálogo y las reglas funcionan localmente, sin IA ni micrófono conectados; las búsquedas con ChatGPT se realizan fuera de la app. Estas imágenes no certifican pruebas funcionales ni uso nativo.</aside><p>Siguen pendientes la prueba en iPhone, VoiceOver, teclado, zonas seguras y Dynamic Type. Los avisos de dependencias de herramientas Expo documentados en la entrega anterior permanecen abiertos; estas capturas no los resuelven.</p><p><a href="evidence/report.json">Dimensiones, errores JavaScript, desbordamientos y conservación de los datos de muestra</a></p></header>${groups}${scaled}</main></html>`);
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
        console.log(`${check.filename}: horizontalOverflow=${!check.noHorizontalOverflow}; textOutside=${check.visibleTextOutsideViewport.length}; shoppingUnchanged=${check.shoppingFixtureUnchanged}`);
      }
    }
    for (const id of ['plan', 'review-menu']) checks.push(await capture(browser, scenes.find(scene => scene.id === id), viewports[0], runtimeErrors, 1.3));
    writeReview(checks);
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({
      generatedAt: new Date().toISOString(), origin, app: 'Production app exported in dist',
      method: 'Chromium screenshots at CSS iPhone viewports, deviceScaleFactor 2; not native iOS',
      data: 'Isolated localStorage fixtures only; no production seeding or price feed',
      integrations: 'No connected AI, voice, backend or commercial price source',
      nativeChecksPending: ['iPhone usage/screenshots', 'VoiceOver', 'Dynamic Type', 'native keyboard', 'native safe areas and gestures'],
      security: 'Existing Expo tooling dependency advisories remain unresolved; see delivery documents',
      screenshots: checks.length, runtimeErrors, checks,
    }, null, 2) + '\n');
    if (runtimeErrors.length || checks.some(check => !check.noHorizontalOverflow || check.visibleTextOutsideViewport.length || !check.shoppingFixtureUnchanged)) process.exitCode = 1;
    console.log(`Saved ${checks.length} screenshots and ${path.join(base, 'review.html')}`);
  } finally { await browser.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
