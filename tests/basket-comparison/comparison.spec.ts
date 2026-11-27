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
  b083Writes: { key: string; operation: string }[];
  b083RawGet: (key: string) => string | null;
  b083ExternalSet: (key: string, value: string) => void;
  b083FailRead: string | null;
  b083FailedReads: number;
};

/** Synthetic, isolated QA contributions. These are never commercial or verified prices. */
function fixtures(language: Language): Record<string, string> {
  const observation = (id: string, overrides: Record<string, unknown> = {}) => ({
    id, product: 'Arroz QA', brand: 'Marca ficticia QA', format: 'Bolsa QA', quality: 'Prueba aislada QA',
    store: 'Comercio A ficticio QA', quantityMilli: 500000, unit: 'g', priceCents: 250,
    observedOn: '2026-11-26', sourceKind: 'manual',
    sourceReference: 'Contribución sintética QA; no es un precio comercial verificado', url: null,
    ...overrides,
  });
  return {
    [keys.shopping]: JSON.stringify({ version: 1, state: { activeListId: 'b083-qa-list', lists: [{
      id: 'b083-qa-list', name: 'QA cesta · ñ / Größe / crème', budgetCents: 6100, items: [
        { id: 'b083-rice', name: 'Arroz QA', quantityMilli: 750000, unit: 'g', category: 'Despensa',
          note: 'Cantidad sintética para probar envases enteros', checked: false, unitPriceCents: null, priceKind: null },
        { id: 'b083-milk', name: 'Leche QA', quantityMilli: 1000000, unit: 'ml', category: 'Lácteos y huevos',
          note: 'No inferir equivalencia del nombre', checked: false, unitPriceCents: null, priceKind: null },
        { id: 'b083-checked', name: 'Pan comprado QA', quantityMilli: 2000, unit: 'ud', category: 'Panadería',
          note: 'Debe quedar fuera de esta revisión', checked: true, unitPriceCents: 235, priceKind: 'entered' },
      ],
    }] } }, null, 2),
    [keys.menus]: JSON.stringify({ version: 1, plan: { servings: 2, recipeIds: [
      'arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate',
    ] } }, null, 2),
    [keys.comparisons]: JSON.stringify({ version: 1, comparisons: [{ id: 'b083-comparison', name: 'QA conservar', offers: [] }] }),
    [keys.observations]: JSON.stringify({ version: 1, observations: [
      observation('b083-rice-500g'),
      observation('b083-milk-1L', { product: 'Leche QA', format: 'Brik QA', quantityMilli: 1000, unit: 'L', priceCents: 120 }),
      observation('b083-rice-B-1kg', { store: 'Comercio B ficticio QA', quantityMilli: 1000, unit: 'kg', priceCents: 400 }),
      observation('b083-milk-B-1L', { store: 'Comercio B ficticio QA', product: 'Leche QA', format: 'Brik QA', quantityMilli: 1000, unit: 'L', priceCents: 150 }),
    ] }, null, 2),
    [keys.expenses]: JSON.stringify({ version: 1, data: { expenses: [{
      id: 'b083-expense', amountCents: 1234, date: '2026-11-24', store: 'Comercio A ficticio QA',
      note: 'Gasto sintético conservado', listId: 'b083-qa-list', listName: 'QA cesta · ñ / Größe / crème', source: 'user-confirmed',
    }] } }),
    [keys.settings]: JSON.stringify({ version: 1, preferences: { favoriteStores: ['mercadona'], inAppReminders: true } }, null, 2),
    [keys.preferences]: JSON.stringify({ version: 1, language, welcomeCompleted: true }),
  };
}

async function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(names => {
    const probe = window as unknown as Probe;
    return Object.fromEntries(names.map(name => [name, probe.b083RawGet ? probe.b083RawGet(name) : localStorage.getItem(name)]));
  }, businessKeys);
}
async function unchanged(page: Page, before: Snapshot) {
  expect(await snapshot(page)).toEqual(before);
  expect(await page.evaluate(() => (window as unknown as Probe).b083Writes)).toEqual([]);
}
async function begin(page: Page, language: Language) {
  await page.clock.install({ time: new Date('2026-11-27T12:00:00.000Z') });
  // A protected URL can contain a credential. It is navigation input only.
  try { await page.goto(process.env.JJ_BASKET_COMPARISON_SHARE_URL ?? '/'); }
  catch { throw new Error('Basket comparison navigation failed; protected URL omitted.'); }
  await expect(page.getByTestId('welcome-title')).toBeVisible();
  expect(Object.values(await snapshot(page))).toEqual(Array(businessKeys.length).fill(null));
  const data = fixtures(language);
  // Seed once, after proving an empty context. The reload never recreates fixtures.
  await page.evaluate(entries => {
    for (const [key, raw] of Object.entries(entries)) localStorage.setItem(key, raw);
  }, data);
  await page.addInitScript(() => {
    const probe = window as unknown as Probe;
    probe.b083Writes = []; probe.b083FailRead = null; probe.b083FailedReads = 0;
    const get = Storage.prototype.getItem, set = Storage.prototype.setItem;
    const remove = Storage.prototype.removeItem, clear = Storage.prototype.clear;
    probe.b083RawGet = key => get.call(localStorage, key);
    // Explicit external-document edits bypass the app-write ledger.
    probe.b083ExternalSet = (key, value) => set.call(localStorage, key, value);
    Storage.prototype.getItem = function (key) {
      if (this === localStorage && key === probe.b083FailRead) {
        probe.b083FailRead = null; probe.b083FailedReads++;
        throw new Error('Synthetic QA storage read failure');
      }
      return get.call(this, key);
    };
    Storage.prototype.setItem = function (key, value) {
      if (this === localStorage) probe.b083Writes.push({ key, operation: 'setItem' });
      return set.call(this, key, value);
    };
    Storage.prototype.removeItem = function (key) {
      if (this === localStorage) probe.b083Writes.push({ key, operation: 'removeItem' });
      return remove.call(this, key);
    };
    Storage.prototype.clear = function () {
      if (this === localStorage) probe.b083Writes.push({ key: '*', operation: 'clear' });
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
async function target(page: Page, second = false, fees = second ? '0' : '1', minimum = '0') {
  await page.getByTestId('basket-store').fill(second ? 'Comercio B ficticio QA' : 'Comercio A ficticio QA');
  await page.getByTestId('basket-format-mercadona').click();
  await page.getByTestId('basket-channel-physical').click();
  await page.getByTestId('basket-postal').fill(second ? '38203' : '38107');
  await page.getByTestId('basket-fees').fill(fees);
  await page.getByTestId('basket-minimum').fill(minimum);
}
async function bind(page: Page, line: 0 | 1, observation: number) {
  await page.getByTestId(`basket-binding-${line}`).click();
  await page.getByTestId(`basket-observation-${observation}`).click();
  await check(page, `basket-confirm-${line}`);
}
async function ready(page: Page, second = false, fees = second ? '0' : '1', minimum = '0') {
  await target(page, second, fees, minimum);
  await bind(page, 0, second ? 2 : 0); await bind(page, 1, second ? 3 : 1);
  await check(page, 'basket-distinct');
}
async function retained(page: Page) {
  await ready(page); await calculate(page); await page.getByTestId('basket-retain').click();
  await expect(page.getByTestId('basket-retained')).toBeVisible();
  await expect(page.getByTestId('basket-result')).toHaveCount(0);
}
async function pair(page: Page) {
  await retained(page); await ready(page, true); await calculate(page);
  await expect(page.getByTestId('basket-comparison')).toBeVisible();
}
async function attest(page: Page) {
  await check(page, 'basket-cross-confirm-0'); await check(page, 'basket-cross-confirm-1');
  await check(page, 'basket-stores-confirm');
}
async function compare(page: Page) {
  await page.getByTestId('basket-compare').click();
  await expect(page.getByTestId('basket-comparison-result')).toBeVisible();
}
async function noDifference(page: Page) {
  await expect(page.getByTestId('basket-comparison-difference')).toHaveCount(0);
}
async function cleared(page: Page) {
  for (const id of ['basket-retained', 'basket-result', 'basket-comparison', 'basket-comparison-result', 'basket-comparison-difference'])
    await expect(page.getByTestId(id)).toHaveCount(0);
}
async function reconfirm(page: Page) {
  await check(page, 'basket-confirm-0'); await check(page, 'basket-confirm-1'); await check(page, 'basket-distinct');
}
async function reopen(page: Page) {
  await page.getByTestId('basket-back').click();
  await page.getByTestId('basket-open').click();
  await expect(page.getByTestId('basket-binding-0')).toBeVisible();
}
async function calculate(page: Page) {
  await page.getByTestId('basket-calculate').click();
  await expect(page.getByTestId('basket-result')).toBeVisible();
  if (await page.getByTestId('basket-comparison').count()) {
    for (const id of ['basket-cross-confirm-0', 'basket-cross-confirm-1', 'basket-stores-confirm'])
      await expect(page.getByTestId(id)).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByTestId('basket-comparison-result')).toHaveCount(0);
  }
}
async function externalEdit(page: Page, key: string, raw: string, signal?: 'storage' | 'focus') {
  await page.evaluate(({ key, raw, signal }) => {
    const probe = window as unknown as Probe, oldValue = probe.b083RawGet(key);
    probe.b083ExternalSet(key, raw);
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
  test('A · two independent offline reviews require explicit equivalence and preserve seven documents', async ({ page }, info) => {
    const { before, t, formatMoney, errors, requests } = await begin(page, language);
    await expect(page.getByTestId('basket-binding-2')).toHaveCount(0);
    await page.context().setOffline(true);
    await capture(page, info, 'A-empty-review', [page.getByTestId('basket-store'), page.getByTestId('basket-calculate')]);
    await ready(page); await calculate(page);
    // Independent fixed arithmetic: two 500g rice packs plus one litre of milk, then 100c fees.
    await expect(page.getByTestId('basket-outlay-0')).toContainText(formatMoney(500));
    await expect(page.getByTestId('basket-consumed-0')).toContainText(formatMoney(375));
    await expect(page.getByTestId('basket-leftover-0')).toContainText('250 g');
    await expect(page.getByTestId('basket-payable')).toContainText(formatMoney(720));
    await capture(page, info, 'A-first-quote', [page.getByTestId('basket-retain')]);
    await page.getByTestId('basket-retain').click();
    await expect(page.getByTestId('basket-retained')).toContainText('Comercio A ficticio QA');
    await expect(page.getByTestId('basket-result')).toHaveCount(0);
    for (const id of ['basket-store', 'basket-postal', 'basket-fees', 'basket-minimum'])
      await expect(page.getByTestId(id)).toHaveValue('');
    await expect(page.getByTestId('basket-confirm-0')).toHaveCount(0);
    await capture(page, info, 'A-retained-in-memory', [page.getByTestId('basket-discard-retained')]);
    await target(page, true);
    await page.getByTestId('basket-binding-0').click();
    for (const firstObservation of [0, 1]) await expect(page.getByTestId(`basket-observation-${firstObservation}`)).toBeDisabled();
    await expect(page.getByTestId('basket-observation-2')).toContainText('Contribución sintética QA');
    await capture(page, info, 'A-independent-source-selector', [page.getByTestId('basket-observation-2')]);
    await page.getByTestId('basket-observation-2').click(); await check(page, 'basket-confirm-0');
    await bind(page, 1, 3); await check(page, 'basket-distinct'); await calculate(page);
    await expect(page.getByTestId('basket-payable')).toContainText(formatMoney(550));
    await expect(page.getByTestId('basket-comparison')).toBeVisible();
    for (const id of ['basket-cross-confirm-0', 'basket-cross-confirm-1', 'basket-stores-confirm'])
      await expect(page.getByTestId(id)).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByTestId('basket-comparison-result')).toHaveCount(0);
    await capture(page, info, 'A-cross-review-unconfirmed', [page.getByTestId('basket-cross-confirm-0'), page.getByTestId('basket-compare')]);
    await compare(page);
    await expect(page.getByTestId('basket-comparison-outcome')).toHaveText(t('comp.outcome.not-comparable'));
    await expect(page.getByTestId('basket-comparison-reason-equivalence-unreviewed')).toBeVisible();
    await expect(page.getByTestId('basket-comparison-reason-stores-unreviewed')).toBeVisible();
    await noDifference(page);
    await capture(page, info, 'A-no-cross-review-no-difference', [page.getByTestId('basket-compare')]);
    await check(page, 'basket-cross-confirm-0'); await check(page, 'basket-stores-confirm'); await compare(page);
    await expect(page.getByTestId('basket-comparison-outcome')).toHaveText(t('comp.outcome.not-comparable'));
    await noDifference(page); // Reviewing one line cannot attest to the other line.
    await capture(page, info, 'A-one-cross-review-still-blocked', [page.getByTestId('basket-cross-confirm-1')]);
    await check(page, 'basket-cross-confirm-1'); await compare(page);
    for (const side of ['first', 'second'])
      await expect(page.getByTestId(`basket-comparison-${side}-coverage`)).toContainText(t('basket.coverage', { priced: '2', total: '2' }));
    await expect(page.getByTestId('basket-comparison-first-known-subtotal')).toContainText(formatMoney(620));
    await expect(page.getByTestId('basket-comparison-first-payable')).toContainText(formatMoney(720));
    await expect(page.getByTestId('basket-comparison-first-packs-0')).toContainText('2');
    await expect(page.getByTestId('basket-comparison-first-outlay-0')).toContainText(formatMoney(500));
    await expect(page.getByTestId('basket-comparison-first-consumed-0')).toContainText(formatMoney(375));
    await expect(page.getByTestId('basket-comparison-first-leftover-0')).toContainText('250 g');
    await expect(page.getByTestId('basket-comparison-first-outlay-1')).toContainText(formatMoney(120));
    await expect(page.getByTestId('basket-comparison-second-known-subtotal')).toContainText(formatMoney(550));
    await expect(page.getByTestId('basket-comparison-second-payable')).toContainText(formatMoney(550));
    await expect(page.getByTestId('basket-comparison-second-packs-0')).toContainText('1');
    await expect(page.getByTestId('basket-comparison-second-outlay-0')).toContainText(formatMoney(400));
    await expect(page.getByTestId('basket-comparison-second-consumed-0')).toContainText(formatMoney(300));
    await expect(page.getByTestId('basket-comparison-second-leftover-0')).toContainText('250 g');
    await expect(page.getByTestId('basket-comparison-second-outlay-1')).toContainText(formatMoney(150));
    await expect(page.getByTestId('basket-comparison-outcome')).toHaveText(t('comp.outcome.second-lower'));
    await expect(page.getByTestId('basket-comparison-difference')).toHaveText(t('comp.difference', { price: formatMoney(170) }));
    await expect(page.getByTestId('basket-comparison')).toContainText(t('basket.manualBadge'));
    await expect(page.getByTestId('basket-comparison')).toContainText(t('comp.disclaimer'));
    await capture(page, info, 'A-complete-offline-comparison', [page.getByTestId('basket-cross-confirm-1'), page.getByTestId('basket-stores-confirm'), page.getByTestId('basket-compare'), page.getByTestId('basket-back')]);
    await unchanged(page, before); expect(errors).toEqual([]); expect(requests).toEqual([]);
    await page.context().setOffline(false);
  });

  test('B · missing coverage and unknown costs never win; zero, tie and destination scope remain explicit', async ({ page }, info) => {
    const { before, t, formatMoney, errors, requests } = await begin(page, language);
    await retained(page); await target(page, true, '', ''); await bind(page, 0, 2);
    await check(page, 'basket-distinct'); await calculate(page);
    await check(page, 'basket-cross-confirm-0'); await check(page, 'basket-stores-confirm');
    await expect(page.getByTestId('basket-cross-confirm-1')).toBeDisabled();
    await compare(page);
    await expect(page.getByTestId('basket-comparison-second-known-subtotal')).toContainText(formatMoney(400));
    await expect(page.getByTestId('basket-comparison-second-no-total')).toBeVisible();
    await expect(page.getByTestId('basket-comparison-outcome')).toHaveText(t('comp.outcome.not-comparable'));
    await expect(page.getByTestId('basket-comparison-reason-second-not-qualified')).toBeVisible();
    await noDifference(page);
    await capture(page, info, 'B-partial-never-wins', [page.getByTestId('basket-compare')]);
    await bind(page, 1, 3); await check(page, 'basket-distinct'); await calculate(page); await attest(page); await compare(page);
    await expect(page.getByTestId('basket-issue-fees-unknown')).toBeVisible();
    await expect(page.getByTestId('basket-issue-minimum-unknown')).toBeVisible();
    await expect(page.getByTestId('basket-comparison-outcome')).toHaveText(t('comp.outcome.not-comparable')); await noDifference(page);
    await capture(page, info, 'B-complete-unknown-costs', [page.getByTestId('basket-fees'), page.getByTestId('basket-minimum')]);
    await page.getByTestId('basket-fees').fill('0'); await calculate(page); await attest(page); await compare(page);
    await expect(page.getByTestId('basket-issue-fees-unknown')).toHaveCount(0);
    await expect(page.getByTestId('basket-issue-minimum-unknown')).toBeVisible(); await noDifference(page);
    await capture(page, info, 'B-minimum-still-unknown', [page.getByTestId('basket-minimum')]);
    await page.getByTestId('basket-minimum').fill('0'); await calculate(page); await attest(page); await compare(page);
    await expect(page.getByTestId('basket-comparison-outcome')).toHaveText(t('comp.outcome.second-lower'));
    await expect(page.getByTestId('basket-comparison-difference')).toContainText(formatMoney(170));
    await capture(page, info, 'B-explicit-zero-costs', [page.getByTestId('basket-compare')]);
    for (const scenario of [{ fees: '3', total: 850, difference: 130, outcome: 'first-lower' },
      { fees: '1.7', total: 720, difference: 0, outcome: 'tie' }]) {
      await page.getByTestId('basket-fees').fill(scenario.fees); await calculate(page); await attest(page); await compare(page);
      await expect(page.getByTestId('basket-comparison-second-payable')).toContainText(formatMoney(scenario.total));
      await expect(page.getByTestId('basket-comparison-outcome')).toHaveText(t(`comp.outcome.${scenario.outcome}`));
      await expect(page.getByTestId('basket-comparison-difference')).toContainText(formatMoney(scenario.difference));
      await capture(page, info, `B-${scenario.outcome}`, [page.getByTestId('basket-compare')]);
    }
    await page.getByTestId('basket-store').fill('Comercio A ficticio QA');
    await page.getByTestId('basket-postal').fill('38107'); await reconfirm(page); await calculate(page); await attest(page);
    await page.getByTestId('basket-compare').click();
    await expect(page.getByTestId('basket-comparison-error')).toContainText(t('comp.error.sameDestination')); await noDifference(page);
    await capture(page, info, 'B-same-destination-rejected', [page.getByTestId('basket-stores-confirm')]);
    await page.getByTestId('basket-store').fill('Comercio B ficticio QA'); await page.getByTestId('basket-postal').fill('38203');
    await page.getByTestId('basket-channel-online').click(); await reconfirm(page); await calculate(page); await attest(page);
    await page.getByTestId('basket-compare').click();
    await expect(page.getByTestId('basket-comparison-error')).toContainText(t('comp.error.invalidInput')); await noDifference(page);
    await capture(page, info, 'B-different-channel-rejected', [page.getByTestId('basket-channel-online')]);
    // A duplicated source cannot satisfy two independently reviewed needs.
    await bind(page, 1, 2); await check(page, 'basket-distinct'); await page.getByTestId('basket-calculate').click();
    await expect(page.getByTestId('basket-error')).toContainText(t('basket.error.invalidBinding'));
    await expect(page.getByTestId('basket-comparison-result')).toHaveCount(0);
    await capture(page, info, 'B-duplicate-source-rejected', [page.getByTestId('basket-confirm-1')]);
    await unchanged(page, before); expect(errors).toEqual([]); expect(requests).toEqual([]);
  });

  test('C · fresh reads, external edits, resume, day change, discard and back clear retained reviews', async ({ page }, info) => {
    const { before, t, errors, requests } = await begin(page, language);
    await pair(page); await attest(page);
    await page.evaluate(key => { (window as unknown as Probe).b083FailRead = key; }, keys.observations);
    await page.getByTestId('basket-compare').click();
    await expect(page.getByTestId('basket-error')).toContainText(t('basket.freshnessFailed')); await cleared(page);
    expect(await page.evaluate(() => (window as unknown as Probe).b083FailedReads)).toBe(1);
    await capture(page, info, 'C-compare-fresh-read-failure', [page.getByTestId('basket-back')]);
    const shoppingChanged = JSON.parse(before[keys.shopping]!);
    shoppingChanged.state.lists[0].items[0].quantityMilli = 1000000;
    const observationsChanged = JSON.parse(before[keys.observations]!);
    observationsChanged.observations[2].priceCents = 999;
    // No events: Compare itself must reread both durable documents after A was retained.
    for (const [key, changed, name] of [[keys.shopping, shoppingChanged, 'shopping'],
      [keys.observations, observationsChanged, 'observations']] as const) {
      await reopen(page); await pair(page); await attest(page);
      await externalEdit(page, key, JSON.stringify(changed)); await page.getByTestId('basket-compare').click();
      await expect(page.getByTestId('basket-error')).toContainText(t('basket.freshnessFailed')); await cleared(page);
      await capture(page, info, `C-unannounced-${name}-change`, [page.getByTestId('basket-back')]);
      await externalEdit(page, key, before[key]!);
    }
    for (const [key, changed, signal] of [[keys.shopping, shoppingChanged, 'storage'],
      [keys.observations, observationsChanged, 'focus']] as const) {
      await reopen(page); await retained(page); await target(page, true); await bind(page, 0, 2);
      await externalEdit(page, key, JSON.stringify(changed), signal);
      await expect(page.getByTestId('basket-stale')).toBeVisible(); await cleared(page);
      await expect(page.getByTestId('basket-confirm-0')).toHaveAttribute('aria-checked', 'false');
      await expect(page.getByTestId('basket-distinct')).toHaveAttribute('aria-checked', 'false');
      await capture(page, info, `C-${signal}-invalidation`, [page.getByTestId('basket-back')]);
      await externalEdit(page, key, before[key]!);
    }
    await reopen(page); await retained(page); await target(page, true); await bind(page, 0, 2);
    await page.clock.setFixedTime(new Date('2026-11-28T12:00:00.000Z'));
    await page.clock.runFor(30_001);
    await expect(page.getByTestId('basket-stale')).toBeVisible(); await cleared(page);
    await capture(page, info, 'C-day-invalidation', [page.getByTestId('basket-back')]);
    await page.clock.setFixedTime(new Date('2026-11-27T12:00:00.000Z'));
    await reopen(page); await retained(page); await page.getByTestId('basket-discard-retained').click();
    await cleared(page);
    await capture(page, info, 'C-explicit-discard', [page.getByTestId('basket-calculate')]);
    await ready(page); await calculate(page); await page.getByTestId('basket-retain').click(); await reopen(page);
    await cleared(page);
    for (const id of ['basket-store', 'basket-postal', 'basket-fees', 'basket-minimum'])
      await expect(page.getByTestId(id)).toHaveValue('');
    await capture(page, info, 'C-back-resets-memory', [page.getByTestId('basket-back')]);
    // Only deliberate external QA edits were restored; application writes remain forbidden.
    await unchanged(page, before); expect(errors).toEqual([]); expect(requests).toEqual([]);
  });
});

