/// <reference types="node" />
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs/promises';
import { createTranslator, unitLabel } from '../../src/i18n/core';
import { resources } from '../../src/i18n/resources';
import { LANGUAGES, type Language } from '../../src/i18n/types';
import { RECIPES } from '../../src/data/recipes';
import { localizedRecipe, translateIngredientName } from '../../src/i18n/recipes';

// These eight cases create every business document through the real UI in an
// empty browser context. No storage seeding, internal API mocks or account flow.
// WebKit on Linux with mobile CSS sizes is not a physical iPhone/Safari result.
const languages: Language[] = ['es', 'en', 'de', 'fr'];
const prefix = 'jjcompraintelwgiemt.';
const keys = {
  preferences: prefix + 'preferences.v1', shopping: prefix + 'shopping.v1',
  menus: prefix + 'menus.v1', expenses: prefix + 'expenses.v1',
  comparisons: prefix + 'comparisons.v1', observations: prefix + 'price-observations.v1',
  settings: prefix + 'local-settings.v1',
};
const storageKeys = Object.values(keys);
const listName = 'QA piloto — ñ / Ä / été';
const productName = 'QA Café piloto — ñ / Ä / été';
const privateNote = 'QA_PRIVATE_IPHONE_NOTE_ñÄété';
const translationPrefixes = [...new Set(Object.values(resources).flatMap(catalog => Object.keys(catalog).map(key => key.split('.')[0])))];

// Independent conversion of the value actually reviewed in the UI; no domain
// parser, recipe scaling or ingredient merger is reused as an expected result.
function reviewedMilli(value: string): number {
  // Editable quantities have no digit grouping and may use either decimal mark.
  const normalized = value.trim().replace(',', '.');
  expect(normalized).toMatch(/^\d+(?:\.\d{1,3})?$/);
  const [whole, fraction = ''] = normalized.split('.');
  return Number(whole) * 1000 + Number(fraction.padEnd(3, '0'));
}

interface Item {
  id: string; name: string; quantityMilli: number; unit: string; checked: boolean;
  unitPriceCents: number | null; priceKind: string | null; note: string;
}
interface List { id: string; name: string; budgetCents: number | null; items: Item[] }
interface Shopping { version: number; state: { activeListId: string | null; lists: List[] } }
interface Menu { version: number; plan: { servings: number; recipeIds: string[] } | null }
interface Expense { id: string; amountCents: number; source: string; listId: string | null; store: string }

function decimal(language: Language, value: string): string { return language === 'en' ? value : value.replace('.', ','); }
function euro(language: Language, cents: number): string {
  return new Intl.NumberFormat(LANGUAGES[language].locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);
}
async function raw(page: Page, key: string): Promise<string | null> {
  return page.evaluate(name => localStorage.getItem(name), key);
}
async function documentValue<T>(page: Page, key: string): Promise<T> {
  const value = await raw(page, key); expect(value).not.toBeNull(); return JSON.parse(value!) as T;
}
async function snapshot(page: Page): Promise<Record<string, string | null>> {
  return page.evaluate(names => Object.fromEntries(names.map(name => [name, localStorage.getItem(name)])), storageKeys);
}
async function activeList(page: Page): Promise<List> {
  const stored = await documentValue<Shopping>(page, keys.shopping);
  const list = stored.state.lists.find(entry => entry.id === stored.state.activeListId);
  expect(list).toBeDefined(); return list!;
}
async function expenses(page: Page): Promise<Expense[]> {
  const value = await raw(page, keys.expenses);
  return value === null ? [] : (JSON.parse(value) as { data: { expenses: Expense[] } }).data.expenses;
}

async function requireStorageCapabilities(page: Page, info: TestInfo) {
  const result = await page.evaluate(async () => {
    const result = { secureContext: isSecureContext, webLocks: typeof navigator.locks?.request === 'function',
      webCrypto: typeof crypto?.subtle?.digest === 'function', indexedDB: typeof indexedDB?.open === 'function',
      strictDurability: false, diagnosticDatabaseRemoved: false, error: '' };
    if (!result.indexedDB) return result;
    const name = 'jj-iphone-pilot-capabilities-' + Date.now() + '-' + Math.random().toString(16).slice(2);
    let database: IDBDatabase | undefined;
    try {
      database = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(name, 1);
        request.onupgradeneeded = () => request.result.createObjectStore('capability');
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
      await new Promise<void>((resolve, reject) => {
        const transaction = database!.transaction('capability', 'readwrite', { durability: 'strict' });
        result.strictDurability = transaction.durability === 'strict';
        transaction.objectStore('capability').put('technical probe, no business data', 'probe');
        transaction.oncomplete = () => resolve();
        transaction.onabort = transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) { result.error = error instanceof Error ? error.name : 'storage probe failed'; }
    finally {
      database?.close();
      await new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.onsuccess = () => { result.diagnosticDatabaseRemoved = true; resolve(); };
        request.onerror = () => reject(request.error);
      });
    }
    return result;
  });
  info.annotations.push({ type: 'storage-capabilities', description: JSON.stringify(result) });
  expect(result, 'The selected iPhone web test must support durable writes; do not skip mutation checks').toEqual({
    secureContext: true, webLocks: true, webCrypto: true, indexedDB: true,
    strictDurability: true, diagnosticDatabaseRemoved: true, error: '',
  });
  return result;
}

async function capture(page: Page, info: TestInfo, language: Language, scene: string) {
  await page.evaluate(() => document.fonts.ready);
  const health = await page.evaluate(prefixes => {
    const width = document.documentElement.clientWidth;
    const labels = [...document.querySelectorAll('[aria-label]')].map(element => element.getAttribute('aria-label')).join('\n');
    const rawKeys = [...new Set(((document.body.innerText + '\n' + labels).match(/\b[a-zA-Z][\w-]*\.[a-zA-Z][\w.-]*/g) ?? [])
      .filter(value => prefixes.includes(value.split('.')[0])))];
    const outside: string[] = [], clipped: string[] = [];
    for (const element of document.querySelectorAll<HTMLElement>('body *')) {
      if (/^(SCRIPT|STYLE|INPUT|TEXTAREA|SVG|PATH)$/.test(element.tagName)) continue;
      const style = getComputedStyle(element), bounds = element.getBoundingClientRect();
      if (style.visibility === 'hidden' || style.display === 'none' || bounds.width < 1 || bounds.height < 1) continue;
      for (const node of [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())) {
        const range = document.createRange(); range.selectNodeContents(node);
        for (const rect of range.getClientRects()) {
          if (rect.width < 1 || rect.height < 1) continue;
          if (rect.left < -2 || rect.right > width + 2) outside.push(node.textContent!.trim().slice(0, 100));
          let ancestor: HTMLElement | null = element;
          while (ancestor && ancestor !== document.body) {
            const ancestorStyle = getComputedStyle(ancestor), box = ancestor.getBoundingClientRect();
            if ((ancestorStyle.overflowX === 'hidden' && (rect.left < box.left - 2 || rect.right > box.right + 2)) ||
              (ancestorStyle.overflowY === 'hidden' && (rect.top < box.top - 2 || rect.bottom > box.bottom + 2))) {
              clipped.push(node.textContent!.trim().slice(0, 100)); break;
            }
            if (/(auto|scroll)/.test(ancestorStyle.overflowY)) break;
            ancestor = ancestor.parentElement;
          }
        }
      }
    }
    return { horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - width),
      outside: [...new Set(outside)], clipped: [...new Set(clipped)], rawKeys };
  }, translationPrefixes);
  expect(health, `${scene}: text must remain readable at this CSS viewport`).toEqual({ horizontalOverflow: 0, outside: [], clipped: [], rawKeys: [] });
  const filename = info.outputPath(`${language}-${scene}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  await info.attach(scene, { path: filename, contentType: 'image/png' });
  return { scene, health, filename };
}

for (const language of languages) test.describe(language, () => {
  test.use({ locale: LANGUAGES[language].locale });

  test('local purchase journey from welcome to confirmed expense and reload', async ({ page, context, browser }, info) => {
    expect(browser.browserType().name()).toBe('webkit');
    const t = createTranslator(language, resources);
    const runtimeErrors: string[] = [], externalOrigins: string[] = [];
    const origin = new URL(String(info.project.use.baseURL)).origin;
    page.on('pageerror', error => runtimeErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
    page.on('request', request => {
      if (/^https?:/.test(request.url())) {
        const requestOrigin = new URL(request.url()).origin;
        if (requestOrigin !== origin) externalOrigins.push(requestOrigin);
      }
    });
    const captures: Awaited<ReturnType<typeof capture>>[] = [];
    info.annotations.push({ type: 'execution-scope', description: 'Linux WebKit with mobile CSS viewport; physical iPhone, real Safari/keyboard/VoiceOver and native sharing unverified.' });

    await page.goto('/');
    await expect(page.getByTestId('welcome-title')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    expect(Object.values(await snapshot(page))).toEqual(Array(storageKeys.length).fill(null));
    const capabilities = await requireStorageCapabilities(page, info);
    await page.getByTestId('welcome-language-toggle').click();
    await page.getByTestId(`language-${language}`).click();
    await expect(page.getByTestId(`language-${language}`)).toHaveAttribute('aria-checked', 'true');
    captures.push(await capture(page, info, language, '01-welcome'));
    await page.getByTestId('start-app').click();
    await expect(page.getByTestId('tab-home')).toBeVisible();
    expect(await documentValue(page, keys.preferences)).toMatchObject({ version: 1, language, welcomeCompleted: true });

    await page.getByTestId('create-list').click();
    let sheet = page.getByTestId('app-sheet');
    await sheet.getByRole('textbox', { name: t('app.fieldListName'), exact: true }).fill(listName);
    await sheet.getByTestId('save-list').click(); await expect(sheet).toHaveCount(0);
    await page.getByTestId('tab-list').click();
    await page.getByTestId('edit-budget').click(); sheet = page.getByTestId('app-sheet');
    await sheet.getByRole('textbox', { name: t('app.fieldBudget'), exact: true }).fill(decimal(language, '40.00'));
    await sheet.getByTestId('save-budget').click(); await expect(sheet).toHaveCount(0);
    await page.getByTestId('add-item').click(); sheet = page.getByTestId('app-sheet');
    await sheet.getByRole('textbox', { name: t('app.fieldItemName'), exact: true }).fill(productName);
    await sheet.getByRole('textbox', { name: t('app.fieldQuantity'), exact: true }).fill('2');
    await sheet.getByRole('button', { name: t('app.unitA11y', { unit: unitLabel('ud', t) }), exact: true }).click();
    await sheet.getByRole('textbox', { name: t('app.fieldPrice'), exact: true }).fill(decimal(language, '1.25'));
    await sheet.getByRole('button', { name: t('app.enteredPrice'), exact: true }).click();
    await sheet.getByRole('textbox', { name: t('app.fieldNote'), exact: true }).fill(privateNote);
    await sheet.getByTestId('save-item').click(); await expect(sheet).toHaveCount(0);
    const manualList = await activeList(page), manualItem = manualList.items[0];
    expect(manualList).toMatchObject({ name: listName, budgetCents: 4000, items: [{ name: productName,
      quantityMilli: 2000, unit: 'ud', unitPriceCents: 125, priceKind: 'entered', checked: false, note: privateNote }] });
    expect(manualList.items).toHaveLength(1);
    captures.push(await capture(page, info, language, '02-manual-list'));

    // Already-loaded offline use only; this does not test a PWA cold launch.
    await context.setOffline(true);
    await page.getByTestId('tab-menus').click();
    await page.getByTestId('prepare-menu').click();
    await expect(page.getByTestId('review-menu')).toBeVisible();
    const menu = await documentValue<Menu>(page, keys.menus);
    expect(menu.plan?.servings).toBe(2); expect(menu.plan?.recipeIds).toHaveLength(5);
    expect(new Set(menu.plan!.recipeIds).size).toBe(5);
    expect(await activeList(page)).toEqual(manualList);
    captures.push(await capture(page, info, language, '03-prepared-menu'));
    const recipe = RECIPES.find(entry => entry.id === menu.plan!.recipeIds[0]); expect(recipe).toBeDefined();
    const openRecipeForFour = async () => {
      await page.getByRole('button', { name: t('menus.recipeA11y', { title: localizedRecipe(recipe!, t).title }), exact: true }).click();
      const detail = page.getByTestId('menu-sheet');
      await expect(detail.getByTestId('recipe-servings')).toHaveText('2');
      await detail.getByRole('button', { name: t('flow.increaseServings'), exact: true }).click();
      await detail.getByRole('button', { name: t('flow.increaseServings'), exact: true }).click();
      await expect(detail.getByTestId('recipe-servings')).toHaveText('4');
    };
    await openRecipeForFour();
    captures.push(await capture(page, info, language, '04-recipe'));
    const beforeReview = await snapshot(page);
    await page.getByTestId('menu-sheet').getByRole('button', { name: t('menus.reviewRecipe'), exact: true }).click(); sheet = page.getByTestId('menu-sheet');
    await expect(sheet.getByTestId('confirm-ingredients')).toBeVisible();
    expect(await snapshot(page)).toEqual(beforeReview);
    await sheet.getByRole('button', { name: t('menus.cancelProposal'), exact: true }).click();
    await sheet.getByRole('button', { name: t('menus.cancelWithoutAdd'), exact: true }).click();
    await expect(sheet).toHaveCount(0); expect(await snapshot(page)).toEqual(beforeReview);
    await openRecipeForFour();
    await page.getByTestId('menu-sheet').getByRole('button', { name: t('menus.reviewRecipe'), exact: true }).click(); sheet = page.getByTestId('menu-sheet');
    const rows = sheet.getByTestId('ingredient-review-row');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(1);
    // Explicitly omit one ingredient (already at home) and compare every other
    // reviewed name, quantity and unit with the saved list, preserving duplicates.
    await rows.last().getByRole('checkbox').click();
    const reviewed: [string, number, string][] = [];
    for (let index = 0; index < rowCount; index++) {
      const row = rows.nth(index);
      if (await row.getByRole('checkbox').getAttribute('aria-checked') !== 'true') continue;
      const name = (await row.getByTestId('ingredient-name').innerText()).trim();
      await row.getByTestId('edit-ingredient').click();
      const quantity = reviewedMilli(await row.locator('input[inputmode="decimal"]').inputValue());
      const selectedLabels = (await row.getByRole('button', { pressed: true }).allTextContents()).map(label => label.trim());
      const selectedUnits = (['ud', 'g', 'kg', 'ml', 'L'] as const).filter(unit => selectedLabels.includes(unitLabel(unit, t)));
      expect(selectedUnits).toHaveLength(1);
      reviewed.push([name, quantity, selectedUnits[0]]);
      await row.getByTestId('edit-ingredient').click();
    }
    expect(reviewed).toHaveLength(rowCount - 1);
    captures.push(await capture(page, info, language, '05-reviewed-ingredients'));
    await sheet.getByTestId('confirm-ingredients').click(); await expect(sheet).toHaveCount(0);
    await expect(page.getByTestId('tab-list')).toHaveAttribute('aria-selected', 'true');
    const imported = await activeList(page);
    expect(imported.name).toBe(listName); expect(imported.budgetCents).toBe(4000);
    expect(imported.items.find(item => item.id === manualItem.id)).toEqual(manualItem);
    const savedIngredients = imported.items.filter(item => item.id !== manualItem.id).map(item =>
      [translateIngredientName(item.name, t), item.quantityMilli, item.unit]);
    expect(savedIngredients.sort()).toEqual(reviewed.sort());
    expect(imported.items.filter(item => item.id !== manualItem.id).every(item =>
      item.unitPriceCents === null && item.priceKind === null && item.checked === false)).toBe(true);
    const afterImport = await snapshot(page);
    for (const key of storageKeys.filter(key => key !== keys.shopping)) expect(afterImport[key]).toBe(beforeReview[key]);

    await page.getByRole('checkbox', { name: t('app.checkItemA11y', { name: productName }), exact: true }).click();
    await expect.poll(async () => (await activeList(page)).items.find(item => item.id === manualItem.id)?.checked).toBe(true);
    await page.getByTestId('tab-savings').click();
    await expect(page.getByTestId('spent-total')).toHaveText(euro(language, 250));
    await expect(page.getByTestId('actual-spend-total')).toHaveText(t('visualSecondary.notRecorded'));
    expect(await expenses(page)).toHaveLength(0);
    captures.push(await capture(page, info, language, '06-marked-is-not-payment'));

    const beforeExpense = await snapshot(page), savedShopping = beforeExpense[keys.shopping];
    await page.getByTestId('open-budget-page').click();
    await expect(page.getByTestId('budget-actual-value')).toHaveText(t('moneyViews.notRecorded'));
    await page.getByTestId('record-expense').click();
    const editor = page.getByTestId('expense-editor');
    await editor.getByTestId('expense-amount').fill(decimal(language, '12.35'));
    await editor.getByTestId('expense-store').fill('QA tienda piloto');
    await editor.getByTestId('expense-review').click();
    await expect(editor.getByRole('alert')).toBeVisible();
    expect(await snapshot(page)).toEqual(beforeExpense);
    await expect(editor.getByTestId('expense-paid-confirmation')).toHaveAttribute('aria-checked', 'false');
    await editor.getByTestId('expense-paid-confirmation').click();
    await expect(editor.getByTestId('expense-paid-confirmation')).toHaveAttribute('aria-checked', 'true');
    await editor.getByTestId('expense-review').click();
    await expect(editor.getByTestId('expense-confirm-save')).toBeVisible();
    expect(await snapshot(page)).toEqual(beforeExpense);
    captures.push(await capture(page, info, language, '07-expense-review'));
    await editor.getByTestId('expense-confirm-save').click(); await expect(editor).toHaveCount(0);
    const savedExpenses = await expenses(page);
    expect(savedExpenses).toHaveLength(1);
    expect(savedExpenses[0]).toMatchObject({ amountCents: 1235, source: 'user-confirmed', listId: imported.id, store: 'QA tienda piloto' });
    const afterExpense = await snapshot(page);
    for (const key of storageKeys.filter(key => key !== keys.expenses)) expect(afterExpense[key]).toBe(beforeExpense[key]);
    expect(afterExpense[keys.shopping]).toBe(savedShopping);
    await expect(page.getByTestId('budget-actual-value')).toHaveText(euro(language, 1235));
    await page.getByTestId('tab-home').click();
    await expect(page.getByTestId('home-actual-spend')).toContainText(euro(language, 1235));
    await page.getByTestId('tab-savings').click();
    await expect(page.getByTestId('actual-spend-total')).toHaveText(euro(language, 1235));
    await expect(page.getByTestId('spent-total')).toHaveText(euro(language, 250));
    await page.getByTestId('open-history').click();
    await expect(page.getByTestId('expenses-period-total')).toHaveText(euro(language, 1235));
    captures.push(await capture(page, info, language, '08-confirmed-history'));

    // Review only; real OS sharing and receipt at a destination need an iPhone.
    await page.getByTestId('tab-list').click(); await page.getByTestId('share-list').click();
    const share = page.getByTestId('list-share-sheet');
    await expect(share.getByTestId('list-share-include-completed')).toHaveAttribute('aria-checked', 'false');
    await expect(share.getByTestId('list-share-preview')).not.toContainText(productName);
    await share.getByTestId('list-share-include-completed').click();
    await expect(share.getByTestId('list-share-preview')).toContainText(productName);
    const shareText = await share.getByTestId('list-share-preview').innerText();
    expect(shareText).not.toContain(privateNote); expect(shareText).not.toContain('€');
    captures.push(await capture(page, info, language, '09-reviewed-copy'));
    await share.getByTestId('list-share-close').click(); await expect(share).toHaveCount(0);
    expect(await snapshot(page)).toEqual(afterExpense);

    await context.setOffline(false); await page.reload();
    await expect(page.getByTestId('welcome-title')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await expect(page.getByTestId('home-actual-spend')).toContainText(euro(language, 1235));
    expect(await snapshot(page)).toEqual(afterExpense);
    expect(await documentValue<Menu>(page, keys.menus)).toEqual(menu);
    expect(await expenses(page)).toEqual(savedExpenses);
    captures.push(await capture(page, info, language, '10-reloaded-home'));
    expect(runtimeErrors).toEqual([]); expect(externalOrigins).toEqual([]);

    const report = { language, engine: browser.browserType().name(), version: browser.version(),
      viewport: page.viewportSize(), physicalIPhone: false, authOrHouseholdJourneyValidated: false,
      dataSetup: 'business state created only by UI in a new browser context',
      offlineScope: 'already-loaded app only; not a cold-launch or installation test', capabilities,
      expected: { budgetCents: 4000, unitPriceCents: 125, manualQuantityMilli: 2000,
        markedEnteredCents: 250, confirmedExpenseCents: 1235 },
      recipeScope: { servings: 4, weeklyPlanUnchanged: true, reviewedIngredients: reviewed, omittedIngredients: 1 },
      otherSixDocumentsPreservedOnExpense: true, allSevenDocumentsPreservedOnShare: true,
      geometryScope: 'rendered text nodes only; native keyboard, input contents, SVG geometry and physical safe areas are not certified',
      noExternalRequests: true,
      runtimeErrors, captures };
    const filename = info.outputPath(`${language}-journey.json`);
    await fs.writeFile(filename, JSON.stringify(report, null, 2) + '\n');
    await info.attach('journey-report', { path: filename, contentType: 'application/json' });
  });
});
