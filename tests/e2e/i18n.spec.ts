/// <reference types="node" />
import { expect, test, type Browser, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { createTranslator } from '../../src/i18n/core';
import { resources } from '../../src/i18n/resources';
import { LANGUAGES, type Language } from '../../src/i18n/types';

// These contexts deliberately bypass the Spanish onboarding seed used by the older regressions.
const origin = 'http://127.0.0.1:8081';
const preferenceKey = 'jjcompraintelwgiemt.preferences.v1';
const shoppingKey = 'jjcompraintelwgiemt.shopping.v1';
const menuKey = 'jjcompraintelwgiemt.menus.v1';
const comparisonKey = 'jjcompraintelwgiemt.comparisons.v1';
const priceKey = 'jjcompraintelwgiemt.price-observations.v1';
const languages: Language[] = ['es', 'en', 'de', 'fr'];
const brandName = 'JJ Compra Inteligente';
const critical = {
  es: { tabs: ['Inicio', 'Mi compra', 'Ahorro', 'Menús'], language: 'Idioma' },
  en: { tabs: ['Home', 'My shopping', 'Savings', 'Menus'], language: 'Language' },
  de: { tabs: ['Start', 'Einkauf', 'Sparen', 'Menüs'], language: 'Sprache' },
  fr: { tabs: ['Accueil', 'Mes courses', 'Économies', 'Menus'], language: 'Langue' },
};
const userListName = 'Familia Äna — été';
const userProductName = 'Café Órbita edición Å';
const userNote = 'Conservar nota: crème / Größe / ñ';
const observedOn = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
const businessFixture = {
  [shoppingKey]: JSON.stringify({ version: 1, state: { activeListId: 'list-unchanged', lists: [{ id: 'list-unchanged', name: userListName, budgetCents: 12500, items: [{
    id: 'item-unchanged', name: userProductName, quantityMilli: 1500, unit: 'kg', category: 'Despensa', note: userNote,
    checked: true, unitPriceCents: 250, priceKind: 'entered',
  }] }] } }),
  [menuKey]: JSON.stringify({ version: 1, plan: { servings: 2, recipeIds: ['arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate'] } }),
  [comparisonKey]: JSON.stringify({ version: 1, comparisons: [{ id: 'comparison-unchanged', name: 'Comparación Ärbol — donnée', offers: [] }] }),
  [priceKey]: JSON.stringify({ version: 1, observations: [{ id: 'observation-unchanged', product: 'Café de prueba', brand: 'Marca ficticia Å', format: 'Bolsa', quality: 'Molido',
    store: 'Comercio ficticio', quantityMilli: 1500, unit: 'kg', priceCents: 375, observedOn, sourceKind: 'manual',
    sourceReference: 'Dato ficticio de prueba; no precio comercial verificado', url: null }] }),
};

function translated(language: Language) { return createTranslator(language, resources); }
function decimal(language: Language, value = '1.5') { return language === 'en' ? value : value.replace('.', ','); }
function euro(language: Language, cents: number) {
  return new Intl.NumberFormat(LANGUAGES[language].locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);
}
async function isolated(browser: Browser, testInfo: TestInfo, locale: string, viewport?: { width: number; height: number }): Promise<BrowserContext> {
  return browser.newContext({ baseURL: origin, locale, timezoneId: 'UTC',
    viewport: viewport ?? testInfo.project.use.viewport ?? { width: 1280, height: 1000 },
    isMobile: viewport ? viewport.width < 500 : !!testInfo.project.use.isMobile,
    hasTouch: viewport ? viewport.width < 500 : !!testInfo.project.use.hasTouch,
    storageState: { cookies: [], origins: [] },
  });
}
async function seed(context: BrowserContext, values: Record<string, string>) {
  // Seed once per context: reloading must exercise persisted changes, not rewrite a fixture.
  await context.addInitScript(entries => {
    if (sessionStorage.getItem('i18n-fixture-seeded')) return;
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
    sessionStorage.setItem('i18n-fixture-seeded', '1');
  }, values);
}
function runtimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push('console: ' + message.text()); });
  return errors;
}
async function preferences(page: Page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? 'null'), preferenceKey);
}
async function business(page: Page) {
  return page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), Object.keys(businessFixture));
}
async function visualHealth(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const accessibleLabels = Array.from(document.querySelectorAll('[aria-label]')).map(element => element.getAttribute('aria-label')).join('\n');
    const rawKeys = Array.from(new Set(((document.body.innerText + '\n' + accessibleLabels).match(/\b(?:app|menus|recipes|prices|secondary|common|legacy|errors|language|visual|visualSecondary|visualMenus|v2)\.[a-zA-Z][\w.-]*/g) ?? [])));
    const outside: string[] = [];
    const clipped: string[] = [];
    for (const element of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      if (/^(SCRIPT|STYLE|INPUT|TEXTAREA|SVG|PATH)$/.test(element.tagName)) continue;
      const style = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      if (style.visibility === 'hidden' || style.display === 'none' || bounds.width < 1 || bounds.height < 1) continue;
      const nodes = Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
      for (const node of nodes) {
        const range = document.createRange(); range.selectNodeContents(node);
        for (const rect of Array.from(range.getClientRects())) {
          if (rect.width < 1 || rect.height < 1) continue;
          if (rect.left < -2 || rect.right > width + 2) outside.push(node.textContent!.trim().slice(0, 120));
          // Only inspect actual clipping ancestors; ordinary vertical scrolling is allowed.
          let ancestor: HTMLElement | null = element;
          while (ancestor && ancestor !== document.body) {
            const ancestorStyle = getComputedStyle(ancestor);
            const ancestorBounds = ancestor.getBoundingClientRect();
            if (ancestorStyle.overflowX === 'hidden' && (rect.left < ancestorBounds.left - 2 || rect.right > ancestorBounds.right + 2)) {
              clipped.push(node.textContent!.trim().slice(0, 120)); break;
            }
            if (ancestorStyle.overflowY === 'hidden' && (rect.top < ancestorBounds.top - 2 || rect.bottom > ancestorBounds.bottom + 2)) {
              clipped.push(node.textContent!.trim().slice(0, 120)); break;
            }
            // A scroll viewport intentionally contains offscreen text until the user scrolls.
            if (/(auto|scroll)/.test(ancestorStyle.overflowY)) break;
            ancestor = ancestor.parentElement;
          }
        }
      }
    }
    return { horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - width),
      outside: Array.from(new Set(outside)), clipped: Array.from(new Set(clipped)), rawKeys };
  });
}
async function assertHealthy(page: Page) {
  const health = await visualHealth(page);
  expect(health, 'No horizontal overflow, clipped/lost text or untranslated resource keys').toEqual({ horizontalOverflow: 0, outside: [], clipped: [], rawKeys: [] });
  return health;
}
async function welcome(page: Page, language: Language) {
  await expect(page.getByTestId('welcome-title')).toBeVisible();
  await expect(page.getByRole('heading', { name: brandName, exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await expect(page.getByTestId('start-app')).toBeVisible();
}
async function revealWelcomeLanguages(page: Page, language: Language) {
  const choice = page.getByTestId(`language-${language}`);
  // The canonical welcome keeps the language picker available without occupying
  // the initial hero. Do not toggle a picker that is already expanded.
  if (!await choice.isVisible()) await page.getByTestId('welcome-language-toggle').click();
  await expect(choice).toBeVisible();
}
async function start(page: Page, language: Language) {
  await page.goto('/');
  await revealWelcomeLanguages(page, language);
  await page.getByTestId(`language-${language}`).click();
  await welcome(page, language);
  await page.getByTestId('start-app').click();
  await expect(page.getByTestId('tab-home')).toBeVisible();
}
async function tab(page: Page, language: Language, name: 'home' | 'list' | 'savings' | 'menus') {
  const target = page.getByTestId(`tab-${name}`);
  await target.click();
  await expect(target).toHaveAttribute('aria-selected', 'true');
  const index = ['home', 'list', 'savings', 'menus'].indexOf(name);
  await expect(target).toHaveAccessibleName(critical[language].tabs[index]);
}

for (const entry of [
  { locale: 'es-MX', language: 'es' }, { locale: 'en-US', language: 'en' },
  { locale: 'de-AT', language: 'de' }, { locale: 'fr-CA', language: 'fr' }, { locale: 'pt-BR', language: 'es' },
] as const) {
  test(`idioma de dispositivo ${entry.locale} → ${entry.language}, bienvenida vacía y sin escrituras de compra`, async ({ browser }, testInfo) => {
    const context = await isolated(browser, testInfo, entry.locale);
    try {
      const page = await context.newPage(); const errors = runtimeErrors(page);
      await page.goto('/'); await welcome(page, entry.language);
      expect(await preferences(page)).toBeNull();
      expect(Object.values(await business(page))).toEqual([null, null, null, null]);
      await assertHealthy(page); expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
}

for (const language of languages) {
  test(`${language}: bienvenida, compra, validación, EUR, seguridad, receta, revisión y comparador conservado`, async ({ browser }, testInfo) => {
    test.setTimeout(100_000);
    const context = await isolated(browser, testInfo, 'pt-BR');
    try {
      const page = await context.newPage(); const errors = runtimeErrors(page); const t = translated(language);
      await start(page, language);
      expect(await preferences(page)).toEqual({ version: 1, language, welcomeCompleted: true });
      await page.getByTestId('create-list').click();
      let sheet = page.getByTestId('app-sheet');
      await sheet.getByTestId('save-list').click();
      await expect(sheet.getByRole('alert')).toContainText(t('errors.listNameRequired'));
      await sheet.getByRole('textbox', { name: t('app.fieldListName'), exact: true }).fill(userListName);
      await sheet.getByTestId('save-list').click(); await sheet.waitFor({ state: 'detached' });
      await tab(page, language, 'list'); await page.getByTestId('add-item').click();
      sheet = page.getByTestId('app-sheet');
      await sheet.getByRole('textbox', { name: t('app.fieldItemName'), exact: true }).fill(userProductName);
      await sheet.getByRole('textbox', { name: t('app.fieldQuantity'), exact: true }).fill('-1');
      await sheet.getByTestId('save-item').click();
      await expect(sheet.getByRole('alert')).toContainText(t('errors.quantityDecimals'));
      await assertHealthy(page);
      await sheet.getByRole('textbox', { name: t('app.fieldQuantity'), exact: true }).fill(decimal(language));
      await sheet.getByRole('button', { name: t('app.unitA11y', { unit: 'kg' }), exact: true }).click();
      await sheet.getByRole('textbox', { name: t('app.fieldPrice'), exact: true }).fill(decimal(language, '2.50'));
      await sheet.getByRole('textbox', { name: t('app.fieldNote'), exact: true }).fill(userNote);
      await sheet.getByTestId('save-item').click(); await sheet.waitFor({ state: 'detached' });
      await expect(page.getByTestId('shopping-item')).toContainText(userProductName);
      await expect(page.getByTestId('shopping-item')).toContainText(decimal(language));
      await expect(page.getByTestId('shopping-item')).toContainText(euro(language, 375));
      const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), shoppingKey);
      expect(saved.state.lists[0]).toMatchObject({ name: userListName, items: [{ name: userProductName, quantityMilli: 1500, unit: 'kg', unitPriceCents: 250, note: userNote }] });
      await tab(page, language, 'savings'); await assertHealthy(page);
      await expect(page.getByTestId('known-total')).toContainText(euro(language, 375));
      await tab(page, language, 'menus');
      await expect(page.getByText(t('menus.decisionText'), { exact: true })).toBeAttached();
      await page.getByTestId('prepare-menu').click(); await expect(page.getByTestId('review-menu')).toBeVisible();
      await page.getByRole('button', { name: t('menus.recipeA11y', { title: t('recipes.arroz-verduras.title') }), exact: true }).click();
      sheet = page.getByTestId('menu-sheet');
      await expect(sheet.getByText(t('menus.allergensTitle'), { exact: true })).toBeAttached();
      await expect(sheet.getByText(t('recipes.arroz-verduras.allergen'), { exact: true })).toBeAttached();
      await assertHealthy(page);
      const beforeReview = await page.evaluate(key => localStorage.getItem(key), shoppingKey);
      await sheet.getByRole('button', { name: t('menus.reviewRecipe'), exact: true }).click();
      await expect(sheet.getByRole('heading', { name: t('menus.reviewTitle'), exact: true })).toBeVisible();
      await expect(sheet.getByText(t('menus.reviewNoticeText'), { exact: true })).toBeAttached();
      expect(await page.evaluate(key => localStorage.getItem(key), shoppingKey)).toBe(beforeReview);
      await sheet.getByTestId('confirm-ingredients').click(); await sheet.waitFor({ state: 'detached' });
      const withIngredients = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), shoppingKey);
      expect(withIngredients.state.lists[0].items[0]).toEqual(saved.state.lists[0].items[0]);
      expect(withIngredients.state.lists[0].items.length).toBeGreaterThan(1);
      expect(withIngredients.state.lists[0].items.slice(1).every((item: { unitPriceCents: number | null }) => item.unitPriceCents === null)).toBe(true);
      await page.getByTestId('open-profile').click(); await assertHealthy(page);
      await page.getByTestId('language-settings').click();
      await expect(page.getByRole('heading', { name: critical[language].language, exact: true })).toBeVisible();
      await assertHealthy(page); await page.getByTestId('language-back').click();
      const preserved = await business(page);
      await page.goto('/?view=comparisons'); await page.getByTestId('create-comparison').click();
      await page.getByTestId('save-comparison').click();
      await expect(page.getByRole('alert')).toContainText(t('errors.productNameRequired'));
      await page.getByRole('textbox', { name: t('legacy.productName'), exact: true }).fill('Auriculares Äna literal');
      await page.getByTestId('save-comparison').click();
      await expect(page.getByRole('heading', { name: 'Auriculares Äna literal', exact: true })).toBeVisible();
      await assertHealthy(page);
      const afterLegacy = await business(page);
      expect(afterLegacy[shoppingKey]).toBe(preserved[shoppingKey]); expect(afterLegacy[menuKey]).toBe(preserved[menuKey]);
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      expect(await preferences(page)).toEqual({ version: 1, language, welcomeCompleted: true });
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
}

test('usa el siguiente idioma compatible de la lista del dispositivo antes de recurrir al español', async ({ browser }, testInfo) => {
  const context = await isolated(browser, testInfo, 'pt-BR');
  await context.addInitScript(() => Object.defineProperty(navigator, 'languages', { configurable: true, value: ['pt-BR', 'fr-CA', 'en-US'] }));
  try {
    const page = await context.newPage();
    await page.goto('/'); await welcome(page, 'fr'); expect(await preferences(page)).toBeNull();
  } finally { await context.close(); }
});

test('Perfil → Idioma: cada elección y volver al dispositivo preservan exactamente nombres, IDs, céntimos y cantidades', async ({ browser }, testInfo) => {
  const context = await isolated(browser, testInfo, 'de-AT');
  await seed(context, { ...businessFixture, [preferenceKey]: JSON.stringify({ version: 1, language: 'es', welcomeCompleted: true }) });
  try {
    const page = await context.newPage(); const errors = runtimeErrors(page);
    await page.goto('/'); await page.getByTestId('open-profile').click(); await page.getByTestId('language-settings').click();
    for (const language of languages) {
      await page.getByTestId(`language-${language}`).click();
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      expect(await business(page)).toEqual(businessFixture);
      await page.reload(); await page.getByTestId('open-profile').click(); await page.getByTestId('language-settings').click();
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      expect(await preferences(page)).toEqual({ version: 1, language, welcomeCompleted: true });
      await assertHealthy(page);
    }
    await page.getByTestId('language-auto').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    expect(await preferences(page)).toEqual({ version: 1, language: null, welcomeCompleted: true });
    expect(await business(page)).toEqual(businessFixture);
    await page.reload(); await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    expect(errors).toEqual([]);
  } finally { await context.close(); }
});

test('un fallo al guardar idioma conserva la elección anterior y permite reintentar sin tocar compras', async ({ browser }, testInfo) => {
  const context = await isolated(browser, testInfo, 'de-DE');
  await seed(context, { ...businessFixture, [preferenceKey]: JSON.stringify({ version: 1, language: 'es', welcomeCompleted: true }) });
  try {
    const page = await context.newPage(); const errors = runtimeErrors(page);
    await page.goto('/'); await page.getByTestId('open-profile').click(); await page.getByTestId('language-settings').click();
    await page.evaluate(key => {
      const original = Storage.prototype.setItem;
      (window as unknown as { restoreI18nWrites: () => void }).restoreI18nWrites = () => { Storage.prototype.setItem = original; };
      Storage.prototype.setItem = function (name, value) {
        if (name === key) throw new Error('Fallo local deliberado de prueba');
        original.call(this, name, value);
      };
    }, preferenceKey);
    await page.getByTestId('language-fr').click();
    await expect(page.getByRole('alert')).toContainText(translated('es')('common.preferencesWriteError'));
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    expect(await preferences(page)).toEqual({ version: 1, language: 'es', welcomeCompleted: true });
    expect(await business(page)).toEqual(businessFixture);
    await page.evaluate(() => (window as unknown as { restoreI18nWrites: () => void }).restoreI18nWrites());
    await page.getByTestId('language-fr').click(); await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    expect(await preferences(page)).toEqual({ version: 1, language: 'fr', welcomeCompleted: true });
    expect(await business(page)).toEqual(businessFixture); expect(errors).toEqual([]);
  } finally { await context.close(); }
});

for (const language of languages) {
  test(`${language}: importes y fechas visibles siguen el idioma, los valores guardados siguen siendo EUR/ISO`, async ({ browser }, testInfo) => {
    const context = await isolated(browser, testInfo, 'en-US');
    await seed(context, { ...businessFixture, [preferenceKey]: JSON.stringify({ version: 1, language, welcomeCompleted: true }) });
    try {
      const page = await context.newPage(); const errors = runtimeErrors(page); const t = translated(language);
      await page.goto('/'); await tab(page, language, 'savings'); await page.getByTestId('open-price-pilot').click();
      await expect(page.getByTestId('normalized-price')).toContainText(euro(language, 250));
      const date = new Intl.DateTimeFormat(LANGUAGES[language].locale, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(new Date(`${observedOn}T12:00:00Z`));
      await expect(page.getByText(t('prices.observedOn', { date, store: 'Comercio ficticio' }), { exact: true }).first()).toBeAttached();
      await page.getByRole('button', { name: t('prices.editObservation', { store: 'Comercio ficticio' }), exact: true }).click();
      const sheet = page.getByTestId('price-sheet');
      await expect(sheet.getByRole('textbox', { name: t('prices.quantityLabel'), exact: true })).toHaveValue(decimal(language));
      await expect(sheet.getByRole('textbox', { name: t('prices.priceLabel'), exact: true })).toHaveValue(decimal(language, '3.75'));
      await expect(sheet.getByRole('textbox', { name: t('prices.dateLabel'), exact: true })).toHaveValue(observedOn);
      await assertHealthy(page); expect(await business(page)).toEqual(businessFixture); expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
}

test('preferencia corrupta se conserva y continuar por sesión permite usar la compra sin borrar datos', async ({ browser }, testInfo) => {
  const context = await isolated(browser, testInfo, 'fr-FR');
  await seed(context, { ...businessFixture, [preferenceKey]: '{préférence-corrompue' });
  try {
    const page = await context.newPage(); const errors = runtimeErrors(page); const t = translated('fr');
    await page.goto('/');
    await expect(page.getByRole('alert')).toContainText(t('common.preferencesCorrupt'));
    await page.getByTestId('preferences-session-continue').click();
    await expect(page.getByTestId('tab-home')).toBeVisible();
    expect(await page.evaluate(key => localStorage.getItem(key), preferenceKey)).toBe('{préférence-corrompue');
    expect(await business(page)).toEqual(businessFixture); expect(errors).toEqual([]);
  } finally { await context.close(); }
});

const viewports = [{ width: 375, height: 667 }, { width: 430, height: 932 }, { width: 1280, height: 1000 }];
for (const language of languages) for (const viewport of viewports) {
  test(`auditoría visual ${language} ${viewport.width}: bienvenida, idioma, cinco pantallas, receta, revisión y validación`, async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'The matrix already creates explicit fresh desktop/mobile contexts.');
    test.setTimeout(100_000);
    const context = await isolated(browser, testInfo, LANGUAGES[language].locale, viewport);
    let writeChecks = () => {};
    try {
      const page = await context.newPage(); const errors = runtimeErrors(page); const t = translated(language);
      const checks: object[] = [];
      writeChecks = () => {
        if (process.env.I18N_EVIDENCE_DIR) fs.writeFileSync(path.join(process.env.I18N_EVIDENCE_DIR, `${language}-${viewport.width}-checks.json`), JSON.stringify({
          language, viewport, engine: 'Chromium', method: 'CSS browser viewport; not a physical iPhone, native iOS or Safari test',
          fixture: 'Fictional isolated local data; no commercial verification', errors, checks,
        }, null, 2) + '\n');
      };
      const capture = async (scene: string) => {
        await page.evaluate(() => {
          for (const element of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
            if (/(auto|scroll)/.test(getComputedStyle(element).overflowY)) element.scrollTop = 0;
          }
        });
        const health = await visualHealth(page);
        const filename = `${language}-${viewport.width}-${scene}.png`;
        if (process.env.I18N_EVIDENCE_DIR) {
          const folder = path.join(process.env.I18N_EVIDENCE_DIR, 'screenshots'); fs.mkdirSync(folder, { recursive: true });
          await page.screenshot({ path: path.join(folder, filename), fullPage: true });
        }
        checks.push({ scene, filename, health });
        writeChecks();
        expect.soft(health, `${language}/${viewport.width}/${scene}`).toEqual({ horizontalOverflow: 0, outside: [], clipped: [], rawKeys: [] });
      };
      await page.goto('/'); await welcome(page, language); await capture('welcome');
      await page.getByTestId('start-app').click(); await page.getByTestId('tab-home').waitFor();
      await page.evaluate(values => { for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value); }, businessFixture);
      await page.reload(); await page.getByTestId('tab-home').waitFor();
      await capture('home');
      await tab(page, language, 'list'); await capture('list');
      await tab(page, language, 'savings'); await capture('savings');
      await tab(page, language, 'menus'); await capture('menus');
      await page.getByRole('button', { name: t('menus.recipeA11y', { title: t('recipes.arroz-verduras.title') }), exact: true }).click();
      let sheet = page.getByTestId('menu-sheet'); await expect(sheet.getByRole('heading', { name: t('recipes.arroz-verduras.title'), exact: true })).toBeVisible();
      await capture('recipe');
      await sheet.getByRole('button', { name: t('menus.reviewRecipe'), exact: true }).click();
      await expect(sheet.getByTestId('confirm-ingredients')).toBeVisible(); await capture('review');
      await sheet.getByRole('button', { name: t('menus.cancelProposal'), exact: true }).click();
      await sheet.getByRole('button', { name: t('menus.cancelWithoutAdd'), exact: true }).click(); await sheet.waitFor({ state: 'detached' });
      await page.getByTestId('open-profile').click(); await page.getByTestId('language-settings').waitFor(); await capture('profile');
      await page.getByTestId('language-settings').click();
      await expect(page.getByRole('heading', { name: critical[language].language, exact: true })).toBeVisible(); await capture('language');
      await page.getByTestId('language-back').click(); await tab(page, language, 'list'); await page.getByTestId('add-item').click();
      sheet = page.getByTestId('app-sheet'); await sheet.getByTestId('save-item').click();
      await expect(sheet.getByRole('alert')).toContainText(t('errors.productNameRequired')); await capture('validation');
      expect(await business(page)).toEqual(businessFixture); expect(errors).toEqual([]);
    } finally { writeChecks(); await context.close(); }
  });
}
