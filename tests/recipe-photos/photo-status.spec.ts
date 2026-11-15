/// <reference types="node" />
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { LEGACY_RECIPES } from '../../src/data/recipes';
import { V83_RECIPES } from '../../src/data/recipesV83';
import { createTranslator, unitLabel } from '../../src/i18n/core';
import { resources } from '../../src/i18n/resources';
import { localizedRecipe } from '../../src/i18n/recipes';
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
  { recipe: V83_RECIPES.find(recipe => recipe.id === 'JJ-E03-004')!, gramsAtTwo: '180', gramsAtFour: '360', minutes: 60, metaKey: 'catalogV83Ui.minutesPeople.other' },
];

async function snapshot(page: Page) {
  return page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), businessKeys);
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

  test('pending photo is readable without image requests or writes, in legacy and V83 details', async ({ page }, info) => {
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
    let imageRequests = 0;
    page.on('request', request => { if (request.resourceType() === 'image') imageRequests++; });
    const evidence: { recipeId: string; atTwo: Awaited<ReturnType<typeof statusGeometry>>; atFour: Awaited<ReturnType<typeof statusGeometry>> }[] = [];

    for (const entry of cases) {
      const { recipe } = entry;
      const translated = localizedRecipe(recipe, t);
      await page.getByTestId('menu-catalog-recipe-' + recipe.id).click();
      const sheet = page.getByTestId('menu-sheet');
      const status = sheet.getByTestId('recipe-photo-status');
      await expect(sheet.getByRole('heading', { name: translated.title, exact: true })).toBeVisible();
      await expect(status).toBeVisible();
      await expect(status).toHaveText(labels[language]);
      expect(await status.ariaSnapshot()).toContain(labels[language]);
      await expect(sheet.getByTestId('recipe-servings')).toHaveText('2');
      await expect(sheet.getByText(t(entry.metaKey, { minutes: entry.minutes, count: 2 }), { exact: true })).toBeVisible();
      await expect(sheet.getByRole('button', { name: t('menus.reviewRecipe'), exact: true })).toBeVisible();
      await expect(sheet.locator('img')).toHaveCount(0);
      const firstIngredient = sheet.getByText(translated.ingredients[0].name, { exact: true }).locator('..');
      await expect(firstIngredient).toContainText(entry.gramsAtTwo + ' ' + unitLabel('g', t));
      const atTwo = await statusGeometry(status);
      expect(atTwo.renderedRanges).toBeGreaterThan(0);
      expect(atTwo.violations).toEqual([]);
      expect(atTwo.horizontalOverflow).toBe(0);
      await capture(page, info, recipe.id + '-photo-pending');
      expect(await snapshot(page)).toEqual(before);

      await sheet.getByRole('button', { name: t('flow.increaseServings'), exact: true }).click();
      await sheet.getByRole('button', { name: t('flow.increaseServings'), exact: true }).click();
      await expect(sheet.getByTestId('recipe-servings')).toHaveText('4');
      await expect(firstIngredient).toContainText(entry.gramsAtFour + ' ' + unitLabel('g', t));
      await expect(sheet.getByText(t(entry.metaKey, { minutes: entry.minutes, count: 4 }), { exact: true })).toBeVisible();
      await expect(status).toHaveText(labels[language]);
      const atFour = await statusGeometry(status);
      expect(atFour.renderedRanges).toBeGreaterThan(0);
      expect(atFour.violations).toEqual([]);
      expect(atFour.horizontalOverflow).toBe(0);
      expect(await snapshot(page)).toEqual(before);
      await sheet.getByTestId('flow-back').click();
      await expect(sheet).toHaveCount(0);
      expect(await snapshot(page)).toEqual(before);
      evidence.push({ recipeId: recipe.id, atTwo, atFour });
    }
    expect(imageRequests).toBe(0);
    expect(errors).toEqual([]);
    const sourceCommit = process.env.JJ_PHOTO_SOURCE_SHA;
    if (sourceCommit) expect(sourceCommit).toMatch(/^[a-f0-9]{40}$/);
    await info.attach('b04-photo-status-evidence', {
      body: Buffer.from(JSON.stringify({
        sourceCommit: sourceCommit ?? null, language,
        browserProject: info.project.name, viewport: page.viewportSize(),
        physicalIPhone: false, nativeAppValidated: false,
        businessStateSeeded: false, businessDocumentsPreserved: 7,
        recipeImagesRendered: 0, imageRequestsDuringDetails: imageRequests,
        evidence,
      }, null, 2)),
      contentType: 'application/json',
    });
  });
});
