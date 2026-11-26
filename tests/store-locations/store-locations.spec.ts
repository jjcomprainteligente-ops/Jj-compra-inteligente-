/// <reference types="node" />
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { RECIPES } from '../../src/data/recipes';
import { createFormatters, createTranslator } from '../../src/i18n/core';
import { resources } from '../../src/i18n/resources';
import type { Language, Translator } from '../../src/i18n/types';

const prefix = 'jjcompraintelwgiemt.';
const keys = {
  shopping: prefix + 'shopping.v1', menus: prefix + 'menus.v1', comparisons: prefix + 'comparisons.v1',
  observations: prefix + 'price-observations.v1', expenses: prefix + 'expenses.v1',
  settings: prefix + 'local-settings.v1', preferences: prefix + 'preferences.v1',
} as const;
const businessKeys = Object.values(keys);
const formats = ['lidl', 'aldi', 'hiperdino', 'superdino', 'hiperdino-express', 'mercadona'] as const;
const legacyFavorites = ['hiperdino', 'carrefour', 'mercadona', 'other'];
const legacyFive = ['arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate'];
const translationPrefixes = [...new Set(Object.keys(resources.es).map(key => key.split('.')[0]))];
type Format = typeof formats[number];
type Snapshot = Record<string, string | null>;
interface Write { key: string; operation: string }
interface OpenedSource { url: string; target?: string; features?: string }
type ProbeWindow = Window & {
  b061Writes: Write[]; b061Sources: OpenedSource[]; b061GeolocationRequests: number; b061FailNextSource: boolean;
};

// Independent expectations transcribed from the six individual official pages,
// not imported from the new runtime catalogue or its validator.
const establishments = [
  { id: 'lidl-santa-cruz-general-sur', format: 'lidl', street: 'Ctra. General del Sur', postal: '38107',
    url: 'https://www.lidl.es/s/es-ES/tiendas/santa-cruz-de-tenerife/ctra-general-del-sur-s-n/', published: true },
  { id: 'lidl-santiago-quinto-centenario', format: 'lidl', street: 'Quinto Centenario', postal: '38683',
    url: 'https://www.lidl.es/s/es-ES/tiendas/santiago-del-teide-tenerife/avda-quinto-centenario-66/', published: true },
  { id: 'dinosol-231', format: 'hiperdino', street: 'Camino San Lázaro', postal: '38206',
    url: 'https://www.hiperdino.es/c9494/tiendas/index/detail/id/231/', published: true },
  { id: 'dinosol-166', format: 'superdino', street: 'Petunia', postal: '38683',
    url: 'https://www.hiperdino.es/c9494/tiendas/index/detail/id/166/', published: true },
  { id: 'dinosol-162', format: 'superdino', street: 'Alcalá - Tamaimo', postal: '38436',
    url: 'https://www.hiperdino.es/c9494/tiendas/index/detail/id/162/', published: false },
  { id: 'dinosol-11', format: 'hiperdino-express', street: 'Poblado Marinero', postal: '38683',
    url: 'https://www.hiperdino.es/c9780/tiendas/index/detail/id/11/', published: true },
] as const;

function fixtures(language: Language, legacy: boolean): Record<string, string> {
  return {
    [keys.shopping]: JSON.stringify({ version: 1, state: { activeListId: 'b061-qa-list', lists: [{
      id: 'b061-qa-list', name: 'QA previa · ñ / Größe / crème', budgetCents: 6100, items: [{
        id: 'b061-qa-bread', name: 'Pan', quantityMilli: 2000, unit: 'ud', category: 'Panadería',
        note: 'Conservar cantidad, precio y estado', checked: true, unitPriceCents: 235, priceKind: 'entered',
      }],
    }] } }),
    // Both forms deliberately retain whitespace to detect reserialization on view.
    [keys.menus]: JSON.stringify(legacy
      ? { version: 1, plan: { servings: 2, recipeIds: legacyFive } }
      : { version: 2, plan: { kind: 'variable', servings: 12, meals: RECIPES.slice(0, 14).map(recipe => recipe.id) } }, null, 2),
    [keys.comparisons]: JSON.stringify({ version: 1, comparisons: [{ id: 'b061-qa-comparison', name: 'QA comparación conservada', offers: [] }] }),
    [keys.observations]: JSON.stringify({ version: 1, observations: [{
      id: 'b061-qa-observation', product: 'Arroz QA', brand: 'Marca ficticia QA', format: 'Bolsa', quality: 'Prueba',
      store: 'Comercio ficticio QA', quantityMilli: 1000, unit: 'kg', priceCents: 250, observedOn: '2026-11-24',
      sourceKind: 'manual', sourceReference: 'Dato ficticio de prueba aislada', url: null,
    }] }),
    [keys.expenses]: JSON.stringify({ version: 1, data: { expenses: [{
      id: 'b061-qa-expense', amountCents: 1234, date: '2026-11-24', store: 'Comercio ficticio QA',
      note: 'Gasto ficticio conservado', listId: 'b061-qa-list', listName: 'QA previa · ñ / Größe / crème', source: 'user-confirmed',
    }] } }),
    [keys.settings]: JSON.stringify({ version: 1, preferences: {
      favoriteStores: legacy ? legacyFavorites : [], inAppReminders: true,
    } }, null, 2),
    [keys.preferences]: JSON.stringify({ version: 1, language, welcomeCompleted: true }),
  };
}

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(names => Object.fromEntries(names.map(name => [name, localStorage.getItem(name)])), businessKeys);
}
async function writes(page: Page): Promise<Write[]> {
  return page.evaluate(() => (window as unknown as ProbeWindow).b061Writes);
}
async function sources(page: Page): Promise<OpenedSource[]> {
  return page.evaluate(() => (window as unknown as ProbeWindow).b061Sources);
}
async function settings(page: Page): Promise<{ favoriteStores: string[]; inAppReminders: boolean }> {
  return JSON.parse((await snapshot(page))[keys.settings]!).preferences;
}
function unchangedExceptSettings(before: Snapshot, after: Snapshot) {
  for (const key of businessKeys.filter(key => key !== keys.settings)) expect(after[key], key).toBe(before[key]);
}

async function begin(page: Page, language: Language, legacy = false) {
  // The optional access URL is navigation input only; it is never an attachment.
  await page.goto(process.env.JJ_STORE_LOCATIONS_SHARE_URL ?? '/');
  await expect(page.getByTestId('welcome-title')).toBeVisible();
  expect(Object.values(await snapshot(page))).toEqual(Array(businessKeys.length).fill(null));
  const data = fixtures(language, legacy);
  await page.evaluate(entries => {
    for (const [key, raw] of Object.entries(entries)) localStorage.setItem(key, raw);
  }, data);
  // Install instrumentation only. A reload must read the durable fixtures, never
  // recreate them via addInitScript and accidentally hide a lost write.
  await page.addInitScript(() => {
    const probe = window as unknown as ProbeWindow;
    probe.b061Writes = [];
    probe.b061Sources = [];
    probe.b061GeolocationRequests = 0;
    probe.b061FailNextSource = false;
    const setItem = Storage.prototype.setItem, removeItem = Storage.prototype.removeItem, clear = Storage.prototype.clear;
    Storage.prototype.setItem = function (key, value) {
      if (this === localStorage) probe.b061Writes.push({ key, operation: 'setItem' });
      return setItem.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key) {
      if (this === localStorage) probe.b061Writes.push({ key, operation: 'removeItem' });
      return removeItem.call(this, key);
    };
    Storage.prototype.clear = function () {
      if (this === localStorage) probe.b061Writes.push({ key: '*', operation: 'clear' });
      return clear.call(this);
    };
    window.open = ((url?: string | URL, target?: string, features?: string) => {
      if (probe.b061FailNextSource) {
        probe.b061FailNextSource = false;
        throw new Error('QA isolated source-opening failure');
      }
      probe.b061Sources.push({ url: String(url), target, features });
      return null;
    }) as typeof window.open;
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
      getCurrentPosition() { probe.b061GeolocationRequests++; },
      watchPosition() { probe.b061GeolocationRequests++; return 1; },
      clearWatch() { /* No real location subscription exists in this QA context. */ },
    } });
  });
  await page.reload();
  await expect(page.getByTestId('open-profile')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  expect(await snapshot(page)).toEqual(data);
  expect(await writes(page)).toEqual([]);
  return { t: createTranslator(language, resources), formatDate: createFormatters(language).formatDate };
}

async function openStores(page: Page) {
  await page.getByTestId('open-profile').click();
  await page.getByTestId('profile-stores').click();
  await expect(page.getByTestId('stores-screen')).toBeVisible();
  for (const format of formats) await expect(page.getByTestId(`store-locations-open-${format}`)).toBeEnabled();
}
async function openDirectory(page: Page, format: Format) {
  const opener = page.getByTestId(`store-locations-open-${format}`);
  await opener.scrollIntoViewIfNeeded();
  await opener.focus();
  await opener.click();
  const sheet = page.getByTestId('store-locations-sheet');
  await expect(sheet).toBeVisible();
  await expect(page.getByTestId('store-locations-content')).toBeVisible();
  await expect(page.getByTestId('store-locations-unavailable')).toHaveCount(0);
  return sheet;
}
async function closeDirectory(page: Page, format: Format) {
  await page.getByTestId('store-locations-close').click();
  await expect(page.getByTestId('store-locations-sheet')).toHaveCount(0);
  await expect(page.getByTestId(`store-locations-open-${format}`)).toBeFocused();
}
function observe(page: Page) {
  const errors: string[] = [], externalRequests: string[] = [];
  const origin = new URL(page.url()).origin;
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    const url = new URL(request.url());
    if (/^https?:$/.test(url.protocol) && url.origin !== origin) externalRequests.push(url.origin);
  });
  return { errors, externalRequests };
}
async function noLocationPermissionRequested(page: Page) {
  expect(await page.evaluate(() => (window as unknown as ProbeWindow).b061GeolocationRequests)).toBe(0);
}
async function expectHonestDirectory(sheet: Locator, t: Translator) {
  await expect(sheet).toContainText(t('storeLocations.partialTitle'));
  await expect(sheet).toContainText(t('storeLocations.partialHelp'));
  await expect(sheet).toContainText(t('storeLocations.noDistance'));
  expect(await sheet.innerText()).not.toMatch(/\d(?:[.,]\d+)?\s*(?:km|min)\b|\d[\d.,]*\s*€/i);
}

/** Captures vertical segments of RN ScrollViews as well as fixed actions. */
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
  // React Native Web has a modal host plus the labelled dialog; inspect the latter.
  const scope = await page.getByRole('dialog').count() ? page.getByRole('dialog').last() : page.locator('body');
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

for (const language of ['es', 'en', 'de', 'fr'] as const) test.describe(language, () => {
  test('A · reads six official records and pending coverage without writing or requesting location', async ({ page }, info) => {
    const { t, formatDate } = await begin(page, language);
    const before = await snapshot(page), network = observe(page);
    await openStores(page);
    const expectedSources: string[] = [];
    let published = 0, pending = 0;
    for (const format of formats) {
      const sheet = await openDirectory(page, format);
      await expectHonestDirectory(sheet, t);
      const expected = establishments.filter(value => value.format === format);
      await expect(sheet.getByTestId(/^establishment-(?:lidl|dinosol)-/)).toHaveCount(expected.length);
      if (!expected.length) {
        await expect(page.getByTestId('store-locations-empty')).toBeVisible();
        await expect(sheet).toContainText(t('storeLocations.emptyTitle'));
        await expect(sheet).toContainText(t('storeLocations.emptyText'));
      } else await expect(page.getByTestId('store-locations-empty')).toHaveCount(0);
      for (const entry of expected) {
        const card = page.getByTestId(`establishment-${entry.id}`);
        await expect(card).toContainText(entry.street);
        await expect(card).toContainText(entry.postal);
        await expect(card).toContainText(t('storeLocations.physical'));
        await expect(card).toContainText(t('storeLocations.priceUnverified'));
        await expect(page.getByTestId(`establishment-source-date-${entry.id}`)).toHaveText(
          t('storeLocations.sourceDate', { date: formatDate('2026-11-26') }),
        );
        await expect(page.getByTestId(`establishment-location-${entry.id}`)).toHaveText(
          t(entry.published ? 'storeLocations.locationPublished' : 'storeLocations.locationPending'),
        );
        if (entry.published) published++;
        else {
          pending++;
          await expect(card).toContainText(t('storeLocations.locationConflict'));
        }
        if (entry.id === 'lidl-santa-cruz-general-sur') {
          await page.evaluate(() => { (window as unknown as ProbeWindow).b061FailNextSource = true; });
          await page.getByTestId(`establishment-source-${entry.id}`).click();
          const failure = page.getByTestId(`establishment-source-error-${entry.id}`);
          await expect(failure).toBeVisible();
          await expect(failure).toContainText(t('storeLocations.openErrorTitle'));
          await expect(failure).toContainText(t('storeLocations.openErrorText'));
          expect(await snapshot(page)).toEqual(before);
          expect(await writes(page)).toEqual([]);
          await capture(page, info, 'A-source-open-error', [
            page.getByTestId(`establishment-source-${entry.id}`), page.getByTestId('store-locations-close'),
          ]);
        }
        await page.getByTestId(`establishment-source-${entry.id}`).click();
        await expect(page.getByTestId(`establishment-source-error-${entry.id}`)).toHaveCount(0);
        expectedSources.push(entry.url);
      }
      await capture(page, info, 'A-' + format, [
        ...expected.map(entry => page.getByTestId(`establishment-source-${entry.id}`)),
        page.getByTestId('store-locations-close'),
      ]);
      await closeDirectory(page, format);
      expect(await snapshot(page)).toEqual(before);
      expect(await writes(page)).toEqual([]);
    }
    expect({ published, pending }).toEqual({ published: 5, pending: 1 });
    const opened = await sources(page);
    expect(opened.map(value => value.url)).toEqual(expectedSources);
    for (const source of opened) {
      const url = new URL(source.url);
      expect(url.protocol).toBe('https:');
      expect(url.username + url.password + url.search + url.hash).toBe('');
      expect(source.target).toBe('_blank');
      expect(source.features?.split(',')).toContain('noopener');
      expect(source.features?.split(',')).toContain('noreferrer');
    }
    await noLocationPermissionRequested(page);
    await page.reload();
    await expect(page.getByTestId('open-profile')).toBeVisible();
    await openStores(page);
    expect(await snapshot(page)).toEqual(before);
    expect(await writes(page)).toEqual([]);
    for (const format of formats) await expect(page.getByTestId(`favorite-${format}`)).not.toBeChecked();

    // A device date preceding the checked catalogue must show the safe fallback,
    // while the independent favourites screen and seven durable documents remain usable.
    await page.clock.setFixedTime(new Date('2026-11-25T12:00:00Z'));
    try {
      await page.reload();
      await expect(page.getByTestId('open-profile')).toBeVisible();
      await openStores(page);
      const opener = page.getByTestId('store-locations-open-lidl');
      await opener.scrollIntoViewIfNeeded();
      await opener.focus();
      await opener.click();
      const sheet = page.getByTestId('store-locations-sheet');
      await expect(sheet).toBeVisible();
      await expect(page.getByTestId('store-locations-unavailable')).toBeVisible();
      await expect(sheet).toContainText(t('storeLocations.unavailableTitle'));
      await expect(sheet).toContainText(t('storeLocations.unavailableText'));
      await expect(sheet.getByTestId(/^establishment-(?:lidl|dinosol)-/)).toHaveCount(0);
      await expect(sheet.getByTestId(/^establishment-source-/)).toHaveCount(0);
      expect(await snapshot(page)).toEqual(before);
      expect(await writes(page)).toEqual([]);
      await capture(page, info, 'A-catalogue-clock-fallback', [page.getByTestId('store-locations-close')]);
      await closeDirectory(page, 'lidl');
      for (const format of formats) await expect(page.getByTestId(`favorite-${format}`)).toBeEnabled();
      await expect(page.getByTestId('stores-select-all')).toBeEnabled();
      await expect(page.getByTestId('stores-clear')).toBeDisabled();
    } finally {
      // setSystemTime returns Date to advancing host time; it does not run timers early.
      await page.clock.setSystemTime(Date.now());
    }
    await page.reload();
    await expect(page.getByTestId('open-profile')).toBeVisible();
    await openStores(page);
    const restored = await openDirectory(page, 'lidl');
    await expect(restored.getByTestId(/^establishment-lidl-/)).toHaveCount(2);
    await expect(page.getByTestId('establishment-location-lidl-santa-cruz-general-sur')).toHaveText(t('storeLocations.locationPublished'));
    await expect(page.getByTestId('establishment-location-lidl-santiago-quinto-centenario')).toHaveText(t('storeLocations.locationPublished'));
    await capture(page, info, 'A-catalogue-clock-restored', [page.getByTestId('store-locations-close')]);
    await closeDirectory(page, 'lidl');
    expect(await snapshot(page)).toEqual(before);
    expect(await writes(page)).toEqual([]);
    await noLocationPermissionRequested(page);
    expect(network.externalRequests).toEqual([]);
    expect(network.errors).toEqual([]);
  });

  test('B · preserves legacy favourites and six other documents through offline viewing and explicit selection', async ({ page, context }, info) => {
    const { t } = await begin(page, language, true);
    const before = await snapshot(page), network = observe(page);
    await openStores(page);
    for (const id of legacyFavorites) await expect(page.getByTestId(`favorite-${id}`)).toBeChecked();
    for (const id of ['carrefour', 'other']) await expect(page.getByTestId(`store-locations-open-${id}`)).toHaveCount(0);
    await context.setOffline(true);
    try {
      for (const format of ['superdino', 'aldi'] as const) {
        const sheet = await openDirectory(page, format);
        await expectHonestDirectory(sheet, t);
        if (format === 'superdino') {
          await expect(page.getByTestId('establishment-location-dinosol-162')).toHaveText(t('storeLocations.locationPending'));
          await expect(page.getByTestId('establishment-dinosol-162')).toContainText(t('storeLocations.locationConflict'));
          await page.getByTestId('establishment-source-dinosol-162').click();
        } else await expect(page.getByTestId('store-locations-empty')).toBeVisible();
        await capture(page, info, 'B-offline-' + format, [page.getByTestId('store-locations-close')]);
        await closeDirectory(page, format);
      }
      expect(await snapshot(page)).toEqual(before);
      expect(await writes(page)).toEqual([]);
      expect((await sources(page)).map(source => source.url)).toEqual([
        'https://www.hiperdino.es/c9494/tiendas/index/detail/id/162/',
      ]);
      await noLocationPermissionRequested(page);
    } finally { await context.setOffline(false); }
    await page.getByTestId('stores-select-all').click();
    await expect.poll(() => settings(page)).toEqual({ favoriteStores: [...formats, 'carrefour', 'other'], inAppReminders: true });
    await expect(page.getByTestId('stores-select-all')).toBeDisabled();
    unchangedExceptSettings(before, await snapshot(page));
    const selected = await snapshot(page);
    await page.reload();
    await expect(page.getByTestId('open-profile')).toBeVisible();
    await openStores(page);
    expect(await snapshot(page)).toEqual(selected);
    expect(await writes(page)).toEqual([]);
    for (const id of [...formats, 'carrefour', 'other']) await expect(page.getByTestId(`favorite-${id}`)).toBeChecked();
    await page.getByTestId('stores-clear').click();
    await expect.poll(() => settings(page)).toEqual({ favoriteStores: [], inAppReminders: true });
    unchangedExceptSettings(before, await snapshot(page));
    await openDirectory(page, 'lidl');
    await capture(page, info, 'B-lidl-with-no-favourites', [page.getByTestId('store-locations-close')]);
    await closeDirectory(page, 'lidl');
    const cleared = await snapshot(page);
    await page.reload();
    await expect(page.getByTestId('open-profile')).toBeVisible();
    await openStores(page);
    expect(await snapshot(page)).toEqual(cleared);
    expect(await writes(page)).toEqual([]);
    for (const id of [...formats, 'carrefour', 'other']) await expect(page.getByTestId(`favorite-${id}`)).not.toBeChecked();
    unchangedExceptSettings(before, await snapshot(page));
    await noLocationPermissionRequested(page);
    expect(network.externalRequests).toEqual([]);
    expect(network.errors).toEqual([]);
  });
});
