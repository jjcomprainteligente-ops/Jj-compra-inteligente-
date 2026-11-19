/// <reference types="node" />
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs/promises';
import { RECIPES } from '../../src/data/recipes';
import { V83_RECIPES } from '../../src/data/recipesV83';
import { createTranslator, unitLabel } from '../../src/i18n/core';
import { resources } from '../../src/i18n/resources';
import { localizedRecipe, translateIngredientName } from '../../src/i18n/recipes';
import { LANGUAGES, type Language, type Translator } from '../../src/i18n/types';

// Business state is created only through the UI in empty browser contexts.
// Linux WebKit at mobile CSS sizes does not certify Safari or a physical iPhone.
const languages: Language[] = ['es', 'en', 'de', 'fr'];
const prefix = 'jjcompraintelwgiemt.';
const keys = {
  preferences: prefix + 'preferences.v1', shopping: prefix + 'shopping.v1', menus: prefix + 'menus.v1',
  expenses: prefix + 'expenses.v1', comparisons: prefix + 'comparisons.v1',
  observations: prefix + 'price-observations.v1', settings: prefix + 'local-settings.v1',
};
const storageKeys = Object.values(keys);
const translationPrefixes = [...new Set(Object.values(resources).flatMap(catalog => Object.keys(catalog).map(key => key.split('.')[0])))];
const manualName = 'QA V83 café — ñ / Ä / été';
const manualNote = 'QA_V83_PRIVATE_NOTE_ñÄété';

interface Item { id: string; name: string; quantityMilli: number; unit: string; unitPriceCents: number | null; priceKind: string | null; checked: boolean; note: string }
interface List { id: string; name: string; budgetCents: number | null; items: Item[] }
interface Shopping { version: number; state: { activeListId: string | null; lists: List[] } }
interface SavedMenu { version: number; plan: { servings: number; recipeIds: string[] } | null }

async function snapshot(page: Page): Promise<Record<string, string | null>> {
  return page.evaluate(names => Object.fromEntries(names.map(name => [name, localStorage.getItem(name)])), storageKeys);
}
async function value<T>(page: Page, key: string): Promise<T> {
  const text = await page.evaluate(name => localStorage.getItem(name), key);
  expect(text).not.toBeNull(); return JSON.parse(text!) as T;
}
async function activeList(page: Page): Promise<List> {
  const data = await value<Shopping>(page, keys.shopping);
  const selected = data.state.lists.find(list => list.id === data.state.activeListId);
  expect(selected).toBeDefined(); return selected!;
}
function decimal(language: Language, text: string) { return language === 'en' ? text : text.replace('.', ','); }

// Read the quantity a person actually reviewed. No domain parser, scaling or
// combination function is reused to manufacture the expected saved quantity.
function milli(text: string): number {
  const normalized = text.trim().replace(',', '.');
  expect(normalized).toMatch(/^\d+(?:\.\d{1,3})?$/);
  const [whole, fractional = ''] = normalized.split('.');
  return Number(whole) * 1000 + Number(fractional.padEnd(3, '0'));
}
async function reviewedRows(sheet: Locator, t: Translator): Promise<[string, number, string][]> {
  const rows = sheet.getByTestId('ingredient-review-row');
  const result: [string, number, string][] = [];
  for (let index = 0; index < await rows.count(); index++) {
    const row = rows.nth(index);
    if (await row.getByRole('checkbox').getAttribute('aria-checked') !== 'true') continue;
    const name = (await row.getByTestId('ingredient-name').innerText()).trim();
    await row.getByTestId('edit-ingredient').click();
    const quantity = milli(await row.locator('input[inputmode="decimal"]').inputValue());
    const pressedLabels = (await row.getByRole('button', { pressed: true }).allTextContents()).map(label => label.trim());
    const units = (['ud', 'g', 'kg', 'ml', 'L'] as const).filter(unit => pressedLabels.includes(unitLabel(unit, t)));
    expect(units).toHaveLength(1);
    result.push([name, quantity, units[0]]);
    await row.getByTestId('edit-ingredient').click();
  }
  expect(result.length).toBeGreaterThan(0);
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
    return { horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - width), outside: [...new Set(outside)], clipped: [...new Set(clipped)], rawKeys };
  }, translationPrefixes);
  expect(health, `${scene}: text geometry and translated labels`).toEqual({ horizontalOverflow: 0, outside: [], clipped: [], rawKeys: [] });
  const filename = info.outputPath(`${language}-v83-${scene}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  await info.attach(scene, { path: filename, contentType: 'image/png' });
  return { scene, health, filename };
}

for (const language of languages) test.describe(language, () => {
  test.use({ locale: LANGUAGES[language].locale });

  test('V83 catalogue, original measures, reviewed transfer and persisted recipe ID', async ({ page, browser }, info) => {
    expect(browser.browserType().name()).toBe('webkit');
    const t = createTranslator(language, resources), format = new Intl.NumberFormat(LANGUAGES[language].locale);
    const origin = new URL(String(info.project.use.baseURL)).origin;
    const runtimeErrors: string[] = [], externalOrigins: string[] = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
    page.on('request', request => {
      if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== origin) externalOrigins.push(new URL(request.url()).origin);
    });
    const captures: Awaited<ReturnType<typeof capture>>[] = [];
    info.annotations.push({ type: 'execution-scope', description: 'UI-created state; Linux WebKit mobile CSS; no physical iPhone, OS keyboard, safe-area or VoiceOver certification.' });

    await page.goto('/');
    await expect(page.getByTestId('welcome-title')).toBeVisible();
    expect(Object.values(await snapshot(page))).toEqual(Array(storageKeys.length).fill(null));
    await page.getByTestId('welcome-language-toggle').click();
    await page.getByTestId('language-' + language).click();
    await page.getByTestId('start-app').click();
    await expect(page.locator('html')).toHaveAttribute('lang', language);

    await page.getByTestId('create-list').click();
    let sheet = page.getByTestId('app-sheet');
    await sheet.getByRole('textbox', { name: t('app.fieldListName'), exact: true }).fill('QA V83 — ñ / Ä / été');
    await sheet.getByTestId('save-list').click(); await expect(sheet).toHaveCount(0);
    await page.getByTestId('tab-list').click(); await page.getByTestId('edit-budget').click();
    sheet = page.getByTestId('app-sheet');
    await sheet.getByRole('textbox', { name: t('app.fieldBudget'), exact: true }).fill(decimal(language, '40.00'));
    await sheet.getByTestId('save-budget').click(); await expect(sheet).toHaveCount(0);
    await page.getByTestId('add-item').click(); sheet = page.getByTestId('app-sheet');
    await sheet.getByRole('textbox', { name: t('app.fieldItemName'), exact: true }).fill(manualName);
    await sheet.getByRole('textbox', { name: t('app.fieldQuantity'), exact: true }).fill('2');
    await sheet.getByRole('button', { name: t('app.unitA11y', { unit: unitLabel('ud', t) }), exact: true }).click();
    await sheet.getByRole('textbox', { name: t('app.fieldPrice'), exact: true }).fill(decimal(language, '1.25'));
    await sheet.getByRole('button', { name: t('app.enteredPrice'), exact: true }).click();
    await sheet.getByRole('textbox', { name: t('app.fieldNote'), exact: true }).fill(manualNote);
    await sheet.getByTestId('save-item').click(); await expect(sheet).toHaveCount(0);
    const manualList = await activeList(page), manualItem = manualList.items[0];
    expect(manualList).toMatchObject({ budgetCents: 4000, items: [{ name: manualName, quantityMilli: 2000, unit: 'ud', unitPriceCents: 125, note: manualNote }] });
    const beforeBrowse = await snapshot(page);

    await page.getByTestId('tab-menus').click();
    await page.getByTestId('menus-section-discover').click();
    const cards = page.getByTestId(/^menu-catalog-recipe-/);
    await expect(cards).toHaveCount(20);
    await expect(page.getByTestId('menu-catalog-count')).toHaveText(t('menuFilters.count', { count: format.format(RECIPES.length), total: format.format(RECIPES.length) }));
    captures.push(await capture(page, info, language, '01-catalogue-first-page'));
    let cataloguePages = 1;
    while (await page.getByTestId('show-more-recipes').count()) {
      expect(cataloguePages).toBeLessThan(12);
      const previous = await cards.count();
      await page.getByTestId('show-more-recipes').click();
      await expect(cards).toHaveCount(Math.min(previous + 20, RECIPES.length));
      cataloguePages++;
    }
    await expect(cards).toHaveCount(RECIPES.length);
    const lastRecipe = V83_RECIPES[V83_RECIPES.length - 1];
    await expect(page.getByTestId('menu-catalog-recipe-' + lastRecipe.id)).toContainText(localizedRecipe(lastRecipe, t).title);
    expect(await snapshot(page)).toEqual(beforeBrowse);

    const unknown = V83_RECIPES.find(recipe => recipe.minutes === null); expect(unknown).toBeDefined();
    await page.getByTestId('menu-catalog-recipe-' + unknown!.id).click(); sheet = page.getByTestId('menu-sheet');
    await expect(sheet).toContainText(t('catalogV83Ui.unknownTimePeople.other', { count: format.format(2) }));
    await expect(sheet.getByTestId('recipe-time-scope')).toHaveText(t('catalogV83Ui.timeScope'));
    const unknownView = localizedRecipe(unknown!, t);
    await expect(sheet).toContainText(unknownView.allergenNote);
    for (const step of unknownView.steps) await expect(sheet).toContainText(step);
    expect(await sheet.innerText()).not.toMatch(/\bnull\b|\b0\s*(?:min|Min\.)\b/);
    captures.push(await capture(page, info, language, '02-time-not-provided'));
    await sheet.getByTestId('flow-back').click(); await expect(sheet).toHaveCount(0);

    // The unit labels identify garlic cloves rather than silently buying a
    // count of whole garlic bulbs. Other sub-units are tested in the data suite.
    const cloves = V83_RECIPES.find(recipe => recipe.ingredients.some(ingredient => ingredient.unit === 'ud' && /\(diente\)/.test(ingredient.name)));
    expect(cloves).toBeDefined();
    await page.getByTestId('menu-catalog-recipe-' + cloves!.id).click(); sheet = page.getByTestId('menu-sheet');
    const cloveIndex = cloves!.ingredients.findIndex(ingredient => ingredient.unit === 'ud' && /\(diente\)/.test(ingredient.name));
    const cloveName = localizedRecipe(cloves!, t).ingredients[cloveIndex].name;
    await expect(sheet.getByText(cloveName, { exact: true })).toBeVisible();
    await expect(sheet.getByText(cloveName, { exact: true }).locator('..')).toContainText(unitLabel('ud', t));
    await sheet.getByTestId('flow-back').click(); await expect(sheet).toHaveCount(0);

    const sourceRecipe = V83_RECIPES.find(recipe => recipe.id === 'JJ-E03-004'); expect(sourceRecipe).toBeDefined();
    const sourceView = localizedRecipe(sourceRecipe!, t);
    expect(sourceView.unmeasuredIngredients).toHaveLength(1);
    const openForFour = async () => {
      await page.getByTestId('menu-catalog-recipe-' + sourceRecipe!.id).click();
      const detail = page.getByTestId('menu-sheet');
      await expect(detail.getByTestId('recipe-servings')).toHaveText(format.format(2));
      await detail.getByRole('button', { name: t('flow.increaseServings'), exact: true }).click();
      await detail.getByRole('button', { name: t('flow.increaseServings'), exact: true }).click();
      await expect(detail.getByTestId('recipe-servings')).toHaveText(format.format(4));
      return detail;
    };
    sheet = await openForFour();
    const unmeasured = sheet.getByTestId('recipe-unmeasured-ingredient');
    await expect(unmeasured).toHaveCount(1);
    await expect(unmeasured).toContainText(sourceView.unmeasuredIngredients![0].name);
    await expect(unmeasured).toContainText(t('catalogV83Ui.toTaste'));
    for (const step of sourceView.steps) await expect(sheet).toContainText(step);
    await expect(sheet).toContainText(sourceView.allergenNote);
    captures.push(await capture(page, info, language, '03-original-unmeasured-ingredient'));
    const beforeReview = await snapshot(page);
    await sheet.getByRole('button', { name: t('menus.reviewRecipe'), exact: true }).click();
    await expect(sheet.getByTestId('confirm-ingredients')).toBeVisible();
    expect(await snapshot(page)).toEqual(beforeReview);
    const names = await sheet.getByTestId('ingredient-name').allTextContents();
    expect(names.map(name => name.trim())).not.toContain(sourceView.unmeasuredIngredients![0].name);
    await sheet.getByRole('button', { name: t('menus.cancelProposal'), exact: true }).click();
    await sheet.getByRole('button', { name: t('menus.cancelWithoutAdd'), exact: true }).click();
    await expect(sheet).toHaveCount(0); expect(await snapshot(page)).toEqual(beforeReview);
    sheet = await openForFour();
    await sheet.getByRole('button', { name: t('menus.reviewRecipe'), exact: true }).click();
    const reviewed = await reviewedRows(sheet, t);
    captures.push(await capture(page, info, language, '04-measured-ingredients-review'));
    await sheet.getByTestId('confirm-ingredients').click(); await expect(sheet).toHaveCount(0);
    const imported = await activeList(page);
    expect(imported.budgetCents).toBe(4000);
    expect(imported.items.find(item => item.id === manualItem.id)).toEqual(manualItem);
    const added = imported.items.filter(item => item.id !== manualItem.id);
    expect(added.map(item => [translateIngredientName(item.name, t), item.quantityMilli, item.unit]).sort()).toEqual([...reviewed].sort());
    expect(added.every(item => item.unitPriceCents === null && item.priceKind === null && !item.checked)).toBe(true);
    expect(added.map(item => item.name)).not.toContain(sourceRecipe!.unmeasuredIngredients![0].name);
    const afterImport = await snapshot(page);
    for (const key of storageKeys.filter(key => key !== keys.shopping)) expect(afterImport[key]).toBe(beforeReview[key]);

    await page.getByTestId('tab-menus').click();
    await page.getByTestId('menus-section-week').click();
    await page.getByTestId('prepare-menu').click(); await expect(page.getByTestId('review-menu')).toBeVisible();
    const beforeReplacement = await snapshot(page);
    await page.getByRole('button', { name: t('menus.changeMealA11y', { day: t('menus.day.monday') }), exact: true }).click();
    sheet = page.getByTestId('menu-sheet');
    let replacementPages = 1;
    while (await sheet.getByTestId('show-more-replacement-recipes').count()) {
      expect(replacementPages).toBeLessThan(12);
      const previous = await sheet.getByRole('button').count();
      await sheet.getByTestId('show-more-replacement-recipes').click();
      // The final page removes the "more" button, but adds at least two dishes.
      await expect.poll(() => sheet.getByRole('button').count()).toBeGreaterThan(previous);
      replacementPages++;
    }
    await sheet.getByRole('button', { name: localizedRecipe(lastRecipe, t).title, exact: true }).click();
    await expect(sheet).toHaveCount(0);
    const savedMenu = await value<SavedMenu>(page, keys.menus);
    expect(savedMenu.plan?.recipeIds[0]).toBe(lastRecipe.id);
    expect(savedMenu.plan?.recipeIds).toHaveLength(5);
    const afterReplacement = await snapshot(page);
    for (const key of storageKeys.filter(key => key !== keys.menus)) expect(afterReplacement[key]).toBe(beforeReplacement[key]);
    expect(await activeList(page)).toEqual(imported);
    await page.reload(); await expect(page.getByTestId('welcome-title')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    expect(await snapshot(page)).toEqual(afterReplacement);
    await page.getByTestId('tab-menus').click();
    const savedRecipeButton = page.getByRole('button', { name: t('menus.recipeA11y', { title: localizedRecipe(lastRecipe, t).title }), exact: true });
    await expect(savedRecipeButton).toBeVisible();
    captures.push(await capture(page, info, language, '05-persisted-owner-recipe-plan'));
    await savedRecipeButton.click(); sheet = page.getByTestId('menu-sheet');
    await expect(sheet).toContainText(localizedRecipe(lastRecipe, t).title);
    await expect(sheet).toContainText(localizedRecipe(lastRecipe, t).allergenNote);
    expect(runtimeErrors).toEqual([]); expect(externalOrigins).toEqual([]);

    const report = { language, engine: browser.browserType().name(), engineVersion: browser.version(), viewport: page.viewportSize(),
      physicalIPhone: false, nativeInstallationValidated: false, dataSetup: 'all business writes through UI in an empty browser context',
      catalogue: { available: RECIPES.length, imported: V83_RECIPES.length, cataloguePages, replacementPages, lastRecipeId: lastRecipe.id },
      unknownTimeRecipeId: unknown!.id, originalUnmeasuredRecipeId: sourceRecipe!.id, unmeasuredAutomaticallyInserted: false,
      sourceSubunitPreserved: true, reviewedIngredients: reviewed, budgetCentsPreserved: 4000, manualItemAndPrivateNotePreserved: true,
      sixOtherDocumentsPreservedOnImport: true, sixOtherDocumentsPreservedOnRecipeReplacement: true, allSevenDocumentsPreservedAfterReload: true,
      geometryScope: 'rendered text nodes only; native keyboard, editable input contents, SVG geometry and physical safe areas not certified',
      runtimeErrors, externalOrigins, captures };
    const filename = info.outputPath(`${language}-v83-journey.json`);
    await fs.writeFile(filename, JSON.stringify(report, null, 2) + '\n');
    await info.attach('v83-journey-report', { path: filename, contentType: 'application/json' });
  });
});
