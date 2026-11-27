/// <reference types="node" />
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import { createFormatters, createTranslator } from '../../src/i18n/core';
import { resources } from '../../src/i18n/resources';
import type { Language } from '../../src/i18n/types';

const prefix = 'jjcompraintelwgiemt.';
const keys = {
  shopping: prefix + 'shopping.v1', menus: prefix + 'menus.v1', comparisons: prefix + 'comparisons.v1',
  observations: prefix + 'price-observations.v1', expenses: prefix + 'expenses.v1',
  settings: prefix + 'local-settings.v1', preferences: prefix + 'preferences.v1',
} as const;
const businessKeys = Object.values(keys);
const translationPrefixes = [...new Set(Object.keys(resources.es).map(key => key.split('.')[0]))];
type Snapshot = Record<string, string | null>;
type Probe = Window & {
  b082Writes: { key: string; operation: string }[];
  b082RawGet: (key: string) => string | null;
  b082ExternalSet: (key: string, value: string) => void;
  b082FailRead: string | null;
  b082FailedReads: number;
};

/** Synthetic, isolated QA contributions. These are never commercial or verified prices. */
function fixtures(language: Language): Record<string, string> {
  const observation = (id: string, overrides: Record<string, unknown> = {}) => ({
    id, product: 'Arroz QA', brand: 'Marca ficticia QA', format: 'Bolsa QA', quality: 'Prueba aislada QA',
    store: 'Comercio ficticio QA', quantityMilli: 500000, unit: 'g', priceCents: 250,
    observedOn: '2026-11-26', sourceKind: 'manual',
    sourceReference: 'Contribución sintética QA; no es un precio comercial verificado', url: null,
    ...overrides,
  });
  return {
    [keys.shopping]: JSON.stringify({ version: 1, state: { activeListId: 'b082-qa-list', lists: [{
      id: 'b082-qa-list', name: 'QA cesta · ñ / Größe / crème', budgetCents: 6100, items: [
        { id: 'b082-rice', name: 'Arroz QA', quantityMilli: 750000, unit: 'g', category: 'Despensa',
          note: 'Cantidad sintética para probar envases enteros', checked: false, unitPriceCents: null, priceKind: null },
        { id: 'b082-milk', name: 'Leche QA', quantityMilli: 1000000, unit: 'ml', category: 'Lácteos y huevos',
          note: 'No inferir equivalencia del nombre', checked: false, unitPriceCents: null, priceKind: null },
        { id: 'b082-checked', name: 'Pan comprado QA', quantityMilli: 2000, unit: 'ud', category: 'Panadería',
          note: 'Debe quedar fuera de esta revisión', checked: true, unitPriceCents: 235, priceKind: 'entered' },
      ],
    }] } }, null, 2),
    [keys.menus]: JSON.stringify({ version: 1, plan: { servings: 2, recipeIds: [
      'arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate',
    ] } }, null, 2),
    [keys.comparisons]: JSON.stringify({ version: 1, comparisons: [{ id: 'b082-comparison', name: 'QA conservar', offers: [] }] }),
    [keys.observations]: JSON.stringify({ version: 1, observations: [
      observation('b082-rice-500g'),
      observation('b082-milk-1L', { product: 'Leche QA', format: 'Brik QA', quantityMilli: 1000, unit: 'L', priceCents: 120 }),
      observation('b082-demo', { sourceKind: 'demo', priceCents: 1 }),
      observation('b082-unknown', { sourceKind: 'unknown', priceCents: null }),
      observation('b082-stale', { observedOn: '2026-11-01', priceCents: 1 }),
    ] }, null, 2),
    [keys.expenses]: JSON.stringify({ version: 1, data: { expenses: [{
      id: 'b082-expense', amountCents: 1234, date: '2026-11-24', store: 'Comercio ficticio QA',
      note: 'Gasto sintético conservado', listId: 'b082-qa-list', listName: 'QA cesta · ñ / Größe / crème', source: 'user-confirmed',
    }] } }),
    [keys.settings]: JSON.stringify({ version: 1, preferences: { favoriteStores: ['mercadona'], inAppReminders: true } }, null, 2),
    [keys.preferences]: JSON.stringify({ version: 1, language, welcomeCompleted: true }),
  };
}

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(names => {
    const probe = window as unknown as Probe;
    return Object.fromEntries(names.map(name => [name, probe.b082RawGet ? probe.b082RawGet(name) : localStorage.getItem(name)]));
  }, businessKeys);
}
async function unchanged(page: Page, before: Snapshot) {
  expect(await snapshot(page)).toEqual(before);
  expect(await page.evaluate(() => (window as unknown as Probe).b082Writes)).toEqual([]);
}
async function begin(page: Page, language: Language) {
  await page.clock.install({ time: new Date('2026-11-27T12:00:00.000Z') });
  // A protected URL can contain a credential. It is navigation input only.
  try { await page.goto(process.env.JJ_MANUAL_BASKET_SHARE_URL ?? '/'); }
  catch { throw new Error('Manual basket navigation failed; protected URL omitted.'); }
  await expect(page.getByTestId('welcome-title')).toBeVisible();
  expect(Object.values(await snapshot(page))).toEqual(Array(businessKeys.length).fill(null));
  const data = fixtures(language);
  // Seed once, after proving an empty context. The reload never recreates fixtures.
  await page.evaluate(entries => {
    for (const [key, raw] of Object.entries(entries)) localStorage.setItem(key, raw);
  }, data);
  await page.addInitScript(() => {
    const probe = window as unknown as Probe;
    probe.b082Writes = []; probe.b082FailRead = null; probe.b082FailedReads = 0;
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
    const remove = Storage.prototype.removeItem, clear = Storage.prototype.clear;
    probe.b082RawGet = key => get.call(localStorage, key);
    // Explicit external-document edits bypass the app-write ledger.
    probe.b082ExternalSet = (key, value) => set.call(localStorage, key, value);
    Storage.prototype.getItem = function (key) {
      if (this === localStorage && key === probe.b082FailRead) {
        probe.b082FailRead = null; probe.b082FailedReads++;
        throw new Error('Synthetic QA storage read failure');
      }
      return get.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (this === localStorage) probe.b082Writes.push({ key, operation: 'setItem' });
      return set.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key) {
      if (this === localStorage) probe.b082Writes.push({ key, operation: 'removeItem' });
      return remove.call(this, key);
    };
    Storage.prototype.clear = function () {
      if (this === localStorage) probe.b082Writes.push({ key: '*', operation: 'clear' });
      return clear.call(this);
    };
  });
  await page.reload();
  await expect(page.getByTestId('open-profile')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', language);
  await unchanged(page, data);
  const t = createTranslator(language, resources);
  await page.getByRole('tab', { name: t('app.tabSavings'), exact: true }).click();
  await page.getByTestId('open-price-pilot').click();
  await expect(page.getByTestId('basket-open')).toBeEnabled();
  await page.evaluate(() => document.fonts.ready);
  const errors: string[] = [], requests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    const url = new URL(request.url());
    if (/^https?:$/.test(url.protocol)) requests.push(`${request.method()} ${url.origin} ${request.resourceType()}`);
  });
  await page.getByTestId('basket-open').click();
  await expect(page.getByTestId('basket-binding-0')).toBeVisible();
  return { before: data, t, ...createFormatters(language), errors, requests };
}
async function check(page: Page, id: string) {
  const control = page.getByTestId(id);
  if (await control.getAttribute('aria-checked') !== 'true') await control.click();
  await expect(control).toHaveAttribute('aria-checked', 'true');
}
async function target(page: Page, fees: string = '1', minimum: string = '0') {
  await page.getByTestId('basket-store').fill('Comercio ficticio QA');
  await page.getByTestId('basket-format-mercadona').click();
  await page.getByTestId('basket-channel-physical').click();
  await page.getByTestId('basket-postal').fill('38107');
  await page.getByTestId('basket-fees').fill(fees);
  await page.getByTestId('basket-minimum').fill(minimum);
}
async function bind(page: Page, line: 0 | 1, observation: number) {
  await page.getByTestId(`basket-binding-${line}`).click();
  await page.getByTestId(`basket-observation-${observation}`).click();
  await check(page, `basket-confirm-${line}`);
}
async function ready(page: Page, fees = '1', minimum = '0') {
  await target(page, fees, minimum);
  await bind(page, 0, 0); await bind(page, 1, 1); await check(page, 'basket-distinct');
}
async function reopen(page: Page) {
  await page.getByTestId('basket-back').click();
  await page.getByTestId('basket-open').click();
  await expect(page.getByTestId('basket-binding-0')).toBeVisible();
}
async function calculate(page: Page) {
  await page.getByTestId('basket-calculate').click();
  await expect(page.getByTestId('basket-result')).toBeVisible();
}
async function externalEdit(page: Page, key: string, raw: string, signal?: 'storage' | 'focus') {
  await page.evaluate(({ key, raw, signal }) => {
    const probe = window as unknown as Probe, oldValue = probe.b082RawGet(key);
    probe.b082ExternalSet(key, raw);
    if (signal === 'storage') window.dispatchEvent(new StorageEvent('storage', { key, oldValue, newValue: raw, storageArea: localStorage }));
    if (signal === 'focus') window.dispatchEvent(new Event('focus'));
  }, { key, raw, signal });
}

/** Scroll RN's actual ScrollView, checking every captured segment and critical 44px targets. */
async function capture(page: Page, info: TestInfo, name: string, controls: Locator[] = []) {
  await page.evaluate(() => document.fonts.ready);
  for (const control of controls) {
    await control.scrollIntoViewIfNeeded();
    const box = await control.boundingBox();
    expect(box, name + ': target rendered').not.toBeNull();
    expect(box!.width, name + ': target width').toBeGreaterThanOrEqual(44);
    expect(box!.height, name + ': target height').toBeGreaterThanOrEqual(44);
  }
  const scroll = await page.locator('body').evaluateHandle(root => [...root.querySelectorAll<HTMLElement>('*')]
    .filter(element => {
      const box = element.getBoundingClientRect();
      return box.width >= 200 && box.height >= 100 && /auto|scroll/.test(getComputedStyle(element).overflowY)
        && element.scrollHeight > element.clientHeight + 1;
    }).sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight))[0] ?? null);
  const metrics = await scroll.evaluate(element => element ? { original: element.scrollTop, height: element.clientHeight,
    total: element.scrollHeight } : { original: 0, height: 0, total: 0 });
  const last = Math.max(0, metrics.total - metrics.height), step = Math.max(1, Math.floor(metrics.height * .8));
  const positions = metrics.height ? [...new Set([...Array.from({ length: Math.ceil(last / step) }, (_, i) => i * step), last])] : [0];
  const health: unknown[] = [];
  for (const [index, top] of positions.entries()) {
    await scroll.evaluate((element, value) => { if (element) element.scrollTop = value; }, top);
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const current = await page.locator('body').evaluate((root, prefixes) => {
      const width = document.documentElement.clientWidth;
      const rawKeys = [...new Set(((root as HTMLElement).innerText.match(/\b[a-zA-Z][\w-]*\.[a-zA-Z][\w.-]*/g) ?? [])
        .filter(key => prefixes.includes(key.split('.')[0])))];
      const outside: string[] = [], clipped: string[] = [];
      for (const element of root.querySelectorAll<HTMLElement>('*')) {
        if (/^(SCRIPT|STYLE|SVG|PATH|INPUT|TEXTAREA)$/.test(element.tagName)) continue;
        const style = getComputedStyle(element), box = element.getBoundingClientRect();
        if (style.visibility === 'hidden' || style.display === 'none' || box.width < 1 || box.height < 1) continue;
        for (const node of [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())) {
          const range = document.createRange(); range.selectNodeContents(node);
          for (const rect of range.getClientRects()) {
            if (rect.width < 1 || rect.height < 1 || rect.bottom <= 0 || rect.top >= innerHeight) continue;
            if (rect.left < -2 || rect.right > width + 2) outside.push(node.textContent!.trim().slice(0, 100));
            let parent: HTMLElement | null = element;
            while (parent && parent !== root) {
              const parentStyle = getComputedStyle(parent), bounds = parent.getBoundingClientRect();
              if (/auto|scroll/.test(parentStyle.overflowY)) break;
              if ((/hidden|clip/.test(parentStyle.overflowX) && (rect.left < bounds.left - 2 || rect.right > bounds.right + 2)) ||
                  (/hidden|clip/.test(parentStyle.overflowY) && (rect.top < bounds.top - 2 || rect.bottom > bounds.bottom + 2))) {
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
    await info.attach(`${name}-segment-${index + 1}`, { path: filename, contentType: 'image/png' });
  }
  await scroll.evaluate((element, top) => { if (element) element.scrollTop = top; }, metrics.original);
  await scroll.dispose();
  await info.attach(name + '-geometry', { body: Buffer.from(JSON.stringify({ viewport: page.viewportSize(), scroll: metrics,
    positions, health, physicalIPhone: false, nativeAppValidated: false }, null, 2)), contentType: 'application/json' });
}

for (const language of ['es', 'en', 'de', 'fr'] as const satisfies readonly Language[]) test.describe(language, () => {
  test('A · explicit offline manual basket quotes whole packs and preserves all seven documents', async ({ page }, info) => {
    const { before, t, formatMoney, errors, requests } = await begin(page, language);
    await expect(page.getByTestId('basket-binding-2')).toHaveCount(0); // Purchased bread is excluded.
    await expect(page.getByTestId('basket-store')).toHaveValue('');
    await page.getByTestId('basket-calculate').click();
    await expect(page.getByTestId('basket-error')).toContainText(t('basket.error.invalidTarget'));
    await expect(page.getByTestId('basket-result')).toHaveCount(0);
    await page.context().setOffline(true);
    await target(page);
    await page.getByTestId('basket-binding-0').click();
    for (const excluded of [2, 3]) await expect(page.getByTestId(`basket-observation-${excluded}`)).toHaveCount(0);
    await expect(page.getByTestId('basket-observation-4')).toBeVisible();
    await expect(page.getByTestId('basket-observation-0')).toContainText('Contribución sintética QA');
    await capture(page, info, 'A-explicit-selection', [page.getByTestId('basket-observation-0')]);
    await page.getByTestId('basket-observation-0').click();
    await check(page, 'basket-confirm-0');
    await bind(page, 1, 1); await check(page, 'basket-distinct');
    await calculate(page);
    // Fixed independent arithmetic: 750g requires two 500g packs; milk requires one litre.
    await expect(page.getByTestId('basket-packs-0')).toContainText('2');
    await expect(page.getByTestId('basket-outlay-0')).toContainText(formatMoney(500));
    await expect(page.getByTestId('basket-consumed-0')).toContainText(formatMoney(375));
    await expect(page.getByTestId('basket-leftover-0')).toContainText('250 g');
    await expect(page.getByTestId('basket-packs-1')).toContainText('1');
    await expect(page.getByTestId('basket-outlay-1')).toContainText(formatMoney(120));
    await expect(page.getByTestId('basket-known-subtotal')).toContainText(formatMoney(620));
    await expect(page.getByTestId('basket-coverage')).toContainText(t('basket.coverage', { priced: '2', total: '2' }));
    await expect(page.getByTestId('basket-goods-outlay')).toContainText(formatMoney(620));
    await expect(page.getByTestId('basket-payable')).toContainText(formatMoney(720));
    await expect(page.getByTestId('basket-no-total')).toHaveCount(0);
    await capture(page, info, 'A-complete-offline', [page.getByTestId('basket-calculate'), page.getByTestId('basket-back')]);
    await unchanged(page, before); expect(errors).toEqual([]); expect(requests).toEqual([]);
    await page.context().setOffline(false);
  });

  test('B · partial coverage, unknown costs, explicit zero and target changes stay distinct', async ({ page }, info) => {
    const { before, t, formatMoney, errors, requests } = await begin(page, language);
    await target(page, '', ''); await bind(page, 0, 0); await check(page, 'basket-distinct');
    await calculate(page);
    await expect(page.getByTestId('basket-known-subtotal')).toContainText(formatMoney(500));
    await expect(page.getByTestId('basket-coverage')).toContainText(t('basket.coverage', { priced: '1', total: '2' }));
    await expect(page.getByTestId('basket-no-total')).toBeVisible();
    await expect(page.getByTestId('basket-payable')).toHaveCount(0);
    await expect(page.getByTestId('basket-issue-incomplete-coverage')).toBeVisible();
    await expect(page.getByTestId('basket-issue-fees-unknown')).toBeVisible();
    await expect(page.getByTestId('basket-issue-minimum-unknown')).toBeVisible();
    await capture(page, info, 'B-partial-unknown', [page.getByTestId('basket-calculate')]);
    await bind(page, 0, 4); await check(page, 'basket-distinct'); await calculate(page);
    await expect(page.getByTestId('basket-line-0')).toContainText(t('basket.reason.stale'));
    await expect(page.getByTestId('basket-known-subtotal')).toContainText(formatMoney(0));
    await expect(page.getByTestId('basket-payable')).toHaveCount(0);
    await bind(page, 0, 0); await bind(page, 1, 1); await check(page, 'basket-distinct'); await calculate(page);
    await expect(page.getByTestId('basket-known-subtotal')).toContainText(formatMoney(620));
    await expect(page.getByTestId('basket-goods-outlay')).toContainText(formatMoney(620));
    await expect(page.getByTestId('basket-payable')).toHaveCount(0);
    await page.getByTestId('basket-fees').fill('0'); await calculate(page);
    await expect(page.getByTestId('basket-payable')).toHaveCount(0);
    await expect(page.getByTestId('basket-issue-fees-unknown')).toHaveCount(0);
    await expect(page.getByTestId('basket-issue-minimum-unknown')).toBeVisible();
    await page.getByTestId('basket-minimum').fill('0');
    await calculate(page);
    await expect(page.getByTestId('basket-payable')).toContainText(formatMoney(620));
    await expect(page.getByTestId('basket-issue-fees-unknown')).toHaveCount(0);
    await expect(page.getByTestId('basket-issue-minimum-unknown')).toHaveCount(0);
    await page.getByTestId('basket-store').fill('Otro comercio ficticio QA');
    await expect(page.getByTestId('basket-result')).toHaveCount(0);
    for (const id of ['basket-confirm-0', 'basket-confirm-1', 'basket-distinct'])
      await expect(page.getByTestId(id)).toHaveAttribute('aria-checked', 'false');
    await page.getByTestId('basket-calculate').click();
    await expect(page.getByTestId('basket-error')).toContainText(t('basket.error.distinctProducts'));
    await expect(page.getByTestId('basket-result')).toHaveCount(0);
    await capture(page, info, 'B-target-review-revoked', [page.getByTestId('basket-confirm-0')]);
    await reopen(page);
    for (const id of ['basket-store', 'basket-postal', 'basket-fees', 'basket-minimum']) await expect(page.getByTestId(id)).toHaveValue('');
    await expect(page.getByTestId('basket-confirm-0')).toHaveCount(0);
    await expect(page.getByTestId('basket-confirm-1')).toHaveCount(0);
    await expect(page.getByTestId('basket-result')).toHaveCount(0);
    await unchanged(page, before); expect(errors).toEqual([]); expect(requests).toEqual([]);
  });

  test('C · failed fresh reads and externally changed documents invalidate the review without writes', async ({ page }, info) => {
    const { before, t, errors, requests } = await begin(page, language);
    await ready(page);
    await page.evaluate(key => { (window as unknown as Probe).b082FailRead = key; }, keys.observations);
    await page.getByTestId('basket-calculate').click();
    await expect(page.getByTestId('basket-error')).toContainText(t('basket.freshnessFailed'));
    await expect(page.getByTestId('basket-result')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as Probe).b082FailedReads)).toBe(1);
    await unchanged(page, before);
    await capture(page, info, 'C-read-failure-closed', [page.getByTestId('basket-back')]);
    await reopen(page); await ready(page);
    const shoppingChanged = JSON.parse(before[keys.shopping]!);
    shoppingChanged.state.lists[0].items[0].quantityMilli = 1000000;
    // No event: Calculate itself must reread both durable documents.
    await externalEdit(page, keys.shopping, JSON.stringify(shoppingChanged));
    await page.getByTestId('basket-calculate').click();
    await expect(page.getByTestId('basket-error')).toContainText(t('basket.freshnessFailed'));
    await expect(page.getByTestId('basket-result')).toHaveCount(0);
    await externalEdit(page, keys.shopping, before[keys.shopping]!);
    const observationsChanged = JSON.parse(before[keys.observations]!);
    observationsChanged.observations[0].priceCents = 999;
    await reopen(page); await ready(page);
    await externalEdit(page, keys.observations, JSON.stringify(observationsChanged));
    await page.getByTestId('basket-calculate').click();
    await expect(page.getByTestId('basket-error')).toContainText(t('basket.freshnessFailed'));
    await expect(page.getByTestId('basket-result')).toHaveCount(0);
    await externalEdit(page, keys.observations, before[keys.observations]!);
    await reopen(page); await ready(page); await calculate(page);
    await externalEdit(page, keys.observations, JSON.stringify(observationsChanged), 'storage');
    await expect(page.getByTestId('basket-stale')).toBeVisible();
    await expect(page.getByTestId('basket-result')).toHaveCount(0);
    await expect(page.getByTestId('basket-confirm-0')).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByTestId('basket-distinct')).toHaveAttribute('aria-checked', 'false');
    await capture(page, info, 'C-storage-invalidation', [page.getByTestId('basket-back')]);
    await externalEdit(page, keys.observations, before[keys.observations]!);
    await reopen(page); await ready(page); await calculate(page);
    await externalEdit(page, keys.shopping, JSON.stringify(shoppingChanged), 'focus');
    await expect(page.getByTestId('basket-stale')).toBeVisible();
    await expect(page.getByTestId('basket-result')).toHaveCount(0);
    await expect(page.getByTestId('basket-confirm-0')).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByTestId('basket-distinct')).toHaveAttribute('aria-checked', 'false');
    await externalEdit(page, keys.shopping, before[keys.shopping]!);
    // Restore only deliberate external QA edits; the app must never write any document.
    await unchanged(page, before); expect(errors).toEqual([]); expect(requests).toEqual([]);
  });
});
