/// <reference types="node" />
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { V83_RECIPES } from '../../src/data/recipesV83';
import { createTranslator, unitLabel } from '../../src/i18n/core';
import { resources } from '../../src/i18n/resources';
import { localizedRecipe, translateIngredientName } from '../../src/i18n/recipes';
import { LANGUAGES, type Language, type Translator } from '../../src/i18n/types';

// B02 exercises the existing app, without preparing a weekly menu or creating a
// list first. Every business record is created by the UI, never storage seeding.
// Browser engines and CSS viewports do not certify Safari on a physical iPhone.
test.use({ storageState: { cookies: [], origins: [] } });
const languages: Language[] = ['es', 'en', 'de', 'fr'];
const prefix = 'jjcompraintelwgiemt.';
const keys = {
  preferences: prefix + 'preferences.v1', shopping: prefix + 'shopping.v1',
  menus: prefix + 'menus.v1', expenses: prefix + 'expenses.v1',
  comparisons: prefix + 'comparisons.v1', observations: prefix + 'price-observations.v1',
  settings: prefix + 'local-settings.v1',
};
const storageKeys = Object.values(keys);
const recipeId = 'JJ-E03-004';
const recipe = V83_RECIPES.find(entry => entry.id === recipeId)!;
const listName = 'QA B02 receta primero — ñ / Ä / été';
const translationPrefixes = [...new Set(Object.values(resources).flatMap(catalog => Object.keys(catalog).map(key => key.split('.')[0])))];

interface Item {
  id: string; name: string; quantityMilli: number; unit: string; checked: boolean;
  unitPriceCents: number | null; priceKind: string | null; note: string;
}
interface List { id: string; name: string; budgetCents: number | null; items: Item[] }
interface Shopping { version: number; state: { activeListId: string | null; lists: List[] } }
interface Expense { id: string; amountCents: number; source: string; listId: string | null; store: string }
type Snapshot = Record<string, string | null>;

// Independent, explicit oracle for the approved recipe at four servings. Do not
// derive expected amounts with the application's scaler, parser or importer.
const expectedIngredients: [string, number, string][] = [
  ['arroz redondo', 360000, 'g'], ['pollo troceado', 450000, 'g'],
  ['conejo troceado', 350000, 'g'], ['judía verde plana', 220000, 'g'],
  ['garrofón cocido', 160000, 'g'], ['tomate triturado', 120000, 'g'],
  ['aceite de oliva', 45000, 'ml'], ['pimentón dulce', 4000, 'g'],
  ['azafrán', 200, 'g'], ['agua', 1100000, 'ml'], ['romero (rama)', 1000, 'ud'],
];

function decimal(language: Language, value: string): string { return language === 'en' ? value : value.replace('.', ','); }
function euro(language: Language, cents: number): string {
  return new Intl.NumberFormat(LANGUAGES[language].locale, { style: 'currency', currency: 'EUR' }).format(cents / 100);
}
async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(names => Object.fromEntries(names.map(name => [name, localStorage.getItem(name)])), storageKeys);
}
async function value<T>(page: Page, key: string): Promise<T> {
  const text = await page.evaluate(name => localStorage.getItem(name), key);
  expect(text).not.toBeNull();
  return JSON.parse(text!) as T;
}
async function activeList(page: Page): Promise<List> {
  const data = await value<Shopping>(page, keys.shopping);
  expect(data.state.lists).toHaveLength(1);
  const list = data.state.lists.find(entry => entry.id === data.state.activeListId);
  expect(list).toBeDefined();
  return list!;
}
async function expenses(page: Page): Promise<Expense[]> {
  const text = (await snapshot(page))[keys.expenses];
  return text === null ? [] : (JSON.parse(text) as { data: { expenses: Expense[] } }).data.expenses;
}
function unchangedExcept(before: Snapshot, after: Snapshot, ...changed: string[]) {
  for (const key of storageKeys.filter(key => !changed.includes(key))) expect(after[key], key).toBe(before[key]);
}
async function begin(page: Page, language: Language) {
  // A protected staging share URL is supplied privately by the runner. Never
  // include its value in custom reports or attachments.
  await page.goto(process.env.JJ_DAILY_SHARE_URL ?? '/');
  await expect(page.getByTestId('welcome-title')).toBeVisible();
  expect(Object.values(await snapshot(page))).toEqual(Array(storageKeys.length).fill(null));
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await page.getByTestId('welcome-language-toggle').click();
  await page.getByTestId('language-' + language).click();
  await expect(page.getByTestId('language-' + language)).toHaveAttribute('aria-checked', 'true');
  await page.getByTestId('start-app').click();
  await expect(page.getByTestId('tab-home')).toBeVisible();
  expect(await value(page, keys.preferences)).toMatchObject({ version: 1, language, welcomeCompleted: true });
  const state = await snapshot(page);
  for (const key of storageKeys.filter(key => key !== keys.preferences)) expect(state[key]).toBeNull();
  await page.getByTestId('tab-menus').click();
  await page.getByTestId('menus-section-discover').click();
  await expect(page.getByTestId('menu-catalog-recipe-' + recipeId)).toBeVisible();
  return createTranslator(language, resources);
}
async function openForFour(page: Page, t: Translator, atTwo?: () => Promise<void>) {
  await page.getByTestId('menu-catalog-recipe-' + recipeId).click();
  const sheet = page.getByTestId('menu-sheet');
  await expect(sheet.getByTestId('recipe-servings')).toHaveText('2');
  const riceLine = sheet.getByText(localizedRecipe(recipe, t).ingredients[0].name, { exact: true }).locator('..');
  await expect(riceLine).toContainText('180 ' + unitLabel('g', t));
  await atTwo?.();
  await sheet.getByRole('button', { name: t('flow.increaseServings'), exact: true }).click();
  await sheet.getByRole('button', { name: t('flow.increaseServings'), exact: true }).click();
  await expect(sheet.getByTestId('recipe-servings')).toHaveText('4');
  await expect(riceLine).toContainText('360 ' + unitLabel('g', t));
  await expect(sheet.getByTestId('recipe-unmeasured-ingredient')).toHaveCount(1);
  await expect(sheet.getByTestId('recipe-unmeasured-ingredient')).toContainText(t('catalogV83Ui.toTaste'));
  return sheet;
}
async function review(page: Page, t: Translator) {
  const sheet = page.getByTestId('menu-sheet');
  await sheet.getByRole('button', { name: t('menus.reviewRecipe'), exact: true }).click();
  await expect(sheet.getByTestId('ingredient-review-row')).toHaveCount(11);
  const names = (await sheet.getByTestId('ingredient-name').allTextContents()).map(name => name.trim());
  expect(names).not.toContain(localizedRecipe(recipe, t).unmeasuredIngredients![0].name);
  return sheet;
}
async function ingredientRow(sheet: Locator, t: Translator, index: number) {
  const name = translateIngredientName(expectedIngredients[index][0], t);
  const label = t('menus.includeIngredient', { index: index + 1, name });
  const row = sheet.getByTestId('ingredient-review-row').filter({ has: sheet.page().getByRole('checkbox', { name: label, exact: true }) });
  await expect(row).toHaveCount(1);
  return row;
}
function expectIngredients(list: List) {
  expect(list.items.map(item => [item.name, item.quantityMilli, item.unit]).sort()).toEqual([...expectedIngredients].sort());
  expect(list.items.every(item => !item.checked && item.unitPriceCents === null && item.priceKind === null)).toBe(true);
}
async function rejectShoppingWrites(page: Page) {
  await page.evaluate(blockedKey => {
    const original = Storage.prototype.setItem;
    (window as unknown as { restoreB02Writes: () => void }).restoreB02Writes = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (key, text) {
      if (key === blockedKey) throw new DOMException('Controlled B02 storage failure', 'QuotaExceededError');
      original.call(this, key, text);
    };
  }, keys.shopping);
}
async function restoreWrites(page: Page) {
  await page.evaluate(() => (window as unknown as { restoreB02Writes: () => void }).restoreB02Writes());
}
async function capture(page: Page, info: TestInfo, scene: string) {
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
    return { horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - width), outside: [...new Set(outside)], clipped: [...new Set(clipped)], rawKeys };
  }, translationPrefixes);
  expect(health, scene + ': translated text geometry').toEqual({ horizontalOverflow: 0, outside: [], clipped: [], rawKeys: [] });
  const filename = info.outputPath(scene + '.png');
  await page.screenshot({ path: filename, fullPage: true });
  await info.attach(scene, { path: filename, contentType: 'image/png' });
  return { scene, health };
}
async function report(info: TestInfo, data: Record<string, unknown>) {
  await info.attach('b02-recipe-first-evidence', { body: Buffer.from(JSON.stringify({ physicalIPhone: false,
    nativeOrColdOfflineLaunchValidated: false, businessStateSeeded: false, recipeId, ...data }, null, 2)), contentType: 'application/json' });
}

for (const language of languages) test.describe(language, () => {
  test.use({ locale: LANGUAGES[language].locale });

  test('B02 recipe first: review, new list, confirmed expense, budget, history and reopened page', async ({ page, context, browser }, info) => {
    const runtimeErrors: string[] = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    const t = await begin(page, language);
    const captures: Awaited<ReturnType<typeof capture>>[] = [];
    const before = await snapshot(page);
    let sheet = await openForFour(page, t, async () => { captures.push(await capture(page, info, '01-recipe-two')); });
    captures.push(await capture(page, info, '02-recipe-four'));
    expect(await snapshot(page)).toEqual(before);
    sheet = await review(page, t);
    await expect(sheet.getByRole('button', { name: t('menus.newListA11y'), exact: true })).toHaveAttribute('aria-pressed', 'true');
    const nameField = sheet.getByRole('textbox', { name: t('menus.newListName'), exact: true });
    await nameField.fill(listName);
    captures.push(await capture(page, info, '03-new-list-review'));
    expect(await snapshot(page)).toEqual(before);
    await sheet.getByRole('button', { name: t('menus.cancelProposal'), exact: true }).click();
    await sheet.getByRole('button', { name: t('menus.continueReview'), exact: true }).click();
    await expect(nameField).toHaveValue(listName);
    await sheet.getByRole('button', { name: t('menus.cancelProposal'), exact: true }).click();
    await sheet.getByRole('button', { name: t('menus.cancelWithoutAdd'), exact: true }).click();
    await expect(sheet).toHaveCount(0);
    expect(await snapshot(page)).toEqual(before);

    await openForFour(page, t); sheet = await review(page, t);
    await sheet.getByRole('textbox', { name: t('menus.newListName'), exact: true }).fill(listName);
    await sheet.getByTestId('confirm-ingredients').click(); await expect(sheet).toHaveCount(0);
    await expect(page.getByTestId('tab-list')).toHaveAttribute('aria-selected', 'true');
    const created = await activeList(page);
    expect(created).toMatchObject({ name: listName, budgetCents: null });
    expectIngredients(created);
    unchangedExcept(before, await snapshot(page), keys.shopping);
    expect((await snapshot(page))[keys.menus]).toBeNull();
    captures.push(await capture(page, info, '04-created-from-recipe'));

    const riceName = translateIngredientName('arroz redondo', t);
    await page.getByRole('checkbox', { name: t('app.checkItemA11y', { name: riceName }), exact: true }).click();
    await expect.poll(async () => (await activeList(page)).items.find(item => item.name === 'arroz redondo')?.checked).toBe(true);
    expect(await expenses(page)).toEqual([]);
    await page.getByTestId('tab-savings').click();
    await expect(page.getByTestId('actual-spend-total')).toHaveText(t('visualSecondary.notRecorded'));
    await page.getByTestId('open-budget-page').click();
    await expect(page.getByTestId('budget-actual-value')).toHaveText(t('moneyViews.notRecorded'));
    const beforeExpense = await snapshot(page);
    await page.getByTestId('record-expense').click();
    let editor = page.getByTestId('expense-editor');
    await editor.getByTestId('expense-amount').fill(decimal(language, '8.40'));
    await editor.getByRole('button', { name: t('moneyViews.cancel'), exact: true }).click();
    await editor.getByRole('button', { name: t('moneyViews.keepEditing'), exact: true }).click();
    await expect(editor.getByTestId('expense-amount')).toHaveValue(decimal(language, '8.40'));
    await editor.getByRole('button', { name: t('moneyViews.cancel'), exact: true }).click();
    await editor.getByRole('button', { name: t('moneyViews.discard'), exact: true }).click();
    await expect(editor).toHaveCount(0);
    expect(await snapshot(page)).toEqual(beforeExpense);

    await page.getByTestId('record-expense').click(); editor = page.getByTestId('expense-editor');
    await editor.getByTestId('expense-amount').fill(decimal(language, '12.35'));
    await editor.getByTestId('expense-store').fill('QA B02 tienda');
    await editor.getByTestId('expense-review').click();
    await expect(editor.getByRole('alert')).toBeVisible();
    expect(await snapshot(page)).toEqual(beforeExpense);
    await editor.getByTestId('expense-paid-confirmation').click();
    await editor.getByTestId('expense-review').click();
    await expect(editor.getByTestId('expense-confirm-save')).toBeVisible();
    expect(await snapshot(page)).toEqual(beforeExpense);
    captures.push(await capture(page, info, '05-confirmed-payment-review'));
    await editor.getByTestId('expense-confirm-save').click(); await expect(editor).toHaveCount(0);
    expect(await expenses(page)).toMatchObject([{ amountCents: 1235, source: 'user-confirmed', listId: created.id, store: 'QA B02 tienda' }]);
    expect(await expenses(page)).toHaveLength(1);
    unchangedExcept(beforeExpense, await snapshot(page), keys.expenses);
    await expect(page.getByTestId('budget-actual-value')).toHaveText(euro(language, 1235));

    const beforeBudget = await snapshot(page);
    await page.getByTestId('budget-limit-card').click();
    const budgetEditor = page.getByTestId('app-sheet');
    await budgetEditor.getByRole('textbox', { name: t('app.fieldBudget'), exact: true }).fill(decimal(language, '40.00'));
    await budgetEditor.getByTestId('save-budget').click(); await expect(budgetEditor).toHaveCount(0);
    expect((await activeList(page)).budgetCents).toBe(4000);
    unchangedExcept(beforeBudget, await snapshot(page), keys.shopping);
    await expect(page.getByTestId('budget-limit-value')).toHaveText(euro(language, 4000));
    await expect(page.getByTestId('budget-actual-value')).toHaveText(euro(language, 1235));
    captures.push(await capture(page, info, '06-budget-with-confirmed-expense'));
    await page.getByTestId('tab-savings').click();
    await page.getByTestId('open-history').click();
    await expect(page.getByTestId('expenses-period-total')).toHaveText(euro(language, 1235));
    captures.push(await capture(page, info, '07-history'));
    const persisted = await snapshot(page), savedList = await activeList(page);
    await page.close();
    const reopened = await context.newPage();
    reopened.on('pageerror', error => runtimeErrors.push(error.message));
    await reopened.goto('/');
    await expect(reopened.getByTestId('tab-home')).toBeVisible();
    await expect(reopened.getByTestId('welcome-title')).toHaveCount(0);
    await expect(reopened.locator('html')).toHaveAttribute('lang', language);
    expect(await snapshot(reopened)).toEqual(persisted);
    expect(await activeList(reopened)).toEqual(savedList);
    await expect(reopened.getByTestId('home-actual-spend')).toContainText(euro(language, 1235));
    captures.push(await capture(reopened, info, '08-reopened-page'));
    expect(runtimeErrors).toEqual([]);
    await report(info, { language, engine: browser.browserType().name(), viewport: reopened.viewportSize(), captures,
      ingredientCount: savedList.items.length, checkedCount: savedList.items.filter(item => item.checked).length,
      confirmedExpenseCents: 1235, budgetCents: 4000, sevenDocumentsPersistedAfterPageReopen: true,
      ingredientAndNewListCancellationWroteNothing: true, expenseCancellationWroteNothing: true });
  });

  test('B02 recipe first: empty selection, invalid quantity, failed write and explicit duplicates preserve data', async ({ page, browser }, info) => {
    const runtimeErrors: string[] = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    const t = await begin(page, language);
    const captures: Awaited<ReturnType<typeof capture>>[] = [];
    const before = await snapshot(page);
    await openForFour(page, t);
    let sheet = await review(page, t);
    await sheet.getByRole('textbox', { name: t('menus.newListName'), exact: true }).fill(listName);
    for (let index = 0; index < expectedIngredients.length; index++) await (await ingredientRow(sheet, t, index)).getByRole('checkbox').click();
    await expect(sheet.getByTestId('confirm-ingredients')).toBeDisabled();
    expect(await snapshot(page)).toEqual(before);
    for (let index = 0; index < expectedIngredients.length; index++) await (await ingredientRow(sheet, t, index)).getByRole('checkbox').click();
    const rice = await ingredientRow(sheet, t, 0);
    await rice.getByTestId('edit-ingredient').click();
    const quantity = rice.getByRole('textbox', { name: t('menus.ingredientQtyLabel', { index: 1 }), exact: true });
    await quantity.fill('0');
    await sheet.getByTestId('confirm-ingredients').click();
    await expect(sheet.getByRole('alert')).toBeVisible();
    await expect(quantity).toHaveValue('0');
    expect(await snapshot(page)).toEqual(before);
    captures.push(await capture(page, info, '01-invalid-quantity-no-list'));
    await quantity.fill('360');
    await rejectShoppingWrites(page);
    try {
      await sheet.getByTestId('confirm-ingredients').click();
      await expect(sheet.getByRole('alert')).toBeVisible();
      await expect(sheet.getByTestId('confirm-ingredients')).toBeEnabled();
      await expect(quantity).toHaveValue('360');
      await expect(sheet.getByRole('textbox', { name: t('menus.newListName'), exact: true })).toHaveValue(listName);
      expect(await snapshot(page)).toEqual(before);
      captures.push(await capture(page, info, '02-failed-write-keeps-proposal'));
    } finally { await restoreWrites(page); }
    await sheet.getByTestId('confirm-ingredients').click(); await expect(sheet).toHaveCount(0);
    const created = await activeList(page);
    expect(created.name).toBe(listName); expectIngredients(created);
    unchangedExcept(before, await snapshot(page), keys.shopping);
    captures.push(await capture(page, info, '03-retry-creates-once'));

    const beforeDuplicates = await snapshot(page);
    await page.getByTestId('tab-menus').click();
    await page.getByTestId('menus-section-discover').click();
    await openForFour(page, t); sheet = await review(page, t);
    await sheet.getByTestId('confirm-ingredients').click();
    await expect(sheet.getByRole('alert')).toBeVisible();
    expect(await snapshot(page)).toEqual(beforeDuplicates);
    await (await ingredientRow(sheet, t, 0)).getByRole('button', { name: t('menus.combineA11y', { index: 1 }), exact: true }).click();
    for (let index = 1; index < expectedIngredients.length; index++) {
      await (await ingredientRow(sheet, t, index)).getByRole('button', { name: t('menus.keepExistingA11y', { index: index + 1 }), exact: true }).click();
    }
    captures.push(await capture(page, info, '04-explicit-duplicate-decisions'));
    expect(await snapshot(page)).toEqual(beforeDuplicates);
    await sheet.getByTestId('confirm-ingredients').click(); await expect(sheet).toHaveCount(0);
    const combined = await activeList(page);
    expect(combined.id).toBe(created.id);
    expect(combined.items).toHaveLength(11);
    const oldRice = created.items.find(item => item.name === 'arroz redondo')!;
    expect(combined.items.find(item => item.id === oldRice.id)).toEqual({ ...oldRice, quantityMilli: 720000 });
    expect(combined.items.filter(item => item.id !== oldRice.id)).toEqual(created.items.filter(item => item.id !== oldRice.id));
    unchangedExcept(beforeDuplicates, await snapshot(page), keys.shopping);
    const persisted = await snapshot(page);
    await page.reload(); await expect(page.getByTestId('tab-home')).toBeVisible();
    expect(await snapshot(page)).toEqual(persisted);
    expect(await activeList(page)).toEqual(combined);
    expect(runtimeErrors).toEqual([]);
    await report(info, { language, engine: browser.browserType().name(), viewport: page.viewportSize(), captures,
      controlledStorageFailure: true, failedWriteCreatedNoList: true, invalidQuantityAndEmptySelectionWroteNothing: true,
      recoveredListCount: 1, ingredientCount: combined.items.length, riceAfterExplicitCombinationMilli: 720000,
      duplicateRejectionWroteNothing: true, otherSixDocumentsPreserved: true });
  });

  test('B02 empty list: zero products, unpaid budget and cancelled item survive page reopen', async ({ page, context, browser }, info) => {
    const runtimeErrors: string[] = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    const t = await begin(page, language);
    const captures: Awaited<ReturnType<typeof capture>>[] = [];
    const before = await snapshot(page);
    // This separate empty-state case intentionally creates a manual empty list.
    // It does not change the recipe-first order tested in the other cases.
    await page.getByTestId('tab-home').click();
    await page.getByTestId('create-list').click();
    let sheet = page.getByTestId('app-sheet');
    const emptyName = 'QA B02 lista vacía — ñ / Ä / été';
    await sheet.getByRole('textbox', { name: t('app.fieldListName'), exact: true }).fill(emptyName);
    await sheet.getByTestId('save-list').click(); await expect(sheet).toHaveCount(0);
    const created = await activeList(page);
    expect(created).toMatchObject({ name: emptyName, budgetCents: null, items: [] });
    unchangedExcept(before, await snapshot(page), keys.shopping);
    await page.getByTestId('tab-list').click();
    await expect(page.getByRole('heading', { name: t('app.listCount', { count: 0 }), exact: true })).toBeVisible();
    await expect(page.getByText(t('app.noItemsTitle'), { exact: true })).toBeVisible();
    await expect(page.getByText(t('app.noItemsBody'), { exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    await expect(page.getByTestId('share-list')).toBeDisabled();
    captures.push(await capture(page, info, '01-saved-empty-list'));
    await page.getByTestId('edit-budget').click(); sheet = page.getByTestId('app-sheet');
    await sheet.getByRole('textbox', { name: t('app.fieldBudget'), exact: true }).fill(decimal(language, '20.00'));
    await sheet.getByTestId('save-budget').click(); await expect(sheet).toHaveCount(0);
    const emptyBudgeted = await activeList(page);
    expect(emptyBudgeted).toEqual({ ...created, budgetCents: 2000 });
    expect(await expenses(page)).toEqual([]);
    unchangedExcept(before, await snapshot(page), keys.shopping);
    const beforeItem = await snapshot(page);
    await page.getByTestId('add-item').click(); sheet = page.getByTestId('app-sheet');
    await sheet.getByRole('textbox', { name: t('app.fieldItemName'), exact: true }).fill('QA B02 producto no guardado');
    await sheet.getByRole('button', { name: t('common.close'), exact: true }).click();
    await sheet.getByRole('button', { name: t('app.keepEditing'), exact: true }).click();
    await expect(sheet.getByRole('textbox', { name: t('app.fieldItemName'), exact: true })).toHaveValue('QA B02 producto no guardado');
    await sheet.getByRole('button', { name: t('common.close'), exact: true }).click();
    await sheet.getByRole('button', { name: t('app.discardChanges'), exact: true }).click();
    await expect(sheet).toHaveCount(0);
    expect(await snapshot(page)).toEqual(beforeItem);
    await expect(page.getByText(t('app.noItemsTitle'), { exact: true })).toBeVisible();
    await page.getByTestId('tab-savings').click();
    await expect(page.getByTestId('actual-spend-total')).toHaveText(t('visualSecondary.notRecorded'));
    await page.getByTestId('open-budget-page').click();
    await expect(page.getByTestId('budget-limit-value')).toHaveText(euro(language, 2000));
    await expect(page.getByTestId('budget-actual-value')).toHaveText(t('moneyViews.notRecorded'));
    await expect(page.getByTestId('budget-annotated-total')).toHaveText('—');
    expect(await expenses(page)).toEqual([]);
    captures.push(await capture(page, info, '02-empty-budget-without-expense'));
    const persisted = await snapshot(page);
    await page.close();
    const reopened = await context.newPage();
    reopened.on('pageerror', error => runtimeErrors.push(error.message));
    await reopened.goto('/'); await expect(reopened.getByTestId('tab-home')).toBeVisible();
    await expect(reopened.getByTestId('welcome-title')).toHaveCount(0);
    await expect(reopened.locator('html')).toHaveAttribute('lang', language);
    expect(await snapshot(reopened)).toEqual(persisted);
    expect(await activeList(reopened)).toEqual(emptyBudgeted);
    await reopened.getByTestId('tab-list').click();
    await expect(reopened.getByText(t('app.noItemsTitle'), { exact: true })).toBeVisible();
    await expect(reopened.getByRole('checkbox')).toHaveCount(0);
    await expect(reopened.getByTestId('share-list')).toBeDisabled();
    captures.push(await capture(reopened, info, '03-reopened-empty-list'));
    expect(runtimeErrors).toEqual([]);
    await report(info, { language, engine: browser.browserType().name(), viewport: reopened.viewportSize(), captures,
      emptyListCount: 1, ingredientCount: 0, budgetCents: 2000, expenseCount: 0,
      itemCancellationWroteNothing: true, sevenDocumentsPersistedAfterPageReopen: true });
  });
});
