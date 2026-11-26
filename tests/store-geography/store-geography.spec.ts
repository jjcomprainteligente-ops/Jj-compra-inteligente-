/// <reference types="node" />
import { expect, test, type Page } from '@playwright/test';
import { begin, capture, observe, openStores, snapshot, writes } from './helpers';
import type { Language } from '../../src/i18n/types';

type GeoProbe = Window & { b062GeoMode: 'denied' | 'success' | 'outside' | 'pending';
  b062GeolocationRequests: number; b062PendingPosition: PositionCallback | null; b062GeoReads: number };
async function mode(page: Page, value: GeoProbe['b062GeoMode']) {
  await page.evaluate(next => { (window as unknown as GeoProbe).b062GeoMode = next; }, value);
}
async function gpsCalls(page: Page) { return page.evaluate(() => (window as unknown as GeoProbe).b062GeolocationRequests); }
async function chooseGigantes(page: Page, prefix = 'store-area') {
  await page.getByTestId(`${prefix}-query`).fill('38683');
  await page.getByTestId(`${prefix}-search`).click();
  await page.getByTestId(`${prefix}-choice-place-6692470-38683`).click();
  await page.getByTestId(`${prefix}-radius-5`).click();
  await page.getByTestId(`${prefix}-apply`).click();
  await expect(page.getByTestId(`${prefix}-summary`)).toContainText('Los Gigantes · 38683 · 5 km');
}
async function directory(page: Page, format: string) {
  await page.getByTestId(`store-locations-open-${format}`).click();
  await expect(page.getByTestId('store-locations-sheet')).toBeVisible();
  return page.getByTestId('store-locations-sheet');
}

for (const language of ['es', 'en', 'de', 'fr'] as const satisfies readonly Language[]) test.describe(language, () => {
  test('A · explicit manual area, radius and honest pending coverage preserve all documents', async ({ page }, info) => {
    const { t } = await begin(page, language, true);
    const before = await snapshot(page), network = observe(page);
    await openStores(page);
    expect(await gpsCalls(page)).toBe(0);
    await page.getByTestId('store-area-toggle').click();
    for (const [query, status] of [['abc', 'invalid-input'], ['28013', 'outside-scope'], ['38700', 'outside-scope'], ['38699', 'no-reference']] as const) {
      await page.getByTestId('store-area-query').fill(query);
      await page.getByTestId('store-area-search').click();
      await expect(page.getByTestId('store-area-form')).toContainText(t(`storeGeo.lookup.${status}`));
      expect(await snapshot(page)).toEqual(before);
    }
    await page.getByTestId('store-area-query').fill('38107');
    await page.getByTestId('store-area-search').click();
    await expect(page.getByTestId('store-area-choices').getByRole('radio')).toHaveCount(4);
    await page.getByTestId('store-area-apply').click();
    await expect(page.getByTestId('store-area-form')).toContainText(t('storeGeo.selectFirst'));
    await capture(page, info, 'A-ambiguous-explicit-choice', [page.getByTestId('store-area-apply')]);
    await chooseGigantes(page);
    await page.context().setOffline(true);
    let sheet = await directory(page, 'superdino');
    await expect(sheet.getByTestId('establishment-dinosol-166')).toBeVisible();
    await expect(sheet.getByTestId('establishment-distance-dinosol-166')).toContainText('km');
    await expect(sheet.getByTestId('establishment-dinosol-162')).toContainText(t('storeLocations.locationConflict'));
    await expect(sheet.getByTestId('establishment-distance-dinosol-162')).toHaveCount(0);
    await capture(page, info, 'A-distance-and-pending', [page.getByTestId('store-locations-close')]);
    await page.getByTestId('store-locations-close').click();
    sheet = await directory(page, 'lidl');
    await expect(sheet.getByTestId('establishment-lidl-santiago-quinto-centenario')).toBeVisible();
    await expect(sheet.getByTestId('establishment-lidl-santa-cruz-general-sur')).toHaveCount(0);
    await sheet.getByTestId('store-nearby-outside').click();
    await expect(sheet.getByTestId('establishment-lidl-santa-cruz-general-sur')).toBeVisible();
    await expect(sheet).toContainText(t('storeGeo.outsideTitle'));
    await page.getByTestId('store-locations-close').click();
    await page.getByTestId('store-area-toggle').click();
    await page.getByTestId('store-area-radius').fill('2.5');
    await page.getByTestId('store-area-apply-radius').click();
    await expect(page.getByTestId('store-area-form')).toContainText(t('storeGeo.invalidRadius'));
    await page.getByTestId('store-area-radius').fill('1');
    await page.getByTestId('store-area-apply-radius').click();
    await expect(page.getByTestId('store-area-summary')).toContainText('1 km');
    await page.getByTestId('store-area-toggle').click();
    await page.getByTestId('store-area-mode-locality').click();
    await page.getByTestId('store-area-query').fill('los cristianos');
    await page.getByTestId('store-area-search').click();
    await expect(page.getByTestId('store-area-choices').getByRole('radio')).toHaveCount(1);
    await page.getByTestId('store-area-choice-place-2514741-38650').click();
    await page.getByTestId('store-area-radius-5').click();
    await page.getByTestId('store-area-apply').click();
    sheet = await directory(page, 'lidl');
    await expect(sheet.getByTestId('store-nearby-empty')).toBeVisible();
    await expect(sheet).toContainText(t('storeGeo.noNearbyText'));
    await capture(page, info, 'A-partial-no-nearby', [page.getByTestId('store-nearby-outside')]);
    await page.getByTestId('store-locations-close').click();
    expect(await snapshot(page)).toEqual(before); expect(await writes(page)).toEqual([]); expect(await gpsCalls(page)).toBe(0);
    expect(network.errors).toEqual([]); expect(network.externalRequests).toEqual([]);
    await page.context().setOffline(false);
    await page.reload(); await openStores(page);
    await expect(page.getByTestId('store-area-summary')).toHaveText(t('storeGeo.noArea'));
    expect(await snapshot(page)).toEqual(before);
  });

  test('B · one-shot GPS handles denial, scope, stale callbacks and privacy deletion', async ({ page }, info) => {
    const { t } = await begin(page, language);
    const before = await snapshot(page), network = observe(page);
    await openStores(page); await page.getByTestId('store-area-toggle').click();
    await page.getByTestId('store-area-gps').click();
    await expect(page.getByTestId('store-area-form')).toContainText(t('storeGeo.gps.denied'));
    expect(await gpsCalls(page)).toBe(1);
    await mode(page, 'outside'); await page.getByTestId('store-area-gps').click();
    await expect(page.getByTestId('store-area-form')).toContainText(t('storeGeo.gps.outside-scope'));
    await mode(page, 'success'); await page.getByTestId('store-area-gps').click();
    await expect(page.getByTestId('store-area-summary')).toContainText(t('storeGeo.deviceSummary', { radius: '10' }));
    await expect(page.getByTestId('store-area')).toContainText(t('storeGeo.accuracy', { accuracy: '25' }));
    await capture(page, info, 'B-consented-one-shot', [page.getByTestId('store-area-gps'), page.getByTestId('store-area-clear')]);
    await mode(page, 'pending'); await page.getByTestId('store-area-gps').click();
    await chooseGigantes(page);
    await page.evaluate(() => {
      const probe = window as unknown as GeoProbe;
      probe.b062PendingPosition?.({ get coords() { probe.b062GeoReads++; throw new Error('Cancelled private coordinate read'); }, timestamp:Date.now() } as unknown as GeolocationPosition);
    });
    await expect(page.getByTestId('store-area-summary')).toContainText('Los Gigantes');
    expect(await page.evaluate(() => (window as unknown as GeoProbe).b062GeoReads)).toBe(0);
    expect(await snapshot(page)).toEqual(before); expect(await writes(page)).toEqual([]);
    await page.getByTestId('open-profile').click(); await page.getByTestId('profile-privacy').click();
    await page.getByTestId('privacy-delete-observations').click();
    await page.getByTestId('privacy-delete-review-next').click();
    await page.getByTestId('privacy-delete-word').fill(t('privacy.confirmWord'));
    await page.getByTestId('privacy-delete-ack').click();
    await page.getByTestId('privacy-delete-confirm').click();
    await expect(page.getByTestId('privacy-delete-result')).toBeVisible();
    await page.getByTestId('open-profile').click(); await page.getByTestId('profile-stores').click();
    await expect(page.getByTestId('store-area-summary')).toHaveText(t('storeGeo.noArea'));
    const after = await snapshot(page);
    for (const key of Object.keys(before).filter(key => !key.endsWith('price-observations.v1'))) expect(after[key]).toBe(before[key]);
    expect(network.errors).toEqual([]); expect(network.externalRequests).toEqual([]);
  });

  test('C · area is shared with the purchase journey without editing saved favourites or menus', async ({ page }, info) => {
    const { t } = await begin(page, language, true);
    const before = await snapshot(page), network = observe(page);
    await openStores(page); await page.getByTestId('store-area-toggle').click(); await chooseGigantes(page);
    await page.getByTestId('tab-home').click(); await page.getByTestId('start-with-budget').click();
    await page.getByTestId('planning-budget-amount').fill('50');
    await page.getByTestId('planning-meals').fill('1'); await page.getByTestId('planning-servings').fill('1');
    await page.getByTestId('planning-budget-continue').click();
    await expect(page.getByTestId('journey-area-summary')).toContainText('Los Gigantes');
    await expect(page.getByTestId('planning-stores-none')).toBeDisabled();
    await page.getByTestId('planning-stores-all').click();
    await page.getByTestId('planning-stores-none').click();
    await expect(page.getByTestId('store-locations-content')).toHaveCount(0);
    await expect(page.getByTestId('planning-stores-continue')).toBeEnabled();
    await page.getByTestId('planning-stores-all').click();
    await expect(page.getByTestId('establishment-distance-dinosol-162')).toHaveCount(0);
    await expect(page.getByTestId('establishment-distance-dinosol-11')).toBeVisible();
    await capture(page, info, 'C-journey-shared-area', [page.getByTestId('planning-stores-continue')]);
    await page.getByTestId('journey-area-toggle').click();
    await page.getByTestId('journey-area-radius-20').click(); await page.getByTestId('journey-area-apply-radius').click();
    await page.getByTestId('open-profile').click(); await page.getByTestId('profile-stores').click();
    await expect(page.getByTestId('store-area-summary')).toContainText('20 km');
    await page.getByTestId('store-area-clear').click();
    await expect(page.getByTestId('store-area-summary')).toHaveText(t('storeGeo.noArea'));
    expect(await snapshot(page)).toEqual(before); expect(await writes(page)).toEqual([]); expect(await gpsCalls(page)).toBe(0);
    expect(network.errors).toEqual([]); expect(network.externalRequests).toEqual([]);
  });

  test('D · recipe review uses the area inline within its existing sheet and can be cancelled without writes', async ({ page }, info) => {
    const { t } = await begin(page, language);
    const before = await snapshot(page), network = observe(page);
    await page.getByTestId('start-with-recipes').click();
    await page.getByTestId('menu-catalog-recipe-JJ-E03-004').click();
    const sheet = page.getByTestId('menu-sheet');
    await sheet.getByRole('button', { name: t('menus.reviewRecipe'), exact: true }).click();
    await sheet.getByTestId('confirm-ingredients').click();
    await expect(sheet.getByTestId('planning-stores-picker')).toBeVisible();
    await sheet.getByTestId('journey-area-toggle').click();
    await chooseGigantes(page, 'journey-area');
    await sheet.getByTestId('store-choice-superdino').click();
    await expect(sheet.getByTestId('establishment-distance-dinosol-166')).toBeVisible();
    await expect(sheet.getByTestId('establishment-distance-dinosol-162')).toHaveCount(0);
    // React Native Web also provides an unlabelled modal host around the sheet.
    await expect(page.locator('[role="dialog"][aria-label]')).toHaveCount(1);
    await expect(page.getByTestId('store-locations-sheet')).toHaveCount(0);
    await capture(page, info, 'D-inline-recipe-area', [sheet.getByTestId('journey-back-ingredients')]);
    await sheet.getByTestId('journey-back-ingredients').click();
    await sheet.getByRole('button', { name: t('menus.cancelProposal'), exact: true }).click();
    await sheet.getByRole('button', { name: t('menus.cancelWithoutAdd'), exact: true }).click();
    await expect(sheet).toHaveCount(0);
    expect(await snapshot(page)).toEqual(before); expect(await writes(page)).toEqual([]); expect(await gpsCalls(page)).toBe(0);
    expect(network.errors).toEqual([]); expect(network.externalRequests).toEqual([]);
  });
});
