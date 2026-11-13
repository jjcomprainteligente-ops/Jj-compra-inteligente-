import { expect, test, type BrowserContext, type Page } from '@playwright/test';

const shoppingKey = 'jjcompraintelwgiemt.shopping.v1';
const menusKey = 'jjcompraintelwgiemt.menus.v1';
const businessKeys = [shoppingKey, menusKey, 'jjcompraintelwgiemt.comparisons.v1',
  'jjcompraintelwgiemt.price-observations.v1'];
const unpricedShopping = JSON.stringify({ version: 1, state: { activeListId: 'v2-list', lists: [{
  id: 'v2-list', name: 'Lista local V2', budgetCents: 6000, items: [{
    id: 'v2-tomate', name: 'Tomate propio', quantityMilli: 500000, unit: 'g', category: 'Fruta y verdura',
    note: 'Conservar nota', checked: true, unitPriceCents: null, priceKind: null,
  }, {
    id: 'v2-arroz', name: 'Arroz propio', quantityMilli: 1000, unit: 'kg', category: 'Despensa',
    note: '', checked: false, unitPriceCents: null, priceKind: null,
  }],
}] } });

async function seedUnpricedList(context: BrowserContext) {
  await context.addInitScript(({ key, shopping }) => {
    if (sessionStorage.getItem('v2-contract-seeded')) return;
    localStorage.setItem(key, shopping);
    sessionStorage.setItem('v2-contract-seeded', '1');
  }, { key: shoppingKey, shopping: unpricedShopping });
}
async function businessSnapshot(page: Page) {
  return page.evaluate(keys => keys.map(key => localStorage.getItem(key)), businessKeys);
}

test('V2 distingue importes sin precio y gasto real sin registrar, aunque haya productos marcados', async ({ page, context }) => {
  await seedUnpricedList(context);
  await page.goto('/');
  await expect(page.getByTestId('tab-home')).toBeVisible();
  const before = await businessSnapshot(page);
  await page.getByTestId('tab-savings').click();
  await expect(page.getByTestId('actual-spend-total')).toHaveText('Sin registrar');
  await expect(page.getByTestId('entered-total')).toHaveText('Sin datos');
  await expect(page.getByTestId('known-total')).toHaveText('Total pendiente');
  expect(await businessSnapshot(page)).toEqual(before);
  expect(before[0]).toBe(unpricedShopping);
  expect(before[1]).toBeNull();
});

test('V2 abre la categoría y el catálogo desde Inicio sin guardar una compra ni generar un menú', async ({ page, context }) => {
  await seedUnpricedList(context);
  await page.goto('/');
  await expect(page.getByTestId('tab-home')).toBeVisible();
  const before = await businessSnapshot(page);
  await page.getByRole('button', { name: 'Añadir un producto: Fruta', exact: true }).click();
  const editor = page.getByTestId('app-sheet');
  await expect(editor.getByRole('button', { name: 'Categoría Fruta y verdura', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(editor.getByRole('textbox', { name: 'Nombre del producto', exact: true })).toHaveValue('');
  expect(await businessSnapshot(page)).toEqual(before);
  await editor.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await expect(editor).toHaveCount(0);
  expect(await businessSnapshot(page)).toEqual(before);

  await page.getByRole('button', { name: 'Descubrir recetas', exact: true }).click();
  await expect(page.getByTestId('tab-menus')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('menus-section-discover')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /^Receta de / })).toHaveCount(20);
  await expect(page.getByRole('button', { name: 'Receta de Arroz con verduras', exact: true })).toBeVisible();
  expect(await businessSnapshot(page)).toEqual(before);
  expect(await page.evaluate(key => localStorage.getItem(key), menusKey)).toBeNull();
});
