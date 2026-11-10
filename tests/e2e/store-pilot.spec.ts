import { expect, test, type Page } from '@playwright/test';

const settingsKey = 'jjcompraintelwgiemt.local-settings.v1';
const shoppingKey = 'jjcompraintelwgiemt.shopping.v1';
const ids = ['lidl', 'aldi', 'hiperdino', 'superdino', 'hiperdino-express', 'mercadona'];

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
  await expect(page.getByTestId('favorite-superdino')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('favorite-aldi')).toHaveAttribute('aria-selected', 'true');
  await page.getByTestId('stores-select-all').click();
  await expect.poll(() => savedStores(page)).toEqual(ids);
  await expect(page.getByTestId('stores-select-all')).toBeDisabled();
  for (const id of ids) await expect(page.getByTestId(`favorite-${id}`)).toHaveAttribute('aria-selected', 'true');
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
    if (/\.(lidl|aldi|hiperdino|mercadona)\.es$|^hiperdinoexpress\.com$/.test(new URL(request.url()).hostname)) automaticRequests.push(request.url());
  });
  await page.addInitScript(() => {
    Object.defineProperty(window, '__storeOpens', { value: [] });
    window.open = ((url?: string | URL) => {
      (window as unknown as { __storeOpens: string[] }).__storeOpens.push(String(url));
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
  const opened = await page.evaluate(() => (window as unknown as { __storeOpens: string[] }).__storeOpens);
  expect(opened).toEqual([
    'https://www.lidl.es/c/descubre-nuevas-ofertas-cada-semana-folletos-lidl/s10087402',
    'https://www.aldi.es/folleto.html', 'https://www.hiperdino.es/',
    'https://www.hiperdino.es/tiendas/', 'https://hiperdinoexpress.com/tiendas', 'https://www.mercadona.es/',
  ]);
  expect(await page.evaluate(() => ({ ...localStorage }))).toEqual(before);
  expect(automaticRequests).toEqual([]);
});
