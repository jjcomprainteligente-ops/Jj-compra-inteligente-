/// <reference types="node" />
import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';
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
type Snapshot = Record<string, string | null>;
interface Write { key: string; operation: string }
interface OpenedSource { url: string; target?: string; features?: string }
type ProbeWindow = Window & {
  b062Writes: Write[]; b062Sources: OpenedSource[]; b062GeolocationRequests: number; b062FailNextSource: boolean; b062GeoMode: 'denied'|'success'|'outside'|'pending'; b062PendingPosition: PositionCallback|null; b062GeoReads: number;
};

function fixtures(language: Language, legacy: boolean): Record<string, string> {
  return {
    [keys.shopping]: JSON.stringify({ version: 1, state: { activeListId: 'b062-qa-list', lists: [{
      id: 'b062-qa-list', name: 'QA previa · ñ / Größe / crème', budgetCents: 6100, items: [{
        id: 'b062-qa-bread', name: 'Pan', quantityMilli: 2000, unit: 'ud', category: 'Panadería',
        note: 'Conservar cantidad, precio y estado', checked: true, unitPriceCents: 235, priceKind: 'entered',
      }],
    }] } }),
    // Both forms deliberately retain whitespace to detect reserialization on view.
    [keys.menus]: JSON.stringify(legacy
      ? { version: 1, plan: { servings: 2, recipeIds: legacyFive } }
      : { version: 2, plan: { kind: 'variable', servings: 12, meals: RECIPES.slice(0, 14).map(recipe => recipe.id) } }, null, 2),
    [keys.comparisons]: JSON.stringify({ version: 1, comparisons: [{ id: 'b062-qa-comparison', name: 'QA comparación conservada', offers: [] }] }),
    [keys.observations]: JSON.stringify({ version: 1, observations: [{
      id: 'b062-qa-observation', product: 'Arroz QA', brand: 'Marca ficticia QA', format: 'Bolsa', quality: 'Prueba',
      store: 'Comercio ficticio QA', quantityMilli: 1000, unit: 'kg', priceCents: 250, observedOn: '2026-11-24',
      sourceKind: 'manual', sourceReference: 'Dato ficticio de prueba aislada', url: null,
    }] }),
    [keys.expenses]: JSON.stringify({ version: 1, data: { expenses: [{
      id: 'b062-qa-expense', amountCents: 1234, date: '2026-11-24', store: 'Comercio ficticio QA',
      note: 'Gasto ficticio conservado', listId: 'b062-qa-list', listName: 'QA previa · ñ / Größe / crème', source: 'user-confirmed',
    }] } }),
    [keys.settings]: JSON.stringify({ version: 1, preferences: {
      favoriteStores: legacy ? legacyFavorites : [], inAppReminders: true,
    } }, null, 2),
    [keys.preferences]: JSON.stringify({ version: 1, language, welcomeCompleted: true }),
  };
}

export async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(names => Object.fromEntries(names.map(name => [name, localStorage.getItem(name)])), businessKeys);
}
export async function writes(page: Page): Promise<Write[]> {
  return page.evaluate(() => (window as unknown as ProbeWindow).b062Writes);
}
export async function begin(page: Page, language: Language, legacy = false) {
  // The optional access URL is navigation input only; it is never an attachment.
  await page.goto(process.env.JJ_STORE_GEOGRAPHY_SHARE_URL ?? '/');
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
    probe.b062Writes = [];
    probe.b062Sources = [];
    probe.b062GeolocationRequests = 0;
    probe.b062FailNextSource = false; probe.b062GeoMode = 'denied'; probe.b062PendingPosition = null; probe.b062GeoReads = 0;
    const setItem = Storage.prototype.setItem, removeItem = Storage.prototype.removeItem, clear = Storage.prototype.clear;
    Storage.prototype.setItem = function (key, value) {
      if (this === localStorage) probe.b062Writes.push({ key, operation: 'setItem' });
      return setItem.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key) {
      if (this === localStorage) probe.b062Writes.push({ key, operation: 'removeItem' });
      return removeItem.call(this, key);
    };
    Storage.prototype.clear = function () {
      if (this === localStorage) probe.b062Writes.push({ key: '*', operation: 'clear' });
      return clear.call(this);
    };
    window.open = ((url?: string | URL, target?: string, features?: string) => {
      if (probe.b062FailNextSource) {
        probe.b062FailNextSource = false;
        throw new Error('QA isolated source-opening failure');
      }
      probe.b062Sources.push({ url: String(url), target, features });
      return null;
    }) as typeof window.open;
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: {
      getCurrentPosition(success: PositionCallback, failure?: PositionErrorCallback) {
        probe.b062GeolocationRequests++;
        if (probe.b062GeoMode === 'pending') { probe.b062PendingPosition = success; return; }
        if (probe.b062GeoMode === 'denied') { failure?.({code:1} as GeolocationPositionError); return; }
        success({timestamp:Date.now(),coords:{latitude:probe.b062GeoMode === 'outside' ?28.684:28.24361,
          longitude:probe.b062GeoMode === 'outside' ?-17.764:-16.84153,accuracy:25}} as GeolocationPosition);
      },
      watchPosition() { probe.b062GeolocationRequests++; return 1; },
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

export async function openStores(page: Page) {
  await page.getByTestId('open-profile').click();
  await page.getByTestId('profile-stores').click();
  await expect(page.getByTestId('stores-screen')).toBeVisible();
  for (const format of formats) await expect(page.getByTestId(`store-locations-open-${format}`)).toBeEnabled();
}
export function observe(page: Page) {
  const errors: string[] = [], externalRequests: string[] = [];
  const origin = new URL(page.url()).origin;
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    const url = new URL(request.url());
    if (/^https?:$/.test(url.protocol) && url.origin !== origin) externalRequests.push(url.origin);
  });
  return { errors, externalRequests };
}
/** Captures vertical segments of RN ScrollViews as well as fixed actions. */
export async function capture(page: Page, info: TestInfo, name: string, controls: Locator[] = []) {
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

