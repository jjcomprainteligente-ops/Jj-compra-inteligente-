/// <reference types="node" />
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { LEGACY_RECIPES } from '../../src/data/recipes';
import { V3_RECIPES } from '../../src/data/recipesV3';
import { createTranslator, unitLabel } from '../../src/i18n/core';
import { resources } from '../../src/i18n/resources';
import { localizedRecipe, translateIngredientName } from '../../src/i18n/recipes';
import { LANGUAGES, type Language } from '../../src/i18n/types';

const labels: Record<Language, string> = {
  es: 'Foto pendiente', en: 'Photo pending', de: 'Foto ausstehend', fr: 'Photo en attente',
};
const businessKeys = [
  'shopping.v1', 'menus.v1', 'comparisons.v1', 'price-observations.v1',
  'preferences.v1', 'expenses.v1', 'local-settings.v1',
].map(key => 'jjcompraintelwgiemt.' + key);
const preferenceKey = 'jjcompraintelwgiemt.preferences.v1';
// Independent quantities for the two selected source recipes. No menu scaler,
// photo registry or reception manifest supplies the browser's expected result.
const cases = [
  { recipe: LEGACY_RECIPES.find(recipe => recipe.id === 'arroz-verduras')!, gramsAtTwo: '160', gramsAtFour: '320', minutes: 25, metaKey: 'menus.recipePill.other' },
  { recipe: V3_RECIPES.find(recipe => recipe.id === 'JJ-E03-004')!, gramsAtTwo: '180', gramsAtFour: '360', minutes: 60, metaKey: 'catalogV83Ui.minutesPeople.other' },
];

async function snapshot(page: Page) {
  return page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), businessKeys);
}

async function begin(page: Page, language: Language) {
  await page.goto(process.env.JJ_PHOTO_SHARE_URL ?? '/');
  await expect(page.getByTestId('welcome-title')).toBeVisible();
  expect(Object.values(await snapshot(page))).toEqual(Array(businessKeys.length).fill(null));
  await page.getByTestId('welcome-language-toggle').click();
  await page.getByTestId('language-' + language).click();
  await page.getByTestId('start-app').click();
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  return createTranslator(language, resources);
}

async function loadedDetail(sheet: Locator, recipeId: string, alt: string) {
  const image = sheet.getByTestId('recipe-photo-image-detail-' + recipeId);
  await expect(image).toHaveAttribute('aria-label', alt);
  await expect.poll(() => image.locator('img').evaluateAll(images => images.length > 0 && images.every(value =>
    (value as HTMLImageElement).complete && (value as HTMLImageElement).naturalWidth === 960,
  ))).toBe(true);
  await expect(sheet.getByTestId('recipe-photo-fallback-detail-' + recipeId)).toHaveCount(0);
  return image;
}

/** Check the actual text ranges, including clipping ancestors, rather than only the box. */
async function statusGeometry(status: Locator) {
  return status.evaluate(element => {
    const viewportWidth = document.documentElement.clientWidth;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let textNode: Node | null;
    let renderedRanges = 0;
    const violations: string[] = [];
    while ((textNode = walker.nextNode())) {
      if (!textNode.textContent?.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(textNode);
      for (const rect of range.getClientRects()) {
        if (rect.width < 1 || rect.height < 1) continue;
        renderedRanges++;
        if (rect.left < -1 || rect.right > viewportWidth + 1) violations.push('outside viewport');
        let ancestor = textNode.parentElement;
        while (ancestor && ancestor !== document.body) {
          const style = getComputedStyle(ancestor), bounds = ancestor.getBoundingClientRect();
          if ((/hidden|clip/.test(style.overflowX) && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1)) ||
              (/hidden|clip/.test(style.overflowY) && (rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1))) {
            violations.push('clipped text');
          }
          if (/auto|scroll/.test(style.overflowY)) break;
          ancestor = ancestor.parentElement;
        }
      }
    }
    return {
      renderedRanges, violations,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - viewportWidth),
    };
  });
}

async function capture(page: Page, info: TestInfo, name: string) {
  await page.evaluate(() => document.fonts.ready);
  const filename = info.outputPath(name + '.png');
  await page.screenshot({ path: filename, fullPage: true });
  await info.attach(name, { path: filename, contentType: 'image/png' });
}

for (const language of ['es', 'en', 'de', 'fr'] as const) test.describe(language, () => {
  test.use({ locale: LANGUAGES[language].locale });

  test('legacy fallback and received V3 photo remain accessible while quantities and saved documents are preserved', async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    // The private share URL is used only to open staging. Never copy its value
    // into custom reports or attachments; evidence stays in the supplied directory.
    await page.goto(process.env.JJ_PHOTO_SHARE_URL ?? '/');
    await expect(page.getByTestId('welcome-title')).toBeVisible();
    expect(Object.values(await snapshot(page))).toEqual(Array(businessKeys.length).fill(null));
    await page.getByTestId('welcome-language-toggle').click();
    await page.getByTestId('language-' + language).click();
    await page.getByTestId('start-app').click();
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await page.getByTestId('tab-menus').click();
    await page.getByTestId('menus-section-discover').click();
    await expect(page.getByTestId('menu-catalog-recipe-JJ-E03-004')).toBeVisible();
    const before = await snapshot(page);
    expect(JSON.parse(before[preferenceKey]!)).toMatchObject({ version: 1, language, welcomeCompleted: true });
    for (const key of businessKeys.filter(key => key !== preferenceKey)) expect(before[key]).toBeNull();
    const t = createTranslator(language, resources);
    const imagePaths: string[] = [];
    page.on('request', request => { if (request.resourceType() === 'image') imagePaths.push(new URL(request.url()).pathname); });
    const evidence: { recipeId: string; atTwo: Awaited<ReturnType<typeof statusGeometry>>; atFour: Awaited<ReturnType<typeof statusGeometry>> }[] = [];

    for (const entry of cases) {
      const { recipe } = entry;
      const translated = localizedRecipe(recipe, t);
      await page.getByTestId('menu-catalog-recipe-' + recipe.id).click();
      const sheet = page.getByTestId('menu-sheet');
      const hasPhoto = recipe.id.startsWith('JJ-');
      const status = hasPhoto ? sheet.getByTestId('recipe-photo-detail-' + recipe.id) : sheet.getByTestId('recipe-photo-status');
      await expect(sheet.getByRole('heading', { name: translated.title, exact: true })).toBeVisible();
      await expect(status).toBeVisible();
      if (hasPhoto) {
        await loadedDetail(sheet, recipe.id, t('recipePhotos.imageAlt', { title: translated.title }));
        await expect(sheet.getByTestId('recipe-photo-status')).toHaveCount(0);
        const geometry = await status.evaluate(element => {
          const box = element.getBoundingClientRect();
          return { width: box.width, height: box.height, left: box.left, right: box.right, viewport: document.documentElement.clientWidth };
        });
        expect(geometry.width).toBeGreaterThan(100);
        expect(geometry.height).toBeGreaterThan(100);
        expect(geometry.left).toBeGreaterThanOrEqual(-1);
        expect(geometry.right).toBeLessThanOrEqual(geometry.viewport + 1);
      } else {
        await expect(status).toHaveText(labels[language]);
        expect(await status.ariaSnapshot()).toContain(labels[language]);
        await expect(sheet.locator('img')).toHaveCount(0);
      }
      await expect(sheet.getByTestId('recipe-servings')).toHaveText('2');
      await expect(sheet.getByText(t(entry.metaKey, { minutes: entry.minutes, count: 2 }), { exact: true })).toBeVisible();
      await expect(sheet.getByRole('button', { name: t('menus.reviewRecipe'), exact: true })).toBeVisible();
      const firstIngredient = sheet.getByText(translated.ingredients[0].name, { exact: true }).locator('..');
      await expect(firstIngredient).toContainText(entry.gramsAtTwo + ' ' + unitLabel('g', t));
      const atTwo = await statusGeometry(status);
      if (!hasPhoto) expect(atTwo.renderedRanges).toBeGreaterThan(0);
      expect(atTwo.violations).toEqual([]);
      expect(atTwo.horizontalOverflow).toBe(0);
      await capture(page, info, recipe.id + (hasPhoto ? '-photo-received' : '-photo-pending'));
      expect(await snapshot(page)).toEqual(before);

      await sheet.getByRole('button', { name: t('flow.increaseServings'), exact: true }).click();
      await sheet.getByRole('button', { name: t('flow.increaseServings'), exact: true }).click();
      await expect(sheet.getByTestId('recipe-servings')).toHaveText('4');
      await expect(firstIngredient).toContainText(entry.gramsAtFour + ' ' + unitLabel('g', t));
      await expect(sheet.getByText(t(entry.metaKey, { minutes: entry.minutes, count: 4 }), { exact: true })).toBeVisible();
      if (!hasPhoto) await expect(status).toHaveText(labels[language]);
      else await expect(sheet.getByTestId('recipe-photo-image-detail-' + recipe.id)).toHaveAttribute('aria-label', t('recipePhotos.imageAlt', { title: translated.title }));
      const atFour = await statusGeometry(status);
      if (!hasPhoto) expect(atFour.renderedRanges).toBeGreaterThan(0);
      expect(atFour.violations).toEqual([]);
      expect(atFour.horizontalOverflow).toBe(0);
      expect(await snapshot(page)).toEqual(before);
      await sheet.getByTestId('flow-back').click();
      await expect(sheet).toHaveCount(0);
      expect(await snapshot(page)).toEqual(before);
      evidence.push({ recipeId: recipe.id, atTwo, atFour });
    }
    expect(imagePaths.filter(path => /\/details\//.test(path)).length).toBeGreaterThan(0);
    expect(imagePaths.filter(path => /\/details\//.test(path)).every(path => /JJ-E03-004/.test(path))).toBe(true);
    expect(errors).toEqual([]);
    const sourceCommit = process.env.JJ_PHOTO_SOURCE_SHA;
    if (sourceCommit) expect(sourceCommit).toMatch(/^[a-f0-9]{40}$/);
    await info.attach('b04-photo-status-evidence', {
      body: Buffer.from(JSON.stringify({
        sourceCommit: sourceCommit ?? null, language,
        browserProject: info.project.name, viewport: page.viewportSize(),
        physicalIPhone: false, nativeAppValidated: false,
        businessStateSeeded: false, businessDocumentsPreserved: 7,
        receivedRecipeImagesRendered: 1, legacyImagesRendered: 0, imageRequestsDuringDetails: imagePaths.length,
        evidence,
      }, null, 2)),
      contentType: 'application/json',
    });
  });

  test('failed thumbnail and detail preserve documents, retry on reopen and do not contaminate another recipe', async ({ page }, info) => {
    const t = await begin(page, language);
    const recipe = V3_RECIPES.find(value => value.id === 'JJ-E03-004')!;
    const other = V3_RECIPES.find(value => value.id === 'JJ-E03-001')!;
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const blocked: string[] = [];
    const blockPhoto = async (route: import('@playwright/test').Route) => {
      const url = new URL(route.request().url());
      if (/\/recipes-v3\/(?:thumbnails|details)\/JJ-E03-004(?:\.[a-f0-9]+)?\.jpg$/.test(url.pathname)) {
        blocked.push(url.pathname);
        await route.abort('failed');
      } else await route.continue();
    };
    await page.route('**/*', blockPhoto);
    await page.getByTestId('tab-menus').click();
    await page.getByTestId('menus-section-discover').click();
    const before = await snapshot(page);
    const row = page.getByTestId('menu-catalog-recipe-' + recipe.id);
    await row.scrollIntoViewIfNeeded();
    const thumbnailFallback = row.getByTestId('recipe-photo-fallback-thumbnail-' + recipe.id);
    await expect(thumbnailFallback).toBeVisible();
    expect(await thumbnailFallback.ariaSnapshot()).toContain(t('recipePhotos.unavailable'));
    expect(await snapshot(page)).toEqual(before);
    await row.click();
    const sheet = page.getByTestId('menu-sheet');
    const fallback = sheet.getByTestId('recipe-photo-fallback-detail-' + recipe.id);
    await expect(fallback).toBeVisible();
    await expect(fallback).toContainText(t('recipePhotos.unavailable'));
    await expect(sheet.getByRole('heading', { name: localizedRecipe(recipe, t).title, exact: true })).toBeVisible();
    await expect(sheet.getByRole('button', { name: t('menus.reviewRecipe'), exact: true })).toBeVisible();
    await expect(sheet.getByTestId('recipe-servings')).toHaveText('2');
    expect((await statusGeometry(fallback)).violations).toEqual([]);
    expect(await snapshot(page)).toEqual(before);
    await capture(page, info, 'received-photo-load-fallback');
    await sheet.getByTestId('flow-back').click();
    await expect(sheet).toHaveCount(0);
    await page.unroute('**/*', blockPhoto);

    // Reopening creates a new image attempt. An error is neither a persisted
    // recipe state nor a reason to remove ingredients or change the menu.
    await row.click();
    await loadedDetail(sheet, recipe.id, t('recipePhotos.imageAlt', { title: localizedRecipe(recipe, t).title }));
    expect(await snapshot(page)).toEqual(before);
    await sheet.getByTestId('flow-back').click();
    await page.getByTestId('menu-catalog-recipe-' + other.id).click();
    await loadedDetail(sheet, other.id, t('recipePhotos.imageAlt', { title: localizedRecipe(other, t).title }));
    await expect(sheet.getByTestId('recipe-photo-fallback-detail-' + recipe.id)).toHaveCount(0);
    await sheet.getByTestId('flow-back').click();
    expect(await snapshot(page)).toEqual(before);
    expect(blocked.some(path => path.includes('/thumbnails/'))).toBe(true);
    expect(blocked.some(path => path.includes('/details/'))).toBe(true);
    expect(errors).toEqual([]);
  });

  test('newly active recipe keeps its ID after reload and transfers only reviewed quantities into an existing budgeted list', async ({ page }, info) => {
    const t = await begin(page, language);
    // Independent oracle from the supplied Pasta alla Norma source at four
    // servings. No recipe scaler or importer computes these expected amounts.
    const amounts: [number, string][] = [
      [360000, 'g'], [500000, 'g'], [500000, 'g'], [2000, 'ud'],
      [50000, 'ml'], [80000, 'g'], [12000, 'g'],
    ];
    const recipeId = 'JJ-E03-011';
    const recipe = V3_RECIPES.find(value => value.id === recipeId)!;
    const translated = localizedRecipe(recipe, t);
    const listName = 'QA V3 preserved list';
    const manualName = 'QA preserved item';
    const shoppingKey = 'jjcompraintelwgiemt.shopping.v1';
    const menuKey = 'jjcompraintelwgiemt.menus.v1';
    type Item = { id: string; name: string; quantityMilli: number; unit: string; checked: boolean; unitPriceCents: number | null; priceKind: string | null };
    type List = { id: string; name: string; budgetCents: number | null; items: Item[] };
    const active = async (): Promise<List> => {
      const raw = (await snapshot(page))[shoppingKey]; expect(raw).not.toBeNull();
      const saved = JSON.parse(raw!) as { state: { activeListId: string; lists: List[] } };
      const list = saved.state.lists.find(value => value.id === saved.state.activeListId);
      expect(list).toBeDefined(); return list!;
    };
    await page.getByTestId('create-list').click();
    let sheet = page.getByTestId('app-sheet');
    await sheet.getByRole('textbox', { name: t('app.fieldListName'), exact: true }).fill(listName);
    await sheet.getByTestId('save-list').click();
    await page.getByTestId('tab-list').click();
    await page.getByTestId('edit-budget').click();
    await sheet.getByRole('textbox', { name: t('app.fieldBudget'), exact: true }).fill('40');
    await sheet.getByTestId('save-budget').click();
    await page.getByTestId('add-item').click();
    await sheet.getByRole('textbox', { name: t('app.fieldItemName'), exact: true }).fill(manualName);
    await sheet.getByRole('textbox', { name: t('app.fieldQuantity'), exact: true }).fill('2');
    await sheet.getByRole('button', { name: t('app.unitA11y', { unit: unitLabel('ud', t) }), exact: true }).click();
    await sheet.getByTestId('save-item').click();
    // Capture the durable result only after the save finishes and its panel
    // closes; a click alone does not wait for the asynchronous write fence.
    await expect(sheet).toHaveCount(0);
    await expect(page.getByText(manualName, { exact: true })).toBeVisible();
    const savedBefore = await active();
    expect(savedBefore).toMatchObject({ name: listName, budgetCents: 4000, items: [{ name: manualName, quantityMilli: 2000, unit: 'ud' }] });
    const manualItem = savedBefore.items[0];
    await page.getByTestId('tab-menus').click();
    await page.getByTestId('menus-section-week').click();
    await page.getByTestId('prepare-menu').click();
    await expect(page.getByTestId('review-menu')).toBeVisible();
    await page.getByRole('button', { name: t('variableMenus.changeMealA11y', { meal: t('variableMenus.mealIndex', { count: '1' }) }), exact: true }).click();
    sheet = page.getByTestId('menu-sheet');
    await sheet.getByRole('button', { name: translated.title, exact: true }).click();
    await expect(sheet).toHaveCount(0);
    const savedMenu = JSON.parse((await snapshot(page))[menuKey]!);
    expect(savedMenu).toMatchObject({ version: 1, plan: { servings: 2 } });
    expect(savedMenu.plan.recipeIds).toEqual([recipeId, 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate']);
    const beforeReload = await snapshot(page);
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByTestId('open-profile')).toBeVisible();
    expect(await snapshot(page)).toEqual(beforeReload);
    await page.getByTestId('tab-menus').click();
    await page.getByTestId('menus-section-week').click();
    await page.getByRole('button', { name: t('menus.recipeA11y', { title: translated.title }), exact: true }).click();
    sheet = page.getByTestId('menu-sheet');
    await loadedDetail(sheet, recipeId, t('recipePhotos.imageAlt', { title: translated.title }));
    const beforeReview = await snapshot(page);
    await sheet.getByRole('button', { name: t('flow.increaseServings'), exact: true }).click();
    await sheet.getByRole('button', { name: t('flow.increaseServings'), exact: true }).click();
    await expect(sheet.getByTestId('recipe-servings')).toHaveText('4');
    const pasta = sheet.getByText(translated.ingredients[0].name, { exact: true }).locator('..');
    await expect(pasta).toContainText('360 ' + unitLabel('g', t));
    await sheet.getByRole('button', { name: t('menus.reviewRecipe'), exact: true }).click();
    const rows = sheet.getByTestId('ingredient-review-row');
    await expect(rows).toHaveCount(7);
    expect(await snapshot(page)).toEqual(beforeReview);
    const displayed = (await sheet.getByTestId('ingredient-name').allTextContents()).map(value => value.trim());
    // Review rows retain the pre-existing global translation priority for
    // canonical shopping labels. A detail's contextual wording may differ
    // (for example "garlic (cloves)" versus the historical "garlic (clove)").
    expect(displayed).toEqual(recipe.ingredients.map(value => translateIngredientName(value.name, t)));
    for (let index = 0; index < amounts.length; index++) {
      const row = rows.nth(index);
      await expect(row.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
      await row.getByTestId('edit-ingredient').click();
      const quantity = (await row.locator('input[inputmode="decimal"]').inputValue()).replace(',', '.');
      expect(Number(quantity) * 1000).toBe(amounts[index][0]);
      await expect(row.getByRole('button', { name: t('menus.ingredientUnitA11y', {
        unit: unitLabel(amounts[index][1], t), index: String(index + 1),
      }), exact: true })).toHaveAttribute('aria-pressed', 'true');
      await row.getByTestId('edit-ingredient').click();
    }
    await capture(page, info, 'new-recipe-reviewed-before-single-write');
    await sheet.getByTestId('confirm-ingredients').click();
    await expect(sheet).toHaveCount(0);
    const after = await active();
    expect(after.budgetCents).toBe(4000);
    expect(after.items.find(value => value.id === manualItem.id)).toEqual(manualItem);
    const added = after.items.filter(value => value.id !== manualItem.id);
    expect(added.map(value => [value.name, value.quantityMilli, value.unit]).sort()).toEqual(recipe.ingredients.map((value, index) => [value.name, amounts[index][0], amounts[index][1]]).sort());
    expect(added.every(value => !value.checked && value.unitPriceCents === null && value.priceKind === null)).toBe(true);
    const afterWrite = await snapshot(page);
    for (const key of businessKeys.filter(key => key !== shoppingKey)) expect(afterWrite[key], key).toBe(beforeReview[key]);
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByTestId('open-profile')).toBeVisible();
    expect(await snapshot(page)).toEqual(afterWrite);
    expect(await active()).toEqual(after);
  });
});
