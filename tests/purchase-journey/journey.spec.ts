/// <reference types="node" />
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { V83_RECIPES } from '../../src/data/recipesV83';
import { createTranslator, unitLabel } from '../../src/i18n/core';
import { localizedRecipe } from '../../src/i18n/recipes';
import { resources } from '../../src/i18n/resources';
import { LANGUAGES, type Language, type Translator } from '../../src/i18n/types';

const keys = Object.fromEntries([
  ['shopping', 'shopping.v1'], ['menus', 'menus.v1'], ['preferences', 'preferences.v1'],
  ['settings', 'local-settings.v1'], ['expenses', 'expenses.v1'],
  ['comparisons', 'comparisons.v1'], ['observations', 'price-observations.v1'],
].map(([name, suffix]) => [name, 'jjcompraintelwgiemt.' + suffix]));
const businessKeys = Object.values(keys);
type Snapshot = Record<string, string | null>;
interface Item { id: string; name: string; quantityMilli: number; unit: string; checked: boolean; unitPriceCents: number | null; priceKind: string | null }
interface List { id: string; name: string; budgetCents: number | null; items: Item[] }
interface Shopping { version: number; state: { activeListId: string | null; lists: List[] } }
const recipe = V83_RECIPES.find(entry => entry.id === 'JJ-E03-004')!;
const pilotIds = ['lidl', 'aldi', 'hiperdino', 'superdino', 'hiperdino-express', 'mercadona'];
const defaultRecipeIds = ['arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate'];
const translationPrefixes = [...new Set(Object.keys(resources.es).map(key => key.split('.')[0]))];

// Explicit, independent source oracles. No scaler, importer or meal generator
// provides the expected quantities used by these browser assertions.
const paellaAtFour: [string, number, string][] = [
  ['arroz redondo', 360000, 'g'], ['pollo troceado', 450000, 'g'],
  ['conejo troceado', 350000, 'g'], ['judía verde plana', 220000, 'g'],
  ['garrofón cocido', 160000, 'g'], ['tomate triturado', 120000, 'g'],
  ['aceite de oliva', 45000, 'ml'], ['pimentón dulce', 4000, 'g'],
  ['azafrán', 200, 'g'], ['agua', 1100000, 'ml'], ['romero (rama)', 1000, 'ud'],
];
const fiveMealsAtFour: [string, number, string][] = [
  ['Arroz', 320000, 'g'], ['Calabacín', 400000, 'g'], ['Zanahoria', 600000, 'g'],
  ['Cebolla', 800000, 'g'], ['Aceite de oliva', 200000, 'ml'], ['Agua', 2200000, 'ml'],
  ['Lentejas secas', 360000, 'g'], ['Papas', 1100000, 'g'], ['Huevos', 6000, 'ud'],
  ['Lechuga', 200000, 'g'], ['Tomate', 1200000, 'g'], ['Garbanzos cocidos', 800000, 'g'],
  ['Calabaza', 600000, 'g'], ['Pasta', 360000, 'g'], ['Queso rallado', 60000, 'g'],
];

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(names => Object.fromEntries(names.map(name => [name, localStorage.getItem(name)])), businessKeys);
}
async function shopping(page: Page): Promise<Shopping> {
  const raw = (await snapshot(page))[keys.shopping]; expect(raw).not.toBeNull(); return JSON.parse(raw!);
}
async function activeList(page: Page): Promise<List> {
  const data = await shopping(page);
  const list = data.state.lists.find(entry => entry.id === data.state.activeListId);
  expect(list).toBeDefined(); return list!;
}
function unchangedExcept(before: Snapshot, after: Snapshot, ...changed: string[]) {
  for (const name of businessKeys.filter(name => !changed.includes(name))) expect(after[name], name).toBe(before[name]);
}
function expectItems(list: List, expected: [string, number, string][]) {
  expect(list.items.map(item => [item.name, item.quantityMilli, item.unit]).sort()).toEqual([...expected].sort());
  expect(new Set(list.items.map(item => item.id)).size).toBe(list.items.length);
  expect(list.items.every(item => !item.checked && item.unitPriceCents === null && item.priceKind === null)).toBe(true);
}
async function begin(page: Page, language: Language) {
  // The private URL is used only for navigation. Reports never copy its value.
  await page.goto(process.env.JJ_JOURNEY_SHARE_URL ?? '/');
  await expect(page.getByTestId('welcome-title')).toBeVisible();
  expect(Object.values(await snapshot(page))).toEqual(Array(businessKeys.length).fill(null));
  await page.getByTestId('welcome-language-toggle').click();
  await page.getByTestId('language-' + language).click();
  await page.getByTestId('start-app').click();
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await expect(page.getByTestId('start-with-recipes')).toBeVisible();
  await expect(page.getByTestId('start-with-budget')).toBeVisible();
  for (const name of businessKeys.filter(name => name !== keys.preferences)) expect((await snapshot(page))[name]).toBeNull();
  return createTranslator(language, resources);
}
async function profileRoundTrip(page: Page, destination: Locator) {
  const before = await snapshot(page);
  await page.getByTestId('open-profile').click();
  await expect(page.getByTestId('profile-back')).toBeVisible();
  await page.getByTestId('profile-back').click();
  await expect(destination).toBeVisible();
  expect(await snapshot(page)).toEqual(before);
}
async function budget(page: Page, servings = '4', amount = '50', checkProfileReturn = false) {
  await page.getByTestId('start-with-budget').click();
  await expect(page.getByTestId('planning-budget-screen')).toBeVisible();
  await page.getByTestId('planning-budget-amount').fill(amount);
  await page.getByTestId('planning-meals').fill('5');
  await page.getByTestId('planning-servings').fill(servings);
  if (checkProfileReturn) {
    await profileRoundTrip(page, page.getByTestId('planning-budget-screen'));
    await expect(page.getByTestId('planning-budget-amount')).toHaveValue(amount);
    await expect(page.getByTestId('planning-meals')).toHaveValue('5');
    await expect(page.getByTestId('planning-servings')).toHaveValue(servings);
  }
  await page.getByTestId('planning-budget-continue').click();
  await expect(page.getByTestId('planning-stores-picker')).toBeVisible();
  await expect(page.getByTestId('prepare-menu')).toBeHidden();
}
async function recipeForFour(page: Page, t: Translator) {
  await page.getByTestId('start-with-recipes').click();
  await expect(page.getByTestId('menu-catalog-recipe-' + recipe.id)).toBeVisible();
  await page.getByTestId('menu-catalog-recipe-' + recipe.id).click();
  const sheet = page.getByTestId('menu-sheet');
  const rice = sheet.getByText(localizedRecipe(recipe, t).ingredients[0].name, { exact: true }).locator('..');
  await expect(sheet.getByTestId('recipe-servings')).toHaveText('2');
  await expect(rice).toContainText('180 ' + unitLabel('g', t));
  await sheet.getByRole('button', { name: t('flow.increaseServings'), exact: true }).click();
  await sheet.getByRole('button', { name: t('flow.increaseServings'), exact: true }).click();
  await expect(sheet.getByTestId('recipe-servings')).toHaveText('4');
  await expect(rice).toContainText('360 ' + unitLabel('g', t));
  await sheet.getByTestId('flow-back').click();
  await expect(sheet).toHaveCount(0);
  await page.getByRole('button', { name: t('mealJourney.editPlanningBudget'), exact: true }).click();
  const form = page.getByTestId('planning-budget-screen');
  await expect(form.getByTestId('planning-budget-amount')).toHaveValue('');
  await expect(form.getByTestId('planning-servings')).toHaveValue('4');
  await form.getByRole('button', { name: t('shell.back'), exact: true }).click();
  await page.getByTestId('menu-catalog-recipe-' + recipe.id).click();
  await expect(sheet.getByTestId('recipe-servings')).toHaveText('4');
  await sheet.getByRole('button', { name: t('menus.reviewRecipe'), exact: true }).click();
  await expect(sheet.getByTestId('ingredient-review-row')).toHaveCount(11);
  return sheet;
}
async function createEmptyList(page: Page, t: Translator, name: string, budgetCents: number) {
  await page.getByTestId('create-list').click();
  let sheet = page.getByTestId('app-sheet');
  await sheet.getByRole('textbox', { name: t('app.fieldListName'), exact: true }).fill(name);
  await sheet.getByTestId('save-list').click(); await expect(sheet).toHaveCount(0);
  await page.getByTestId('tab-list').click();
  await page.getByTestId('edit-budget').click(); sheet = page.getByTestId('app-sheet');
  await sheet.getByRole('textbox', { name: t('app.fieldBudget'), exact: true }).fill(String(budgetCents / 100));
  await sheet.getByTestId('save-budget').click(); await expect(sheet).toHaveCount(0);
  expect(await activeList(page)).toMatchObject({ name, budgetCents, items: [] });
  await page.getByTestId('tab-home').click();
}
async function capture(page: Page, info: TestInfo, name: string) {
  await page.evaluate(() => document.fonts.ready);
  const health = await page.evaluate(prefixes => {
    const width = document.documentElement.clientWidth;
    const rawKeys = [...new Set((document.body.innerText.match(/\b[a-zA-Z][\w-]*\.[a-zA-Z][\w.-]*/g) ?? [])
      .filter(key => prefixes.includes(key.split('.')[0])))];
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
          let parent: HTMLElement | null = element;
          while (parent && parent !== document.body) {
            const parentStyle = getComputedStyle(parent), box = parent.getBoundingClientRect();
            if ((/hidden|clip/.test(parentStyle.overflowX) && (rect.left < box.left - 2 || rect.right > box.right + 2)) ||
                (/hidden|clip/.test(parentStyle.overflowY) && (rect.top < box.top - 2 || rect.bottom > box.bottom + 2))) {
              clipped.push(node.textContent!.trim().slice(0, 100)); break;
            }
            if (/auto|scroll/.test(parentStyle.overflowY)) break;
            parent = parent.parentElement;
          }
        }
      }
    }
    return { horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - width), rawKeys,
      outside: [...new Set(outside)], clipped: [...new Set(clipped)] };
  }, translationPrefixes);
  expect(health, name).toEqual({ horizontalOverflow: 0, rawKeys: [], outside: [], clipped: [] });
  const filename = info.outputPath(name + '.png');
  await page.screenshot({ path: filename, fullPage: true });
  await info.attach(name, { path: filename, contentType: 'image/png' });
}
async function report(info: TestInfo, data: Record<string, unknown>) {
  const sourceCommit = process.env.JJ_JOURNEY_SOURCE_SHA;
  if (sourceCommit) expect(sourceCommit).toMatch(/^[a-f0-9]{40}$/);
  await info.attach('b05-journey-evidence', {
    body: Buffer.from(JSON.stringify({ sourceCommit: sourceCommit ?? null, physicalIPhone: false,
      nativeAppValidated: false, businessStateSeeded: false, ...data }, null, 2)), contentType: 'application/json',
  });
}
function observe(page: Page) {
  const errors: string[] = [], automaticExternalRequests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const host = new URL(page.url()).hostname;
  page.on('request', request => { const url = new URL(request.url()); if (url.protocol.startsWith('http') && url.hostname !== host) automaticExternalRequests.push(url.origin); });
  return { errors, automaticExternalRequests };
}

for (const language of ['es', 'en', 'de', 'fr'] as const) test.describe(language, () => {
  test.use({ locale: LANGUAGES[language].locale });

  test('budget chooses stores immediately, plans five meals and persists only the confirmed list', async ({ page }, info) => {
    const t = await begin(page, language), runtime = observe(page), before = await snapshot(page);
    await capture(page, info, '01-home-two-entries');
    await budget(page, '4', '50', true);
    expect(await snapshot(page)).toEqual(before);
    await expect(page.getByTestId('planning-store-count')).toHaveText(t('mealJourney.noneSelected'));
    await expect(page.getByTestId('planning-stores-continue')).toBeEnabled();
    await page.getByTestId('store-choice-lidl').click();
    await profileRoundTrip(page, page.getByTestId('planning-stores-picker'));
    await expect(page.getByTestId('store-choice-lidl')).toHaveAttribute('aria-checked', 'true');
    await page.getByTestId('store-choice-lidl').click();
    await expect(page.getByTestId('store-choice-lidl')).toHaveAttribute('aria-checked', 'false');
    expect(await snapshot(page)).toEqual(before);
    await capture(page, info, '02-budget-store-step-none');
    await page.getByTestId('planning-stores-continue').click();
    await expect(page.getByTestId('menu-servings')).toHaveText('4');
    await page.getByTestId('prepare-menu').click();
    for (const id of defaultRecipeIds) await expect(page.getByRole('button', {
      name: t('menus.recipeA11y', { title: t('recipes.' + id + '.title') }), exact: true,
    })).toBeVisible();
    expect(await snapshot(page)).toEqual(before);
    await capture(page, info, '03-five-meals-for-four');
    // Editing the budget must retain the already chosen five dishes and people.
    await page.getByRole('button', { name: t('mealJourney.editPlanningBudget'), exact: true }).click();
    let form = page.getByTestId('planning-budget-screen');
    await expect(form.getByTestId('planning-servings')).toHaveValue('4');
    await form.getByTestId('planning-budget-amount').fill('55');
    await form.getByTestId('planning-budget-continue').click();
    await page.getByTestId('planning-stores-picker').getByRole('button', { name: t('shell.back'), exact: true }).click();
    form = page.getByTestId('planning-budget-screen');
    expect(Number((await form.getByTestId('planning-budget-amount').inputValue()).replace(',', '.'))).toBe(55);
    await form.getByTestId('planning-budget-amount').fill('50');
    await form.getByTestId('planning-budget-continue').click();
    await page.getByTestId('planning-stores-continue').click();
    await expect(page.getByTestId('menu-servings')).toHaveText('4');
    await expect(page.getByTestId('prepare-menu')).toHaveCount(0);
    for (const id of defaultRecipeIds) await expect(page.getByRole('button', {
      name: t('menus.recipeA11y', { title: t('recipes.' + id + '.title') }), exact: true,
    })).toBeVisible();
    expect(await snapshot(page)).toEqual(before);
    await page.getByTestId('review-menu').click();
    const sheet = page.getByTestId('menu-sheet');
    await expect(sheet.getByTestId('ingredient-review-row')).toHaveCount(15);
    await expect(sheet.getByRole('button', { name: t('menus.newListA11y'), exact: true })).toHaveAttribute('aria-pressed', 'true');
    const name = 'QA B05 presupuesto — ñ / Ä / été';
    await sheet.getByRole('textbox', { name: t('menus.newListName'), exact: true }).fill(name);
    expect(await snapshot(page)).toEqual(before);
    await sheet.getByTestId('confirm-ingredients').click();
    await expect(page.getByTestId('planning-result-screen')).toBeVisible();
    await expect(page.getByText(t('mealJourney.costPendingTitle'), { exact: true })).toBeVisible();
    const expectedEuro = new Intl.NumberFormat(LANGUAGES[language].locale, { style: 'currency', currency: 'EUR' }).format(50);
    await expect(page.getByTestId('planning-budget-target')).toHaveText(expectedEuro);
    await expect(page.getByTestId('planning-list-budget')).toHaveText(expectedEuro);
    await profileRoundTrip(page, page.getByTestId('planning-result-screen'));
    await expect(page.getByTestId('planning-budget-target')).toHaveText(expectedEuro);
    await expect(page.getByTestId('planning-list-budget')).toHaveText(expectedEuro);
    await expect(page.getByTestId('planning-store-open-lidl')).toHaveCount(0);
    const created = await activeList(page);
    expect(created).toMatchObject({ name, budgetCents: 5000 }); expectItems(created, fiveMealsAtFour);
    expect((await shopping(page)).state.lists).toHaveLength(1);
    unchangedExcept(before, await snapshot(page), keys.shopping);
    await expect(page.getByTestId('planning-store-open-lidl')).toHaveCount(0);
    await capture(page, info, '04-saved-list-cost-pending');
    await page.getByTestId('planning-open-list').click();
    const persisted = await snapshot(page); await page.reload();
    await expect(page.getByTestId('tab-home')).toBeVisible();
    expect(await snapshot(page)).toEqual(persisted); expect(await activeList(page)).toEqual(created);
    await page.getByTestId('tab-savings').click();
    await expect(page.getByTestId('actual-spend-total')).toHaveText(t('visualSecondary.notRecorded'));
    expect(runtime.errors).toEqual([]); expect(runtime.automaticExternalRequests).toEqual([]);
    await report(info, { language, project: info.project.name, route: 'budget', meals: 5, people: 4,
      savedBudgetCents: 5000, actualExpenseRecorded: false, chosenStores: 0,
      storedIngredients: created.items.length, confirmedListCount: 1, otherSixDocumentsPreserved: true,
      profileReturnsPreserveBudgetFormSelectionAndResult: true });
  });

  test('recipe review chooses stores before its single write and preserves an existing list budget', async ({ page }, info) => {
    const t = await begin(page, language), runtime = observe(page);
    const existingName = 'QA B05 lista anterior — ñ / Ä / été';
    await createEmptyList(page, t, existingName, 7000);
    const original = await activeList(page), before = await snapshot(page);
    const sheet = await recipeForFour(page, t);
    await expect(sheet.getByRole('button', { name: t('menus.destinationA11y', { name: existingName }), exact: true })).toHaveAttribute('aria-pressed', 'true');
    const riceRow = sheet.getByTestId('ingredient-review-row').first();
    await riceRow.getByTestId('edit-ingredient').click();
    const quantity = riceRow.getByRole('textbox', { name: t('menus.ingredientQtyLabel', { index: 1 }), exact: true });
    await quantity.fill('400');
    await sheet.getByTestId('confirm-ingredients').click();
    await expect(sheet.getByTestId('planning-stores-picker')).toBeVisible();
    expect(await snapshot(page)).toEqual(before);
    await sheet.getByTestId('planning-stores-all').click();
    for (const id of pilotIds) await expect(sheet.getByTestId('store-choice-' + id)).toHaveAttribute('aria-checked', 'true');
    await sheet.getByTestId('planning-stores-none').click();
    for (const id of pilotIds) await expect(sheet.getByTestId('store-choice-' + id)).toHaveAttribute('aria-checked', 'false');
    const selection = language === 'es' ? ['lidl'] : language === 'en' ? ['lidl', 'hiperdino'] : language === 'de' ? pilotIds : [];
    for (const id of selection) await sheet.getByTestId('store-choice-' + id).click();
    await capture(page, info, '01-reviewed-recipe-stores-before-write');
    await sheet.getByTestId('journey-back-ingredients').click();
    await expect(quantity).toHaveValue('400');
    await expect(sheet.getByRole('button', { name: t('menus.destinationA11y', { name: existingName }), exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await snapshot(page)).toEqual(before);
    await sheet.getByTestId('confirm-ingredients').click();
    for (const id of pilotIds) await expect(sheet.getByTestId('store-choice-' + id)).toHaveAttribute('aria-checked', String(selection.includes(id)));
    await sheet.getByTestId('journey-stores-confirm-ingredients').click();
    await expect(page.getByTestId('planning-result-screen')).toBeVisible();
    const saved = await activeList(page);
    expect(saved.id).toBe(original.id); expect(saved.budgetCents).toBe(7000);
    expectItems(saved, paellaAtFour.map(([name, amount, unit]): [string, number, string] => [name, name === 'arroz redondo' ? 400000 : amount, unit]));
    expect((await shopping(page)).state.lists).toHaveLength(1);
    unchangedExcept(before, await snapshot(page), keys.shopping);
    await expect(page.getByText(t('mealJourney.costPendingTitle'), { exact: true })).toBeVisible();
    for (const id of pilotIds) await expect(page.getByTestId('planning-store-open-' + id)).toHaveCount(selection.includes(id) ? 1 : 0);
    if (selection.length) {
      await page.evaluate(() => {
        (window as unknown as { b05Opened: unknown[] }).b05Opened = [];
        window.open = (url, target, features) => { (window as unknown as { b05Opened: unknown[] }).b05Opened.push({ url: String(url), target, features }); return null; };
      });
      await page.getByTestId('planning-store-open-lidl').click();
      expect(await page.evaluate(() => (window as unknown as { b05Opened: unknown[] }).b05Opened)).toEqual([{
        url: 'https://www.lidl.es/c/descubre-nuevas-ofertas-cada-semana-folletos-lidl/s10087402',
        target: '_blank', features: 'noopener,noreferrer',
      }]);
    }
    await capture(page, info, '02-existing-list-and-selected-destinations');
    const afterSave = await snapshot(page);
    await page.getByTestId('planning-manual-prices').click();
    await expect(page.getByTestId('add-observation')).toBeVisible();
    await expect(page.getByText(t('prices.noSourcesTitle'), { exact: true })).toBeVisible();
    await page.getByRole('button', { name: t('prices.back'), exact: true }).click();
    await expect(page.getByTestId('planning-result-screen')).toBeVisible();
    expect(await snapshot(page)).toEqual(afterSave);
    expect(runtime.errors).toEqual([]); expect(runtime.automaticExternalRequests).toEqual([]);
    await report(info, { language, project: info.project.name, route: 'recipes', people: 4, selectedStores: selection,
      existingListBudgetCents: 7000, selectedQuantityPreservedAcrossBack: true,
      storesChosenBeforeWrite: true, writesOnlyAtFinalConfirmation: true, otherSixDocumentsPreserved: true,
      officialLinkCapturedWithoutExternalNavigation: selection.length > 0, manualProductComparisonIsSeparate: true });
  });

  test('a budget goal applies only to a new list while an explicitly selected existing list keeps its own budget', async ({ page }, info) => {
    const t = await begin(page, language), runtime = observe(page);
    const name = 'QA B05 presupuesto existente — ñ / Ä / été';
    await createEmptyList(page, t, name, 7000);
    const original = await activeList(page), before = await snapshot(page);
    await budget(page, '4', '50');
    await page.getByTestId('planning-stores-continue').click();
    await page.getByTestId('prepare-menu').click();
    await page.getByTestId('review-menu').click();
    const sheet = page.getByTestId('menu-sheet');
    await expect(sheet.getByRole('button', { name: t('menus.newListA11y'), exact: true })).toHaveAttribute('aria-pressed', 'true');
    await sheet.getByRole('button', { name: t('menus.destinationA11y', { name }), exact: true }).click();
    await expect(sheet.getByTestId('journey-new-list-budget-help')).toBeVisible();
    expect(await snapshot(page)).toEqual(before);
    await sheet.getByTestId('confirm-ingredients').click();
    await expect(page.getByTestId('planning-result-screen')).toBeVisible();
    const format = (amount: number) => new Intl.NumberFormat(LANGUAGES[language].locale, { style: 'currency', currency: 'EUR' }).format(amount);
    await expect(page.getByTestId('planning-budget-target')).toHaveText(format(50));
    await expect(page.getByTestId('planning-list-budget')).toHaveText(format(70));
    const saved = await activeList(page);
    expect(saved.id).toBe(original.id); expect(saved.budgetCents).toBe(7000);
    expectItems(saved, fiveMealsAtFour);
    expect((await shopping(page)).state.lists).toHaveLength(1);
    unchangedExcept(before, await snapshot(page), keys.shopping);
    await capture(page, info, '01-existing-budget-is-not-the-requested-goal');
    expect(runtime.errors).toEqual([]); expect(runtime.automaticExternalRequests).toEqual([]);
    await report(info, { language, project: info.project.name, route: 'budget-existing-target',
      planningBudgetCents: 5000, retainedListBudgetCents: 7000, existingIdentityPreserved: true,
      noAdditionalListCreated: true, otherSixDocumentsPreserved: true });
  });

  test('invalid requests, back navigation and failed writes preserve the saved menu and favourites', async ({ page }, info) => {
    const t = await begin(page, language), runtime = observe(page);
    // Create every previous business value through the existing UI, not storage seeding.
    await page.getByTestId('tab-menus').click();
    await page.getByRole('button', { name: t('menus.increasePeople'), exact: true }).click();
    await page.getByTestId('prepare-menu').click();
    await expect(page.getByTestId('menu-servings')).toHaveText('3');
    await expect.poll(async () => (await snapshot(page))[keys.menus]).not.toBeNull();
    const oldPlan = JSON.parse((await snapshot(page))[keys.menus]!);
    expect(JSON.stringify(oldPlan)).toContain('arroz-verduras');
    await page.getByTestId('tab-savings').click(); await page.getByTestId('open-stores').click();
    await page.getByTestId('favorite-hiperdino').click();
    await expect(page.getByTestId('favorite-hiperdino')).toHaveAttribute('aria-checked', 'true');
    await page.getByTestId('tab-home').click();
    const before = await snapshot(page);
    await page.getByTestId('start-with-budget').click();
    const form = page.getByTestId('planning-budget-screen');
    for (const attempt of [
      { amount: '0', meals: '5', people: '4', key: 'mealJourney.invalidBudget' },
      { amount: '-1', meals: '5', people: '4', key: 'mealJourney.invalidBudget' },
      { amount: '50', meals: '6', people: '4', key: 'mealJourney.invalidMeals' },
      { amount: '50', meals: '5', people: '13', key: 'mealJourney.invalidPeople' },
    ]) {
      await form.getByTestId('planning-budget-amount').fill(attempt.amount);
      await form.getByTestId('planning-meals').fill(attempt.meals);
      await form.getByTestId('planning-servings').fill(attempt.people);
      await form.getByTestId('planning-budget-continue').click();
      await expect(form.getByRole('alert')).toBeVisible();
      await expect(form.getByRole('alert')).toContainText(t(attempt.key));
      expect(await snapshot(page)).toEqual(before);
    }
    await capture(page, info, '01-invalid-request-preserves-documents');
    await form.getByTestId('planning-budget-amount').fill('50');
    await form.getByTestId('planning-meals').fill('5');
    await form.getByTestId('planning-servings').fill('12');
    await form.getByTestId('planning-budget-continue').click();
    const picker = page.getByTestId('planning-stores-picker');
    await picker.getByTestId('store-choice-lidl').click();
    await picker.getByRole('button', { name: t('shell.back'), exact: true }).click();
    await expect(form.getByTestId('planning-servings')).toHaveValue('12');
    expect(Number((await form.getByTestId('planning-budget-amount').inputValue()).replace(',', '.'))).toBe(50);
    await form.getByRole('button', { name: t('shell.back'), exact: true }).click();
    await expect(page.getByTestId('start-with-budget')).toBeVisible();
    expect(await snapshot(page)).toEqual(before);

    await budget(page, '4');
    await page.getByTestId('planning-stores-continue').click();
    await expect(page.getByTestId('menu-servings')).toHaveText('4');
    await page.getByTestId('prepare-menu').click();
    expect(await snapshot(page)).toEqual(before);
    await page.getByTestId('review-menu').click();
    const sheet = page.getByTestId('menu-sheet');
    await sheet.getByRole('textbox', { name: t('menus.newListName'), exact: true }).fill('QA B05 recuperación — ñ / Ä / été');
    await page.evaluate(blockedKey => {
      const original = Storage.prototype.setItem;
      (window as unknown as { b05RestoreWrites: () => void }).b05RestoreWrites = () => { Storage.prototype.setItem = original; };
      Storage.prototype.setItem = function (key, value) {
        if (key === blockedKey) throw new DOMException('Controlled B05 write failure', 'QuotaExceededError');
        original.call(this, key, value);
      };
    }, keys.shopping);
    try {
      await sheet.getByTestId('confirm-ingredients').click();
      await expect(sheet.getByRole('alert')).toBeVisible();
      await expect(page.getByTestId('planning-result-screen')).toHaveCount(0);
      expect(await snapshot(page)).toEqual(before);
      await capture(page, info, '02-write-failure-keeps-reviewed-draft');
    } finally {
      await page.evaluate(() => (window as unknown as { b05RestoreWrites: () => void }).b05RestoreWrites());
    }
    // Two synchronous DOM activations stress the immediate duplicate-write lock;
    // this is not presented as a physical touchscreen double-tap measurement.
    await sheet.getByTestId('confirm-ingredients').evaluate(element => { (element as HTMLElement).click(); (element as HTMLElement).click(); });
    await expect(page.getByTestId('planning-result-screen')).toBeVisible();
    const data = await shopping(page); expect(data.state.lists).toHaveLength(1);
    expectItems(await activeList(page), fiveMealsAtFour);
    expect((await activeList(page)).budgetCents).toBe(5000);
    unchangedExcept(before, await snapshot(page), keys.shopping);
    expect(JSON.parse((await snapshot(page))[keys.menus]!)).toEqual(oldPlan);
    await capture(page, info, '03-recovered-once-previous-state-preserved');
    expect(runtime.errors).toEqual([]); expect(runtime.automaticExternalRequests).toEqual([]);
    await report(info, { language, project: info.project.name, route: 'budget-safety', previousMenuServings: 3,
      requestedServings: 4, priorFavouritePreserved: 'hiperdino', rejectedMeals: 6, rejectedServings: 13,
      failedWriteCreatedNoList: true, syntheticDoubleActivationCreatedOnce: true,
      otherSixDocumentsPreserved: true, budgetStoreBackPreservedRequest: true, cancelledDraftPreservedAllSevenDocuments: true });
  });
});
