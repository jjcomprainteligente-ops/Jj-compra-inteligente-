/// <reference types="node" />
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { createTranslator } from '../../src/i18n/core';
import { resources } from '../../src/i18n/resources';
import { LANGUAGES, type Language } from '../../src/i18n/types';

// Every browser context is empty. Only the explicit QA fixtures below are used.
// Linux WebKit emulation is engine evidence, never physical iPhone validation.
const languages: Language[] = ['es', 'en', 'de', 'fr'];
const prefix = 'jjcompraintelwgiemt.';
const keys = {
  preferences: prefix + 'preferences.v1', shopping: prefix + 'shopping.v1', menus: prefix + 'menus.v1',
  comparisons: prefix + 'comparisons.v1', observations: prefix + 'price-observations.v1',
  expenses: prefix + 'expenses.v1', settings: prefix + 'local-settings.v1',
};
const storageKeys = Object.values(keys);
const recipes = ['arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate'];
const listName = 'QA WebKit — Größe / été / ñ';
const productName = 'QA Café — crème / Ä / ñ';
const otherKey = 'qa.other-application.webkit';
const otherValue = 'QA_EXCLUDED_WEBKIT_SENTINEL';
const tabs = {
  es: ['Inicio', 'Mi compra', 'Ahorro', 'Menús'], en: ['Home', 'My shopping', 'Savings', 'Menus'],
  de: ['Start', 'Einkauf', 'Sparen', 'Menüs'], fr: ['Accueil', 'Mes courses', 'Économies', 'Menus'],
};

function fixtures(language: Language, withList = true) {
  return {
    [keys.preferences]: JSON.stringify({ version: 1, language, welcomeCompleted: true }),
    [keys.shopping]: JSON.stringify({ version: 1, state: { activeListId: withList ? 'webkit-list' : null,
      lists: withList ? [{ id: 'webkit-list', name: listName, budgetCents: 6000, items: [] }] : [] } }),
    [keys.menus]: JSON.stringify({ version: 1, plan: { servings: 2, recipeIds: recipes } }),
    [keys.comparisons]: JSON.stringify({ version: 1, comparisons: [] }),
    [keys.observations]: JSON.stringify({ version: 1, observations: [] }),
    [keys.expenses]: JSON.stringify({ version: 1, data: { expenses: [] } }),
    [keys.settings]: JSON.stringify({ version: 1, preferences: { favoriteStores: [], inAppReminders: false } }),
    [otherKey]: otherValue,
  };
}
async function seed(context: BrowserContext, values: Record<string, string>) {
  await context.addInitScript(entries => {
    if (sessionStorage.getItem('qa-webkit-seeded')) return;
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
    sessionStorage.setItem('qa-webkit-seeded', '1');
  }, values);
}
async function snapshot(page: Page) {
  return page.evaluate(names => Object.fromEntries(names.map(name => [name, localStorage.getItem(name)])), [...storageKeys, otherKey]);
}
async function documentValue(page: Page, key: string) {
  return page.evaluate(name => JSON.parse(localStorage.getItem(name) ?? 'null'), key);
}
function runtimeErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push('console: ' + message.text()); });
  return errors;
}
async function healthyText(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  const health = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const accessible = [...document.querySelectorAll('[aria-label]')].map(node => node.getAttribute('aria-label')).join('\n');
    const keys = [...new Set(((document.body.innerText + '\n' + accessible).match(/\b(?:app|menus|recipes|prices|secondary|common|legacy|errors|language|visual|visualSecondary|visualMenus|v2)\.[a-zA-Z][\w.-]*/g) ?? []))];
    const outside: string[] = [];
    const clipped: string[] = [];
    for (const element of document.querySelectorAll<HTMLElement>('body *')) {
      if (/^(SCRIPT|STYLE|INPUT|TEXTAREA|SVG|PATH)$/.test(element.tagName)) continue;
      const style = getComputedStyle(element), bounds = element.getBoundingClientRect();
      if (style.visibility === 'hidden' || style.display === 'none' || bounds.width < 1 || bounds.height < 1) continue;
      for (const node of [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())) {
        const range = document.createRange(); range.selectNodeContents(node);
        for (const rect of range.getClientRects()) {
          if (rect.width < 1 || rect.height < 1) continue;
          if (rect.left < -2 || rect.right > width + 2) outside.push(node.textContent!.trim().slice(0, 120));
          let ancestor: HTMLElement | null = element;
          while (ancestor && ancestor !== document.body) {
            const style = getComputedStyle(ancestor), bounds = ancestor.getBoundingClientRect();
            if ((style.overflowX === 'hidden' && (rect.left < bounds.left - 2 || rect.right > bounds.right + 2)) ||
              (style.overflowY === 'hidden' && (rect.top < bounds.top - 2 || rect.bottom > bounds.bottom + 2))) {
              clipped.push(node.textContent!.trim().slice(0, 120)); break;
            }
            if (/(auto|scroll)/.test(style.overflowY)) break;
            ancestor = ancestor.parentElement;
          }
        }
      }
    }
    return { horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - width),
      outside: [...new Set(outside)], clipped: [...new Set(clipped)], untranslatedKeys: keys };
  });
  expect(health).toEqual({ horizontalOverflow: 0, outside: [], clipped: [], untranslatedKeys: [] });
}
async function capabilities(page: Page) {
  return page.evaluate(async () => {
    const result = { secureContext: isSecureContext, locks: typeof navigator.locks?.request === 'function',
      crypto: typeof crypto?.subtle?.digest === 'function', indexedDB: typeof indexedDB?.open === 'function',
      strictDurability: false, durabilityError: '' };
    if (!result.indexedDB) return result;
    const name = 'qa.webkit.capability-probe';
    try {
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(name, 1);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('Probe database blocked'));
        request.onupgradeneeded = () => request.result.createObjectStore('probe');
        request.onsuccess = () => {
          const db = request.result;
          try {
            const tx = db.transaction('probe', 'readwrite', { durability: 'strict' });
            result.strictDurability = tx.durability === 'strict';
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onabort = tx.onerror = () => { db.close(); reject(tx.error ?? new Error('Probe transaction failed')); };
          } catch (error) { db.close(); reject(error); }
        };
      });
    } catch (error) { result.durabilityError = String(error); }
    finally { indexedDB.deleteDatabase(name); }
    return result;
  });
}
async function requireWrites(page: Page) {
  const result = await capabilities(page);
  test.info().annotations.push({ type: 'storage-capabilities', description: JSON.stringify(result) });
  test.skip(!result.secureContext || !result.locks || !result.crypto || !result.strictDurability,
    'WebKit lacks a required storage primitive. Mutation readiness is unverified; fail-closed tests run separately.');
}
function decimal(language: Language, value: string) { return language === 'en' ? value : value.replace('.', ','); }
function euro(language: Language, cents: number) {
  return new Intl.NumberFormat(LANGUAGES[language].locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

test('WebKit engine and real storage capabilities are recorded without claiming physical iPhone coverage', async ({ browser, page }, info) => {
  await page.goto('/');
  await expect(page.getByTestId('welcome-title')).toBeVisible();
  await info.attach('webkit-engine-capabilities.json', { body: JSON.stringify({ engine: 'webkit', version: browser.version(),
    physicalIPhone: false, viewport: info.project.use.viewport, capabilities: await capabilities(page) }, null, 2), contentType: 'application/json' });
});

for (const language of languages) {
  const t = createTranslator(language, resources);
  test(`${language}: device language, welcome and manual preference persist across reload`, async ({ browser }, info) => {
    const context = await browser.newContext({ viewport: info.project.use.viewport, isMobile: info.project.use.isMobile,
      hasTouch: info.project.use.hasTouch, locale: LANGUAGES[language].locale, timezoneId: 'UTC',
      baseURL: 'http://127.0.0.1:8081', storageState: { cookies: [], origins: [] } });
    try {
      const page = await context.newPage(), errors = runtimeErrors(page);
      await page.goto('/');
      await expect(page.getByTestId('welcome-title')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      await expect(page.getByRole('heading', { name: 'JJ Compra Inteligente', exact: true })).toBeVisible();
      expect(Object.values(await snapshot(page))).toEqual(Array(storageKeys.length + 1).fill(null));
      await healthyText(page);
      await requireWrites(page);
      await page.getByTestId('welcome-language-toggle').click();
      await page.getByTestId('language-' + language).click();
      await page.getByTestId('start-app').click();
      await expect(page.getByTestId('tab-home')).toBeVisible();
      expect(await documentValue(page, keys.preferences)).toEqual({ version: 1, language, welcomeCompleted: true });
      for (const [index, name] of ['home', 'list', 'savings', 'menus'].entries()) {
        await expect(page.getByTestId('tab-' + name)).toHaveAccessibleName(tabs[language][index]);
      }
      await page.reload();
      await expect(page.getByTestId('tab-home')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });

  test(`${language}: list, local item and EUR budget persist without losing entered accents`, async ({ context, page }) => {
    await seed(context, fixtures(language, false));
    const errors = runtimeErrors(page);
    await page.goto('/'); await expect(page.getByTestId('tab-home')).toBeVisible();
    await requireWrites(page);
    await page.getByTestId('create-list').click();
    let sheet = page.getByTestId('app-sheet');
    await sheet.getByRole('textbox', { name: t('app.fieldListName'), exact: true }).fill(listName);
    await sheet.getByTestId('save-list').click(); await expect(sheet).toHaveCount(0);
    await page.getByTestId('tab-list').click();
    await page.getByTestId('edit-budget').click();
    sheet = page.getByTestId('app-sheet');
    await sheet.getByRole('textbox', { name: t('app.fieldBudget'), exact: true }).fill(decimal(language, '42.50'));
    await sheet.getByTestId('save-budget').click(); await expect(sheet).toHaveCount(0);
    await page.getByTestId('add-item').click(); sheet = page.getByTestId('app-sheet');
    await sheet.getByRole('textbox', { name: t('app.fieldItemName'), exact: true }).fill(productName);
    await sheet.getByRole('textbox', { name: t('app.fieldQuantity'), exact: true }).fill(decimal(language, '1.5'));
    await sheet.getByRole('button', { name: t('app.unitA11y', { unit: 'kg' }), exact: true }).click();
    await sheet.getByRole('textbox', { name: t('app.fieldPrice'), exact: true }).fill(decimal(language, '2.50'));
    await sheet.getByTestId('save-item').click(); await expect(sheet).toHaveCount(0);
    const saved = await documentValue(page, keys.shopping);
    expect(saved.state.lists[0]).toMatchObject({ name: listName, budgetCents: 4250, items: [{ name: productName,
      quantityMilli: 1500, unit: 'kg', unitPriceCents: 250 }] });
    await expect(page.getByTestId('shopping-item')).toContainText(euro(language, 375));
    await healthyText(page);
    await page.reload(); await page.getByTestId('tab-list').click();
    expect(await documentValue(page, keys.shopping)).toEqual(saved);
    await expect(page.getByTestId('shopping-item')).toContainText(productName);
    expect(errors).toEqual([]);
  });

  test(`${language}: menu ingredient review cancels unchanged and writes only after confirmation`, async ({ context, page }) => {
    await seed(context, fixtures(language));
    const errors = runtimeErrors(page);
    await page.goto('/'); await expect(page.getByTestId('tab-home')).toBeVisible();
    await requireWrites(page);
    const before = await snapshot(page);
    await page.getByTestId('tab-menus').click(); await page.getByTestId('review-menu').click();
    let sheet = page.getByTestId('menu-sheet');
    await expect(sheet.getByTestId('confirm-ingredients')).toBeVisible(); await healthyText(page);
    expect(await snapshot(page)).toEqual(before);
    await sheet.getByRole('button', { name: t('menus.cancelProposal'), exact: true }).click();
    await sheet.getByRole('button', { name: t('menus.cancelWithoutAdd'), exact: true }).click();
    await expect(sheet).toHaveCount(0); expect(await snapshot(page)).toEqual(before);
    await page.getByTestId('review-menu').click(); sheet = page.getByTestId('menu-sheet');
    await sheet.getByTestId('confirm-ingredients').click(); await expect(sheet).toHaveCount(0);
    const shopping = await documentValue(page, keys.shopping);
    expect(shopping.state.lists[0].items.length).toBeGreaterThan(0);
    expect(shopping.state.lists[0].items.every((item: { unitPriceCents: number | null }) => item.unitPriceCents === null)).toBe(true);
    const after = await snapshot(page);
    for (const key of [...storageKeys, otherKey].filter(key => key !== keys.shopping)) expect(after[key]).toBe(before[key]);
    expect(errors).toEqual([]);
  });

  test(`${language}: privacy download exports exactly seven documents without any local write`, async ({ context, page }) => {
    await seed(context, fixtures(language));
    const errors = runtimeErrors(page);
    await page.goto('/'); await expect(page.getByTestId('open-profile')).toBeVisible();
    const before = await snapshot(page);
    await page.getByTestId('open-profile').click(); await page.getByTestId('profile-privacy').click();
    await expect(page.getByTestId('privacy-screen')).toBeVisible(); await healthyText(page);
    const pending = page.waitForEvent('download');
    await page.getByTestId('privacy-export-all').click();
    const download = await pending;
    expect(download.suggestedFilename()).toMatch(/^jj[-_].*\.json$/);
    const downloadedPath = await download.path(); expect(downloadedPath).not.toBeNull();
    const raw = await fs.readFile(downloadedPath!, 'utf8'), backup = JSON.parse(raw);
    expect(backup).toMatchObject({ format: 'jj-local-backup', version: 1, currency: 'EUR' });
    expect(backup.documents.map((entry: { key: string }) => entry.key).sort()).toEqual(storageKeys.slice().sort());
    expect(backup.documents).toHaveLength(7);
    for (const entry of backup.documents) expect(entry.raw).toBe(before[entry.key]);
    expect(raw).not.toContain(otherKey); expect(raw).not.toContain(otherValue);
    expect(await snapshot(page)).toEqual(before); expect(errors).toEqual([]);
  });

  test(`${language}: unavailable Web Locks block writes and preserve the exact item draft`, async ({ context, page }) => {
    await seed(context, fixtures(language));
    await page.goto('/'); await expect(page.getByTestId('tab-home')).toBeVisible();
    const before = await snapshot(page);
    await page.getByTestId('tab-list').click(); await page.getByTestId('add-item').click();
    const sheet = page.getByTestId('app-sheet');
    const product = sheet.getByRole('textbox', { name: t('app.fieldItemName'), exact: true });
    const quantity = sheet.getByRole('textbox', { name: t('app.fieldQuantity'), exact: true });
    await product.fill(productName); await quantity.fill(decimal(language, '1.5'));
    await sheet.getByRole('button', { name: t('app.unitA11y', { unit: 'kg' }), exact: true }).click();
    // Remove a real capability to test failure, never add a fake capability to pass.
    await page.evaluate(() => Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined }));
    await sheet.getByTestId('save-item').click();
    await expect(sheet.getByRole('alert')).toContainText(t('errors.storageLocksUnavailable'));
    await expect(product).toHaveValue(productName); await expect(quantity).toHaveValue(decimal(language, '1.5'));
    expect(await snapshot(page)).toEqual(before); await healthyText(page);
  });
}
