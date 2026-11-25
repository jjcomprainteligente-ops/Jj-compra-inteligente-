/// <reference types="node" />
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { RECIPES } from '../../src/data/recipes';
import { createTranslator } from '../../src/i18n/core';
import { resources } from '../../src/i18n/resources';
import { LANGUAGES, type Language, type Translator } from '../../src/i18n/types';

const prefix = 'jjcompraintelwgiemt.';
const keys = {
  shopping: prefix + 'shopping.v1', menus: prefix + 'menus.v1', comparisons: prefix + 'comparisons.v1',
  observations: prefix + 'price-observations.v1', expenses: prefix + 'expenses.v1',
  settings: prefix + 'local-settings.v1', preferences: prefix + 'preferences.v1',
} as const;
const storageKeys = Object.values(keys);
const firstFive = ['arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate'];
// Independent reviewed legacy identities; no diet is inferred from V3 titles.
const veganFour = ['arroz-verduras', 'lentejas-casa', 'garbanzos-calabaza', 'cuscus-verduras'];
const translationPrefixes = [...new Set(Object.keys(resources.es).map(key => key.split('.')[0]))];
type Snapshot = Record<string, string | null>;
interface StoredItem {
  id: string; name: string; quantityMilli: number; unit: string; category: string; note: string;
  checked: boolean; unitPriceCents: number | null; priceKind: string | null;
}
interface StoredList { id: string; name: string; budgetCents: number | null; items: StoredItem[] }
interface StoredShopping { version: number; state: { activeListId: string | null; lists: StoredList[] } }
type StoredMenu =
  | { version: 1; plan: { servings: number; recipeIds: string[] } }
  | { version: 2; plan: { kind: 'variable'; servings: number; meals: string[] } };
interface Write { key: string; operation: string }
type ProbeWindow = Window & { b054Writes: Write[] };

function fixtures(language: Language): Record<string, string> {
  return {
    [keys.shopping]: JSON.stringify({ version: 1, state: { activeListId: 'b054-existing-list', lists: [{
      id: 'b054-existing-list', name: 'QA previa · ñ / Größe / crème', budgetCents: 6100, items: [{
        id: 'b054-existing-bread', name: 'Pan', quantityMilli: 2000, unit: 'ud', category: 'Panadería',
        note: 'Conservar cantidad, precio y estado', checked: true, unitPriceCents: 235, priceKind: 'entered',
      }],
    }] } }),
    // Deliberate whitespace proves a read/reload does not silently reserialize V1.
    [keys.menus]: JSON.stringify({ version: 1, plan: { servings: 2, recipeIds: firstFive } }, null, 2),
    [keys.comparisons]: JSON.stringify({ version: 1, comparisons: [{ id: 'b054-comparison', name: 'QA comparación conservada', offers: [] }] }),
    [keys.observations]: JSON.stringify({ version: 1, observations: [{
      id: 'b054-observation', product: 'Arroz QA', brand: 'Marca ficticia QA', format: 'Bolsa', quality: 'Prueba',
      store: 'Comercio ficticio QA', quantityMilli: 1000, unit: 'kg', priceCents: 250, observedOn: '2026-11-24',
      sourceKind: 'manual', sourceReference: 'Dato ficticio de prueba aislada', url: null,
    }] }),
    [keys.expenses]: JSON.stringify({ version: 1, data: { expenses: [{
      id: 'b054-expense', amountCents: 1234, date: '2026-11-24', store: 'Comercio ficticio QA',
      note: 'Gasto ficticio conservado', listId: 'b054-existing-list', listName: 'QA previa · ñ / Größe / crème', source: 'user-confirmed',
    }] } }),
    [keys.settings]: JSON.stringify({ version: 1, preferences: { favoriteStores: ['hiperdino'], inAppReminders: true } }),
    [keys.preferences]: JSON.stringify({ version: 1, language, welcomeCompleted: true }),
  };
}

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(names => Object.fromEntries(names.map(name => [name, localStorage.getItem(name)])), storageKeys);
}
async function rawMenu(page: Page) { return (await snapshot(page))[keys.menus]; }
async function storedMenu(page: Page): Promise<StoredMenu> { return JSON.parse((await rawMenu(page))!); }
async function writes(page: Page, key?: string): Promise<Write[]> {
  const recorded = await page.evaluate(() => (window as unknown as ProbeWindow).b054Writes);
  return key ? recorded.filter(write => write.key === key) : recorded;
}
async function resetWrites(page: Page) { await page.evaluate(() => { (window as unknown as ProbeWindow).b054Writes = []; }); }
function unchangedExcept(before: Snapshot, after: Snapshot, ...changed: string[]) {
  for (const key of storageKeys.filter(key => !changed.includes(key))) expect(after[key], key).toBe(before[key]);
}
async function begin(page: Page, language: Language) {
  // The private staging URL is navigation input only; never copy it to evidence.
  await page.goto(process.env.JJ_VARIABLE_SHARE_URL ?? '/');
  await expect(page.getByTestId('welcome-title')).toBeVisible();
  expect(Object.values(await snapshot(page))).toEqual(Array(storageKeys.length).fill(null));
  const data = fixtures(language);
  await page.evaluate(entries => {
    for (const [key, raw] of Object.entries(entries)) localStorage.setItem(key, raw);
  }, data);
  await page.addInitScript(names => {
    const probe = window as unknown as ProbeWindow;
    probe.b054Writes = [];
    const setItem = Storage.prototype.setItem, removeItem = Storage.prototype.removeItem, clear = Storage.prototype.clear;
    Storage.prototype.setItem = function (key, value) {
      if (this === localStorage && names.includes(key)) probe.b054Writes.push({ key, operation: 'setItem' });
      return setItem.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key) {
      if (this === localStorage && names.includes(key)) probe.b054Writes.push({ key, operation: 'removeItem' });
      return removeItem.call(this, key);
    };
    Storage.prototype.clear = function () {
      if (this === localStorage) probe.b054Writes.push({ key: '*', operation: 'clear' });
      return clear.call(this);
    };
  }, storageKeys);
  await page.reload();
  await expect(page.getByTestId('open-profile')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  expect(await snapshot(page)).toEqual(data);
  expect(await writes(page)).toEqual([]);
  return createTranslator(language, resources);
}
async function openMenus(page: Page) {
  await page.getByTestId('tab-menus').click();
  await expect(page.getByTestId('menu-meal-count')).toBeVisible();
}
async function setMeals(page: Page, t: Translator, count: number) {
  let current = Number(await page.getByTestId('menu-meal-count').innerText());
  while (current !== count) {
    const next = current + (count > current ? 1 : -1);
    await page.getByRole('button', { name: t(count > current ? 'variableMenus.increaseMeals' : 'variableMenus.reduceMeals'), exact: true }).click();
    await expect(page.getByTestId('menu-meal-count')).toHaveText(String(next));
    current = next;
  }
}
async function setPeople(page: Page, t: Translator, count: number) {
  let current = Number(await page.getByTestId('menu-servings').innerText());
  while (current !== count) {
    const next = current + (count > current ? 1 : -1);
    await page.getByRole('button', { name: t(count > current ? 'menus.increasePeople' : 'menus.reducePeople'), exact: true }).click();
    await expect(page.getByTestId('menu-servings')).toHaveText(String(next));
    current = next;
  }
}
async function propose(page: Page): Promise<Locator> {
  const prepare = page.getByTestId('prepare-menu');
  if (await prepare.count()) await prepare.click();
  else await page.getByTestId('menu-new-proposal').click();
  const sheet = page.getByTestId('menu-plan-proposal-sheet');
  await expect(sheet).toBeVisible();
  return sheet;
}
async function confirmPlan(page: Page) {
  await page.getByTestId('confirm-menu-plan').click();
  await expect(page.getByTestId('menu-plan-proposal-sheet')).toHaveCount(0);
  await expect(page.getByTestId('review-menu')).toBeVisible();
}
async function cancelReview(page: Page, t: Translator) {
  const sheet = page.getByTestId('menu-sheet');
  await sheet.getByRole('button', { name: t('menus.cancelProposal'), exact: true }).click();
  await sheet.getByRole('button', { name: t('menus.cancelWithoutAdd'), exact: true }).click();
  await expect(sheet).toHaveCount(0);
}
async function expectMealLabels(page: Page, t: Translator, count: number) {
  for (let index = 1; index <= count; index++) await expect(page.getByText(t('variableMenus.mealIndex', { count: index }), { exact: true })).toHaveCount(1);
  await expect(page.getByText(t('variableMenus.mealIndex', { count: count + 1 }), { exact: true })).toHaveCount(0);
  await expect(page.getByTestId('menu-current-meal-count')).toHaveText(t('variableMenus.currentPlanCount', { count }));
}
async function expectReviewSource(page: Page, t: Translator, meals: number, people: number) {
  const label = t('variableMenus.reviewSource', {
    meals: t('variableMenus.mealCount.' + (meals === 1 ? 'one' : 'other'), { count: meals }),
    people: t('menus.people.' + (people === 1 ? 'one' : 'other'), { count: people }),
  });
  await expect(page.getByTestId('menu-sheet')).toContainText(label);
}
async function assertReloadPreserved(page: Page, expected: string) {
  await page.reload();
  await expect(page.getByTestId('open-profile')).toBeVisible();
  await openMenus(page);
  expect(await rawMenu(page)).toBe(expected);
  expect(await writes(page)).toEqual([]);
}

/** Capture every vertical scroll segment; fullPage alone misses RN ScrollViews. */
async function capture(page: Page, info: TestInfo, name: string, controls: Locator[] = []) {
  await page.evaluate(() => document.fonts.ready);
  const geometry: unknown[] = [];
  for (const control of controls) {
    await control.scrollIntoViewIfNeeded();
    const bounds = await control.boundingBox();
    expect(bounds, name + ': control rendered').not.toBeNull();
    expect(bounds!.width, name + ': target width').toBeGreaterThanOrEqual(44);
    expect(bounds!.height, name + ': target height').toBeGreaterThanOrEqual(44);
    geometry.push({ label: await control.getAttribute('aria-label') ?? await control.innerText(), ...bounds });
  }
  // React Native Web exposes the modal host and its labelled content as nested
  // dialogs. Inspect the inner active sheet, as the functional assertions do.
  const scope = await page.getByRole('dialog').count() ? page.getByRole('dialog').last() : page.locator('body');
  // Keep a handle because a locator ordinal can change as children enter view.
  const scrollHandle = await scope.evaluateHandle(root => {
    return [...root.querySelectorAll<HTMLElement>('*')].filter(element => {
      const box = element.getBoundingClientRect(), style = getComputedStyle(element);
      return box.width >= 200 && box.height >= 100 && /auto|scroll/.test(style.overflowY)
        && element.scrollHeight > element.clientHeight + 1;
    }).sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight))[0] ?? null;
  });
  const metrics = await scrollHandle.evaluate(element => element ? {
    original: element.scrollTop, height: element.clientHeight, total: element.scrollHeight,
  } : { original: 0, height: 0, total: 0 });
  const last = Math.max(0, metrics.total - metrics.height), step = Math.max(1, Math.floor(metrics.height * .8));
  const positions = metrics.height ? [...new Set([...Array.from({ length: Math.ceil(last / step) }, (_, index) => index * step), last])] : [0];
  const health: unknown[] = [];
  for (const [index, top] of positions.entries()) {
    await scrollHandle.evaluate((element, value) => { if (element) element.scrollTop = value; }, top);
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const current = await scope.evaluate((root, prefixes) => {
      const width = document.documentElement.clientWidth;
      const rawKeys = [...new Set(((root as HTMLElement).innerText.match(/\b[a-zA-Z][\w-]*\.[a-zA-Z][\w.-]*/g) ?? [])
        .filter(key => prefixes.includes(key.split('.')[0])))];
      const outside: string[] = [], clipped: string[] = [];
      for (const element of root.querySelectorAll<HTMLElement>('*')) {
        if (/^(SCRIPT|STYLE|SVG|PATH|INPUT|TEXTAREA)$/.test(element.tagName)) continue;
        const style = getComputedStyle(element), bounds = element.getBoundingClientRect();
        if (style.visibility === 'hidden' || style.display === 'none' || bounds.width < 1 || bounds.height < 1) continue;
        for (const node of [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())) {
          const range = document.createRange(); range.selectNodeContents(node);
          for (const rect of range.getClientRects()) {
            if (rect.width < 1 || rect.height < 1 || rect.bottom <= 0 || rect.top >= innerHeight) continue;
            if (rect.left < -2 || rect.right > width + 2) outside.push(node.textContent!.trim().slice(0, 100));
            let parent: HTMLElement | null = element;
            while (parent && parent !== root) {
              const parentStyle = getComputedStyle(parent), box = parent.getBoundingClientRect();
              // Vertical scroll viewports intentionally conceal other segments.
              if (/auto|scroll/.test(parentStyle.overflowY)) break;
              if ((/hidden|clip/.test(parentStyle.overflowX) && (rect.left < box.left - 2 || rect.right > box.right + 2)) ||
                  (/hidden|clip/.test(parentStyle.overflowY) && (rect.top < box.top - 2 || rect.bottom > box.bottom + 2))) {
                clipped.push(node.textContent!.trim().slice(0, 100)); break;
              }
              parent = parent.parentElement;
            }
          }
        }
      }
      return { horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - width), rawKeys,
        outside: [...new Set(outside)], clipped: [...new Set(clipped)] };
    }, translationPrefixes);
    health.push({ top, ...current });
    expect(current, name + ': segment ' + index).toEqual({ horizontalOverflow: 0, rawKeys: [], outside: [], clipped: [] });
    const filename = info.outputPath(`${name}-${String(index + 1).padStart(2, '0')}.png`);
    await page.screenshot({ path: filename, fullPage: true });
    await info.attach(name + '-segment-' + (index + 1), { path: filename, contentType: 'image/png' });
  }
  await scrollHandle.evaluate((element, value) => { if (element) element.scrollTop = value; }, metrics.original);
  await scrollHandle.dispose();
  await info.attach(name + '-geometry', { body: Buffer.from(JSON.stringify({ viewport: page.viewportSize(), controls: geometry,
    scroll: metrics, positions, health, physicalIPhone: false, nativeAppValidated: false }, null, 2)), contentType: 'application/json' });
}
function counters(page: Page, t: Translator) {
  return ['variableMenus.reduceMeals', 'variableMenus.increaseMeals', 'menus.reducePeople', 'menus.increasePeople']
    .map(key => page.getByRole('button', { name: t(key), exact: true }));
}
function observe(page: Page) {
  const errors: string[] = [], externalRequests: string[] = [];
  const origin = new URL(page.url()).origin;
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { const url = new URL(request.url()); if (/^https?:$/.test(url.protocol) && url.origin !== origin) externalRequests.push(url.origin); });
  return { errors, externalRequests };
}

for (const language of ['es', 'en', 'de', 'fr'] as const) test.describe(language, () => {
  test.use({ locale: LANGUAGES[language].locale });

  test('A · preserves legacy data, confirms 1/5/14 meals and reviews the actual saved plan', async ({ page }, info) => {
    const t = await begin(page, language), runtime = observe(page), before = await snapshot(page);
    await openMenus(page);
    await expectMealLabels(page, t, 5);
    expect(await rawMenu(page)).toBe(before[keys.menus]);
    expect(await writes(page)).toEqual([]);
    await setMeals(page, t, 1);
    await expectMealLabels(page, t, 5);
    await expect(page.getByTestId('menu-pending-meal-count')).toBeVisible();
    expect(await writes(page)).toEqual([]);
    await setPeople(page, t, 12); // Existing explicit person changes still save the current five meals.
    const legacyAtTwelve = (await rawMenu(page))!;
    expect(await storedMenu(page)).toEqual({ version: 1, plan: { servings: 12, recipeIds: firstFive } });
    await resetWrites(page);
    await propose(page);
    expect(await rawMenu(page)).toBe(legacyAtTwelve);
    expect(await writes(page)).toEqual([]);
    await page.getByTestId('cancel-menu-plan').click();
    await expect(page.getByTestId('menu-plan-proposal-sheet')).toHaveCount(0);
    expect(await writes(page)).toEqual([]);
    await assertReloadPreserved(page, legacyAtTwelve);
    await setMeals(page, t, 1);
    await propose(page);
    expect(await writes(page)).toEqual([]);
    await confirmPlan(page);
    expect(await storedMenu(page)).toEqual({ version: 2, plan: { kind: 'variable', servings: 12, meals: ['arroz-verduras'] } });
    expect(await writes(page, keys.menus)).toHaveLength(1);
    await expectMealLabels(page, t, 1);
    await expect(page.getByRole('button', { name: t('variableMenus.reduceMeals'), exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: t('menus.increasePeople'), exact: true })).toBeDisabled();
    await capture(page, info, '01-one-meal-twelve-people', counters(page, t));
    const oneRaw = (await rawMenu(page))!;
    await assertReloadPreserved(page, oneRaw);
    await setMeals(page, t, 5);
    expect(await writes(page)).toEqual([]);
    await expectMealLabels(page, t, 1);
    await propose(page);
    expect(await rawMenu(page)).toBe(oneRaw);
    expect(await writes(page)).toEqual([]);
    await confirmPlan(page);
    expect(await storedMenu(page)).toEqual({ version: 1, plan: { servings: 12, recipeIds: firstFive } });
    await setPeople(page, t, 2);
    await expectMealLabels(page, t, 5);
    await capture(page, info, '02-five-meals-two-people', counters(page, t));
    const fiveRaw = (await rawMenu(page))!;
    await resetWrites(page);
    await setMeals(page, t, 14);
    await expect(page.getByRole('button', { name: t('variableMenus.increaseMeals'), exact: true })).toBeDisabled();
    await expectMealLabels(page, t, 5);
    expect(await rawMenu(page)).toBe(fiveRaw);
    expect(await writes(page)).toEqual([]);
    await page.getByTestId('review-menu').click();
    await expectReviewSource(page, t, 5, 2);
    await expect(page.getByTestId('menu-sheet').getByTestId('ingredient-review-row')).toHaveCount(15);
    await cancelReview(page, t);
    await propose(page);
    expect(await writes(page)).toEqual([]);
    await page.getByTestId('cancel-menu-plan').click();
    await expectMealLabels(page, t, 5);
    expect(await rawMenu(page)).toBe(fiveRaw);
    expect(await writes(page)).toEqual([]);
    await propose(page);
    await confirmPlan(page);
    const fourteen = await storedMenu(page);
    expect(fourteen.version).toBe(2);
    if (fourteen.version !== 2) throw new Error('Expected an explicitly confirmed V2 variable plan');
    expect(fourteen.plan.servings).toBe(2);
    expect(fourteen.plan.meals).toHaveLength(14);
    expect(new Set(fourteen.plan.meals).size).toBe(14);
    expect(fourteen.plan.meals.slice(0, 5)).toEqual(firstFive);
    expect(await writes(page, keys.menus)).toHaveLength(1);
    await expectMealLabels(page, t, 14);
    await page.getByText(t('variableMenus.mealIndex', { count: 14 }), { exact: true }).scrollIntoViewIfNeeded();
    await capture(page, info, '03-fourteen-meals', counters(page, t));
    const fourteenRaw = (await rawMenu(page))!;
    await resetWrites(page);
    await setMeals(page, t, 1);
    await expectMealLabels(page, t, 14);
    await page.getByTestId('review-menu').click();
    await expectReviewSource(page, t, 14, 2);
    const sheet = page.getByTestId('menu-sheet'), notes = sheet.getByTestId('review-recipe-notes');
    await expect(notes).toBeVisible();
    await expect(notes).toContainText(t('variableMenus.reviewNotesHelp'));
    expect(await notes.getByTestId('review-unmeasured-ingredient').count()).toBeGreaterThan(0);
    await expect(notes.getByRole('checkbox')).toHaveCount(0);
    await expect(sheet.getByTestId('ingredient-review-row').getByTestId('review-unmeasured-ingredient')).toHaveCount(0);
    await capture(page, info, '04-fourteen-meal-review', [sheet.getByTestId('confirm-ingredients')]);
    expect(await writes(page)).toEqual([]);
    expect(await rawMenu(page)).toBe(fourteenRaw);
    await cancelReview(page, t);
    unchangedExcept(before, await snapshot(page), keys.menus);
    await assertReloadPreserved(page, fourteenRaw);
    await expectMealLabels(page, t, 14);
    unchangedExcept(before, await snapshot(page), keys.menus);
    expect(runtime).toEqual({ errors: [], externalRequests: [] });
  });

  test('B · keeps vegan filters strict at 14 and confirms the four reviewed legacy recipes', async ({ page }, info) => {
    const t = await begin(page, language), runtime = observe(page), before = await snapshot(page);
    await openMenus(page);
    await setMeals(page, t, 14);
    await page.getByTestId('menu-filters-open').click();
    const filters = page.getByTestId('menu-filter-sheet');
    await filters.getByTestId('menu-filter-preference-vegan').click();
    await expect(filters.getByTestId('menu-filter-count')).toHaveText(t('menuFilters.count', { count: 4, total: RECIPES.length }));
    await filters.getByTestId('menu-filters-apply').click();
    await expect(filters).toHaveCount(0);
    await page.getByTestId('menu-new-proposal').click();
    await expect(page.getByRole('alert')).toContainText(t('errors.draftNotEnough', { count: 4, requested: 14 }));
    await expect(page.getByTestId('menu-plan-proposal-sheet')).toHaveCount(0);
    await expectMealLabels(page, t, 5);
    expect(await snapshot(page)).toEqual(before);
    expect(await writes(page)).toEqual([]);
    await capture(page, info, '05-fourteen-vegan-insufficient', counters(page, t));
    await page.getByTestId('menus-section-discover').click();
    await expect(page.getByTestId('menu-catalog-count')).toHaveText(t('menuFilters.count', { count: 4, total: RECIPES.length }));
    await expect(page.locator('[data-testid^="menu-catalog-recipe-JJ-"]')).toHaveCount(0);
    for (const id of veganFour) await expect(page.getByTestId('menu-catalog-recipe-' + id)).toBeVisible();
    await page.getByTestId('menus-section-week').click();
    await setMeals(page, t, 4);
    await propose(page);
    expect(await snapshot(page)).toEqual(before);
    expect(await writes(page)).toEqual([]);
    await confirmPlan(page);
    expect(await storedMenu(page)).toEqual({ version: 2, plan: { kind: 'variable', servings: 2, meals: veganFour } });
    await expectMealLabels(page, t, 4);
    expect(await writes(page, keys.menus)).toHaveLength(1);
    unchangedExcept(before, await snapshot(page), keys.menus);
    const confirmed = (await rawMenu(page))!;
    await assertReloadPreserved(page, confirmed);
    await page.getByTestId('menu-filters-open').click();
    await expect(page.getByTestId('menu-filter-preference-any')).toHaveAttribute('aria-checked', 'true');
    unchangedExcept(before, await snapshot(page), keys.menus);
    expect(await writes(page)).toEqual([]);
    expect(runtime).toEqual({ errors: [], externalRequests: [] });
  });

  test('C · edits a 14-meal budget journey to 1 meal/person and saves only reviewed shopping', async ({ page }, info) => {
    const t = await begin(page, language), runtime = observe(page), before = await snapshot(page);
    const originalShopping = JSON.parse(before[keys.shopping]!) as StoredShopping;
    await page.getByTestId('start-with-budget').click();
    await page.getByTestId('planning-budget-amount').fill('50');
    await page.getByTestId('planning-meals').fill('14');
    await page.getByTestId('planning-servings').fill('12');
    await capture(page, info, '06-budget-fourteen-twelve', [page.getByTestId('planning-budget-continue')]);
    await page.getByTestId('planning-budget-continue').click();
    await expect(page.getByTestId('planning-stores-picker')).toBeVisible();
    await page.getByTestId('planning-stores-continue').click();
    await expect(page.getByTestId('menu-meal-count')).toHaveText('14');
    await expect(page.getByTestId('menu-servings')).toHaveText('12');
    await propose(page);
    expect(await snapshot(page)).toEqual(before);
    expect(await writes(page)).toEqual([]);
    await confirmPlan(page);
    await expectMealLabels(page, t, 14);
    expect(await snapshot(page)).toEqual(before);
    expect(await writes(page)).toEqual([]);
    await capture(page, info, '07-budget-fourteen-plan', counters(page, t));
    await page.getByRole('button', { name: t('mealJourney.editPlanningBudget'), exact: true }).click();
    const form = page.getByTestId('planning-budget-screen');
    await expect(form.getByTestId('planning-meals')).toHaveValue('14');
    await expect(form.getByTestId('planning-servings')).toHaveValue('12');
    await form.getByTestId('planning-meals').fill('1');
    await form.getByTestId('planning-servings').fill('1');
    await form.getByTestId('planning-budget-amount').fill('55');
    await capture(page, info, '08-budget-one-one', [form.getByTestId('planning-budget-continue')]);
    await form.getByTestId('planning-budget-continue').click();
    await page.getByTestId('planning-stores-continue').click();
    await expect(page.getByTestId('menu-meal-count')).toHaveText('1');
    await expect(page.getByTestId('menu-servings')).toHaveText('1');
    // Editing the request never silently truncates the existing fourteen dishes.
    await expectMealLabels(page, t, 14);
    expect(await snapshot(page)).toEqual(before);
    await propose(page);
    expect(await writes(page)).toEqual([]);
    await confirmPlan(page);
    await expectMealLabels(page, t, 1);
    await capture(page, info, '09-budget-one-meal', counters(page, t));
    await page.getByTestId('review-menu').click();
    await expectReviewSource(page, t, 1, 1);
    const sheet = page.getByTestId('menu-sheet');
    await expect(sheet.getByTestId('ingredient-review-row')).toHaveCount(6);
    const rice = sheet.getByTestId('ingredient-review-row').filter({
      has: page.getByTestId('ingredient-name').filter({ hasText: new RegExp('^' + t('recipes.ingredient.rice') + '$') }),
    });
    // Independent culinary oracle: 160 g at 2 people is 80 g at 1 person.
    // It does not call the app's scaler, menu generator, importer or merger.
    await expect(rice).toHaveCount(1);
    await expect(rice).toContainText('80 g');
    await expect(sheet.getByRole('button', { name: t('menus.newListA11y'), exact: true })).toHaveAttribute('aria-pressed', 'true');
    const listName = 'QA B05.4 · ' + language + ' · 1 comida / 1 persona';
    await sheet.getByRole('textbox', { name: t('menus.newListName'), exact: true }).fill(listName);
    await capture(page, info, '10-budget-one-review', [sheet.getByTestId('confirm-ingredients')]);
    expect(await snapshot(page)).toEqual(before);
    expect(await writes(page)).toEqual([]);
    await sheet.getByTestId('confirm-ingredients').click();
    await expect(page.getByTestId('planning-result-screen')).toBeVisible();
    const after = await snapshot(page), shopping = JSON.parse(after[keys.shopping]!) as StoredShopping;
    const created = shopping.state.lists.find(list => list.id === shopping.state.activeListId)!;
    expect(created).toMatchObject({ name: listName, budgetCents: 5500 });
    expect(created.items.map(item => [item.name, item.quantityMilli, item.unit]).sort()).toEqual([
      ['Arroz', 80000, 'g'], ['Calabacín', 100000, 'g'], ['Zanahoria', 75000, 'g'],
      ['Cebolla', 50000, 'g'], ['Aceite de oliva', 10000, 'ml'], ['Agua', 200000, 'ml'],
    ].sort());
    expect(new Set(created.items.map(item => item.id)).size).toBe(6);
    expect(created.items.every(item => !item.checked && item.unitPriceCents === null && item.priceKind === null)).toBe(true);
    expect(shopping.state.lists).toHaveLength(2);
    expect(shopping.state.lists.find(list => list.id === originalShopping.state.activeListId)).toEqual(originalShopping.state.lists[0]);
    unchangedExcept(before, after, keys.shopping);
    expect(await writes(page, keys.menus)).toEqual([]);
    expect(await writes(page, keys.shopping)).toHaveLength(1);
    await capture(page, info, '11-budget-saved-result', [page.getByTestId('planning-open-list')]);
    await page.reload();
    await expect(page.getByTestId('open-profile')).toBeVisible();
    expect(await snapshot(page)).toEqual(after);
    expect(await writes(page)).toEqual([]);
    expect(runtime).toEqual({ errors: [], externalRequests: [] });
  });
});
