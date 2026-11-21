/// <reference types="node" />
import { expect, test, type Page } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { RECIPES } from '../../src/data/recipes';
import { V3_RECIPES } from '../../src/data/recipesV3';
import { createTranslator } from '../../src/i18n/core';
import { resources } from '../../src/i18n/resources';
import { localizedRecipe } from '../../src/i18n/recipes';
import { LANGUAGES, type Language } from '../../src/i18n/types';

interface DerivedPhoto {
  path: string;
  sha256: string;
  bytes: number;
  width: number;
  height: number;
}
interface PhotoManifest {
  photos: { recipeId: string; thumbnail: DerivedPhoto; detail: DerivedPhoto }[];
}
const manifest = JSON.parse(readFileSync(path.join(
  __dirname, '../../referencias/recetas-v3/manifest-assets.json',
), 'utf8')) as PhotoManifest;
const expectedPhotos = new Map(manifest.photos.map(value => [value.recipeId, value]));
const businessKeys = [
  'shopping.v1', 'menus.v1', 'comparisons.v1', 'price-observations.v1',
  'preferences.v1', 'expenses.v1', 'local-settings.v1',
].map(key => 'jjcompraintelwgiemt.' + key);

async function snapshot(page: Page) {
  return page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), businessKeys);
}
function digest(bytes: Buffer): string { return createHash('sha256').update(bytes).digest('hex'); }
const imageKind = (url: string) => new URL(url).pathname.match(/\/recipes-v3\/(thumbnails|details)\/([^/]+)\.jpg$/);

for (const language of ['es', 'en', 'de', 'fr'] as const) test.describe(language, () => {
  test.use({ locale: LANGUAGES[language].locale });

  test('all 150 received recipes render their exact local image and translated alt while paging and browsing preserve saved documents', async ({ page }, info) => {
    // This exhaustive case opens 150 independent details. It deliberately has
    // a bounded budget larger than the focused two-recipe responsive cases.
    test.setTimeout(180_000);
    expect(info.project.name).toBe('chromium-desktop');
    expect(manifest.photos).toHaveLength(150);
    expect(expectedPhotos.size).toBe(150);
    expect(V3_RECIPES).toHaveLength(150);
    expect(RECIPES).toHaveLength(157);
    const errors: string[] = [], externalImages: string[] = [], photoPaths = new Set<string>();
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      const kind = imageKind(request.url());
      if (!kind) return;
      const url = new URL(request.url());
      photoPaths.add(url.pathname);
      if (new URL(page.url()).origin !== url.origin) externalImages.push(url.origin);
    });
    await page.goto(process.env.JJ_PHOTO_SHARE_URL ?? '/');
    await expect(page.getByTestId('welcome-title')).toBeVisible();
    expect(Object.values(await snapshot(page))).toEqual(Array(businessKeys.length).fill(null));
    await page.getByTestId('welcome-language-toggle').click();
    await page.getByTestId('language-' + language).click();
    await page.getByTestId('start-app').click();
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await page.getByTestId('tab-menus').click();
    await page.getByTestId('menus-section-discover').click();
    const t = createTranslator(language, resources);
    const before = await snapshot(page);
    const cards = page.getByTestId(/^menu-catalog-recipe-/);
    await expect(cards).toHaveCount(20);
    await expect(page.getByTestId('menu-catalog-count')).toHaveText(t('menuFilters.count', { count: 157, total: 157 }));
    await expect(page.getByTestId(/^recipe-photo-thumbnail-/)).toHaveCount(13);
    await expect(page.getByTestId(/^recipe-photo-detail-/)).toHaveCount(0);
    // Only one page of wrappers may mount initially; lazy loading must never
    // trigger the complete catalogue or detail downloads on catalogue entry.
    expect(photoPaths.size).toBeLessThanOrEqual(13);
    expect([...photoPaths].some(path => path.includes('/details/'))).toBe(false);
    const initialPhotoRequests = photoPaths.size;
    let pages = 1;
    while (await page.getByTestId('show-more-recipes').count()) {
      const count = await cards.count();
      await page.getByTestId('show-more-recipes').click();
      await expect(cards).toHaveCount(Math.min(count + 20, 157));
      pages++;
      expect(pages).toBeLessThanOrEqual(8);
    }
    await expect(cards).toHaveCount(157);
    expect(pages).toBe(8);
    expect(await snapshot(page)).toEqual(before);
    const checked: { recipeId: string; width: number; height: number; bytes: number; sha256: string; thumbnailSHA256: string }[] = [];
    for (const recipe of V3_RECIPES) {
      expect(recipe.id).toMatch(/^[A-Z0-9-]+$/);
      const expected = expectedPhotos.get(recipe.id);
      expect(expected, recipe.id).toBeDefined();
      const translated = localizedRecipe(recipe, t);
      const row = page.getByTestId('menu-catalog-recipe-' + recipe.id);
      await row.scrollIntoViewIfNeeded();
      const thumbnail = row.getByTestId('recipe-photo-image-thumbnail-' + recipe.id);
      await expect(thumbnail).toHaveAttribute('aria-label', t('recipePhotos.imageAlt', { title: translated.title }));
      await expect.poll(() => thumbnail.locator('img').evaluateAll(images => images.map(value => ({
        complete: (value as HTMLImageElement).complete,
        width: (value as HTMLImageElement).naturalWidth,
        height: (value as HTMLImageElement).naturalHeight,
      })))).toEqual([{ complete: true, width: expected!.thumbnail.width, height: expected!.thumbnail.height }]);
      const thumbnailURL = await thumbnail.locator('img').evaluate(value => (value as HTMLImageElement).currentSrc || (value as HTMLImageElement).src);
      expect(new URL(thumbnailURL).origin).toBe(new URL(page.url()).origin);
      // Read the body at the actual rendered local URL, with the same context
      // cookies. This explicit static-resource check adds no application write.
      const thumbnailResponse = await page.request.get(thumbnailURL);
      expect(thumbnailResponse.status(), recipe.id).toBe(200);
      const thumbnailBytes = await thumbnailResponse.body();
      expect(thumbnailBytes.length, recipe.id).toBe(expected!.thumbnail.bytes);
      expect(digest(thumbnailBytes), recipe.id).toBe(expected!.thumbnail.sha256);
      const responsePromise = page.waitForResponse(response => {
        const match = imageKind(response.url());
        return response.status() === 200 && match?.[1] === 'details' &&
          (match[2] === recipe.id || match[2].startsWith(recipe.id + '.'));
      });
      await row.click();
      const sheet = page.getByTestId('menu-sheet');
      await expect(sheet.getByRole('heading', { name: translated.title, exact: true })).toBeVisible();
      await expect(page.getByTestId(/^recipe-photo-detail-/)).toHaveCount(1);
      const image = sheet.getByTestId('recipe-photo-image-detail-' + recipe.id);
      await expect(image).toHaveAttribute('aria-label', t('recipePhotos.imageAlt', { title: translated.title }));
      await expect.poll(() => image.locator('img').evaluateAll(images => images.map(value => ({
        complete: (value as HTMLImageElement).complete,
        width: (value as HTMLImageElement).naturalWidth,
        height: (value as HTMLImageElement).naturalHeight,
      })))).toEqual([{ complete: true, width: expected!.detail.width, height: expected!.detail.height }]);
      const response = await responsePromise;
      const bytes = await response.body();
      expect(bytes.length, recipe.id).toBe(expected!.detail.bytes);
      expect(digest(bytes), recipe.id).toBe(expected!.detail.sha256);
      await expect(sheet.getByTestId('recipe-photo-fallback-detail-' + recipe.id)).toHaveCount(0);
      await expect(sheet.getByTestId('recipe-photo-status')).toHaveCount(0);
      const frame = await sheet.getByTestId('recipe-photo-detail-' + recipe.id).evaluate(element => {
        const box = element.getBoundingClientRect();
        return { left: box.left, right: box.right, width: box.width, height: box.height, viewport: document.documentElement.clientWidth };
      });
      expect(frame.width).toBeGreaterThan(100);
      expect(frame.height).toBeGreaterThan(100);
      expect(frame.left).toBeGreaterThanOrEqual(-1);
      expect(frame.right).toBeLessThanOrEqual(frame.viewport + 1);
      if (recipe.id === V3_RECIPES[0].id || recipe.id === V3_RECIPES[V3_RECIPES.length - 1].id) {
        await page.evaluate(() => document.fonts.ready);
        const path = info.outputPath(recipe.id + '-received-photo-' + language + '.png');
        await page.screenshot({ path, fullPage: true });
        await info.attach(recipe.id + '-received-photo', { path, contentType: 'image/png' });
      }
      expect(await snapshot(page)).toEqual(before);
      await sheet.getByTestId('flow-back').click();
      await expect(sheet).toHaveCount(0);
      await expect(page.getByTestId(/^recipe-photo-detail-/)).toHaveCount(0);
      checked.push({ recipeId: recipe.id, width: expected!.detail.width, height: expected!.detail.height, bytes: bytes.length, sha256: digest(bytes), thumbnailSHA256: digest(thumbnailBytes) });
    }
    expect(new Set(checked.map(value => value.recipeId)).size).toBe(150);
    expect(externalImages).toEqual([]);
    expect(errors).toEqual([]);
    expect(await snapshot(page)).toEqual(before);
    const sourceCommit = process.env.JJ_PHOTO_SOURCE_SHA;
    if (sourceCommit) expect(sourceCommit).toMatch(/^[a-f0-9]{40}$/);
    await info.attach('complete-received-photo-catalogue', {
      body: Buffer.from(JSON.stringify({
        sourceCommit: sourceCommit ?? null, language, browserProject: info.project.name,
        checkedPhotos: checked, initialPhotoRequests, initialCatalogueRows: 20, cataloguePages: pages,
        expectedLocalRecipeIDs: 150, legacyRecipesPreserved: 7, businessDocumentsPreserved: 7,
        physicalIPhone: false, nativeAppValidated: false,
      }, null, 2)), contentType: 'application/json',
    });
  });
});
