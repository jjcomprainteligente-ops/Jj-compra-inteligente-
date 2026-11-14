import { expect, test, type Page } from '@playwright/test';
import { createTranslator } from '../../src/i18n/core';
import { resources } from '../../src/i18n/resources';
import type { Language } from '../../src/i18n/types';

const settingsKey = 'jjcompraintelwgiemt.local-settings.v1';
const shoppingKey = 'jjcompraintelwgiemt.shopping.v1';
const ids = ['lidl', 'aldi', 'hiperdino', 'superdino', 'hiperdino-express', 'mercadona'];
const preferencesKey = 'jjcompraintelwgiemt.preferences.v1';
const retainedKeys = [shoppingKey, 'jjcompraintelwgiemt.menus.v1', 'jjcompraintelwgiemt.comparisons.v1',
  'jjcompraintelwgiemt.price-observations.v1', 'jjcompraintelwgiemt.expenses.v1', preferencesKey];
const legacyIds = ['hiperdino', 'carrefour', 'mercadona', 'other'];

async function retainedData(page: Page) {
  return page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), retainedKeys);
}

async function preferences(page: Page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!).preferences as {
    favoriteStores: string[]; inAppReminders: boolean;
  }, settingsKey);
}

/** Seed only this context with legacy preferences, not a migrated or owner profile. */
async function seedLegacy(page: Page, language: Language = 'es') {
  await page.goto('/');
  await page.getByTestId('open-profile').waitFor();
  await page.evaluate(({ settingsKey, shoppingKey, preferencesKey, language, legacyIds }) => {
    localStorage.setItem(settingsKey, JSON.stringify({ version: 1, preferences: {
      favoriteStores: legacyIds, inAppReminders: true,
    } }));
    localStorage.setItem(preferencesKey, JSON.stringify({ version: 1, language, welcomeCompleted: true }));
    localStorage.setItem(shoppingKey, JSON.stringify({ version: 1, state: {
      activeListId: 'store-pilot-list', lists: [{ id: 'store-pilot-list', name: 'Lista aislada QA',
        budgetCents: 4250, items: [] }],
    } }));
  }, { settingsKey, shoppingKey, preferencesKey, language, legacyIds });
  await page.reload();
  await page.getByTestId('open-profile').waitFor();
}

async function savedStores(page: Page): Promise<string[]> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) ?? '{"preferences":{"favoriteStores":[]}}').preferences.favoriteStores, settingsKey);
}
async function openStores(page: Page) {
  await page.getByTestId('open-profile').click();
  await page.getByTestId('profile-stores').click();
  await expect(page.getByTestId('favorite-lidl')).toBeEnabled();
}

test('una, varias y todas las tiendas persisten; cada Dino conserva su identidad y la lista queda intacta', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('open-profile').waitFor();
  const originalShopping = await page.evaluate(key => localStorage.getItem(key), shoppingKey);
  await openStores(page);
  await expect(page.getByTestId('stores-clear')).toBeDisabled();
  await page.getByTestId('favorite-superdino').click();
  await expect.poll(() => savedStores(page)).toEqual(['superdino']);
  await expect(page.getByTestId('store-open-superdino')).toBeVisible();
  await expect(page.getByTestId('store-open-hiperdino')).toHaveCount(0);
  await page.getByTestId('favorite-aldi').click();
  await expect.poll(() => savedStores(page)).toEqual(['superdino', 'aldi']);
  await page.reload();
  await openStores(page);
  await expect(page.getByTestId('favorite-superdino')).toBeChecked();
  await expect(page.getByTestId('favorite-aldi')).toBeChecked();
  await page.getByTestId('stores-select-all').click();
  await expect.poll(() => savedStores(page)).toEqual(ids);
  await expect(page.getByTestId('stores-select-all')).toBeDisabled();
  for (const id of ids) await expect(page.getByTestId(`favorite-${id}`)).toBeChecked();
  await expect(page.getByTestId('stores-selection-summary')).toContainText('6');
  await expect(page.getByTestId('stores-screen')).toContainText('JJ todavía no importa sus precios');
  await expect(page.getByTestId('stores-screen')).toContainText('La compra y el pago se completan siempre en la tienda elegida');
  expect(await page.evaluate(key => localStorage.getItem(key), shoppingKey)).toBe(originalShopping);
  await page.getByTestId('stores-clear').click();
  await expect.poll(() => savedStores(page)).toEqual([]);
  for (const id of ids) await expect(page.getByTestId(`store-open-${id}`)).toHaveCount(0);
});

test('consultar una tienda abre solo su destino público y no envía un carrito ni solicita precios automáticamente', async ({ page }) => {
  const automaticRequests: string[] = [];
  page.on('request', request => {
    const hostname = new URL(request.url()).hostname;
    if (/(^|\.)(lidl\.es|aldi\.es|hiperdino\.es|mercadona\.es|hiperdinoexpress\.com)$/.test(hostname)) automaticRequests.push(request.url());
  });
  await page.addInitScript(() => {
    Object.defineProperty(window, '__storeOpens', { value: [] });
    window.open = ((url?: string | URL, target?: string, features?: string) => {
      (window as unknown as { __storeOpens: { url: string; target?: string; features?: string }[] })
        .__storeOpens.push({ url: String(url), target, features });
      return null;
    }) as typeof window.open;
  });
  await page.goto('/');
  await page.getByTestId('open-profile').waitFor();
  await openStores(page);
  await page.getByTestId('stores-select-all').click();
  await expect(page.getByTestId('stores-select-all')).toBeDisabled();
  const before = await page.evaluate(() => ({ ...localStorage }));
  expect(automaticRequests).toEqual([]);
  for (const id of ids) await page.getByTestId(`store-open-${id}`).click();
  const opened = await page.evaluate(() => (window as unknown as {
    __storeOpens: { url: string; target?: string; features?: string }[];
  }).__storeOpens);
  expect(opened.map(value => value.url)).toEqual([
    'https://www.lidl.es/c/descubre-nuevas-ofertas-cada-semana-folletos-lidl/s10087402',
    'https://www.aldi.es/folleto.html', 'https://www.hiperdino.es/',
    'https://www.hiperdino.es/tiendas/', 'https://hiperdinoexpress.com/tiendas', 'https://www.mercadona.es/',
  ]);
  for (const value of opened) {
    const destination = new URL(value.url);
    expect(destination.protocol).toBe('https:');
    expect(destination.username + destination.password + destination.search + destination.hash).toBe('');
    expect(value.target).toBe('_blank');
    expect(value.features?.split(',')).toContain('noopener');
    expect(value.features?.split(',')).toContain('noreferrer');
  }
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(before);
  expect(automaticRequests).toEqual([]);
});

for (const language of ['es', 'en', 'de', 'fr'] as const) {
  test(`${language}: ampliar favoritas antiguas conserva recordatorios, idioma y los otros datos`, async ({ page }, info) => {
    const t = createTranslator(language, resources);
    await seedLegacy(page, language);
    const retained = await retainedData(page);
    await openStores(page);
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    await expect(page.getByTestId('stores-screen')).toContainText(t('storePilot.chooseHelp'));
    for (const id of legacyIds) await expect(page.getByTestId(`favorite-${id}`)).toBeChecked();
    await page.getByTestId('stores-select-all').click();
    await expect.poll(() => savedStores(page)).toEqual([...ids, 'carrefour', 'other']);
    await expect(page.getByTestId('stores-selection-summary')).toHaveText(t('storePilot.selectedCount', { count: 8 }));
    await expect(page.getByTestId('stores-select-all')).toBeDisabled();
    expect(await preferences(page)).toEqual({ favoriteStores: [...ids, 'carrefour', 'other'], inAppReminders: true });
    expect(await retainedData(page)).toEqual(retained);
    for (const id of ['carrefour', 'other']) await expect(page.getByTestId(`store-open-${id}`)).toHaveCount(0);
    await page.screenshot({ path: info.outputPath(`stores-${language}.png`), fullPage: true });
    await page.getByTestId('stores-screen').getByText(t('storePilot.noCartTransfer'), { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`stores-${language}-end.png`), fullPage: true });
    await page.reload();
    await openStores(page);
    for (const id of [...ids, 'carrefour', 'other']) await expect(page.getByTestId(`favorite-${id}`)).toBeChecked();
    expect(await retainedData(page)).toEqual(retained);
    await page.getByTestId('stores-clear').click();
    await expect.poll(() => preferences(page)).toEqual({ favoriteStores: [], inAppReminders: true });
    await expect(page.getByTestId('stores-selection-summary')).toHaveText(t('storePilot.noSelection'));
    expect(await retainedData(page)).toEqual(retained);
  });
}

test('un fallo de cuota conserva favoritas y recordatorios y permite reintentar sin éxito falso', async ({ page }) => {
  await seedLegacy(page);
  await openStores(page);
  const before = await preferences(page), retained = await retainedData(page);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    (window as unknown as { restorePilotStorage: () => void }).restorePilotStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('QA isolated quota failure', 'QuotaExceededError');
      return original.call(this, name, value);
    };
  }, settingsKey);
  try {
    await page.getByTestId('favorite-lidl').click();
    await expect(page.getByTestId('stores-screen').getByRole('alert')).toBeVisible();
    await expect(page.getByTestId('favorite-lidl')).not.toBeChecked();
    expect(await preferences(page)).toEqual(before);
    expect(await retainedData(page)).toEqual(retained);
  } finally {
    await page.evaluate(() => (window as unknown as { restorePilotStorage: () => void }).restorePilotStorage());
  }
  await page.getByTestId('favorite-lidl').click();
  await expect.poll(() => savedStores(page)).toEqual([...legacyIds, 'lidl']);
  await expect(page.getByTestId('favorite-lidl')).toBeChecked();
  expect((await preferences(page)).inAppReminders).toBe(true);
  expect(await retainedData(page)).toEqual(retained);
});

test('otra pestaña no puede reemplazar una selección más reciente; revisar permite añadir sin perderla', async ({ page, context }) => {
  await seedLegacy(page);
  await openStores(page);
  const retained = await retainedData(page);
  const second = await context.newPage();
  try {
    await second.goto('/');
    await openStores(second);
    await second.getByTestId('favorite-lidl').click();
    await expect.poll(() => savedStores(second)).toEqual([...legacyIds, 'lidl']);
    await page.getByTestId('favorite-aldi').click();
    await expect(page.getByTestId('stores-screen').getByRole('alert')).toBeVisible();
    await expect(page.getByTestId('favorite-aldi')).not.toBeChecked();
    expect(await savedStores(page)).toEqual([...legacyIds, 'lidl']);
    await page.getByTestId('stores-screen').getByRole('button', { name: 'Volver a cargar', exact: true }).click();
    await expect(page.getByTestId('favorite-lidl')).toBeChecked();
    await page.getByTestId('favorite-aldi').click();
    await expect.poll(() => savedStores(page)).toEqual([...legacyIds, 'lidl', 'aldi']);
    expect((await preferences(page)).inAppReminders).toBe(true);
    expect(await retainedData(page)).toEqual(retained);
  } finally { await second.close(); }
});
