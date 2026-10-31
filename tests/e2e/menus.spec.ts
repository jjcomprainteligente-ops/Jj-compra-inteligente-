import { expect, test, type Locator, type Page } from '@playwright/test';

const shoppingKey = 'jjcompraintelwgiemt.shopping.v1';
const menusKey = 'jjcompraintelwgiemt.menus.v1';
const comparisonKey = 'jjcompraintelwgiemt.comparisons.v1';
const firstRecipes = ['arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate'];
const comparisonData = JSON.stringify({ version: 1, comparisons: [{ id: 'comparison-before-menu', name: 'Comparación anterior', offers: [] }] });

interface StoredItem {
  id: string; name: string; quantityMilli: number; unit: string; category: string; note: string;
  checked: boolean; unitPriceCents: number | null; priceKind: 'entered' | 'estimated' | null;
}
interface StoredList { id: string; name: string; budgetCents: number | null; items: StoredItem[] }
interface StoredShopping { version: number; state: { activeListId: string | null; lists: StoredList[] } }
interface StoredMenu { version: number; plan: { servings: number; recipeIds: string[] } | null }

const product = (overrides: Partial<StoredItem> = {}): StoredItem => ({
  id: 'pan-before-menu', name: 'Pan', quantityMilli: 1000, unit: 'ud', category: 'Panadería',
  note: 'Conservar este producto', checked: true, unitPriceCents: 456, priceKind: 'entered', ...overrides,
});
const shopping = (items = [product()]): StoredShopping => ({
  version: 1, state: { activeListId: 'existing-list', lists: [{ id: 'existing-list', name: 'Mi compra anterior', budgetCents: 12500, items }] },
});

async function readShopping(page: Page): Promise<StoredShopping> {
  const value = await page.evaluate(key => localStorage.getItem(key), shoppingKey);
  expect(value).not.toBeNull();
  return JSON.parse(value!) as StoredShopping;
}
async function readMenu(page: Page): Promise<StoredMenu | null> {
  return page.evaluate(key => {
    const value = localStorage.getItem(key);
    return value === null ? null : JSON.parse(value);
  }, menusKey);
}
async function seed(page: Page, value: StoredShopping, menu?: string): Promise<void> {
  await page.goto('/');
  await page.getByRole('heading', { name: 'Tu compra,\nbajo control.', exact: true }).waitFor();
  await page.evaluate(({ shoppingStorage, menuStorage, comparisonStorage, shoppingData, menuData, comparisons }) => {
    localStorage.setItem(shoppingStorage, shoppingData);
    localStorage.setItem(comparisonStorage, comparisons);
    if (menuData === undefined) localStorage.removeItem(menuStorage);
    else localStorage.setItem(menuStorage, menuData);
  }, { shoppingStorage: shoppingKey, menuStorage: menusKey, comparisonStorage: comparisonKey,
    shoppingData: JSON.stringify(value), menuData: menu, comparisons: comparisonData });
  await page.reload();
}
async function openMenus(page: Page): Promise<void> {
  await page.getByRole('tab', { name: 'Menús', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Menús', exact: true })).toHaveAttribute('aria-selected', 'true');
}
async function prepareMenu(page: Page): Promise<void> {
  await page.getByTestId('prepare-menu').click();
  await expect(page.getByTestId('review-menu')).toBeVisible();
  await expect.poll(async () => (await readMenu(page))?.plan?.recipeIds.length).toBe(5);
}
async function importText(page: Page, text: string): Promise<Locator> {
  await page.getByTestId('import-text').click();
  const sheet = page.getByTestId('menu-sheet');
  await sheet.getByTestId('ingredient-text').fill(text);
  await sheet.getByTestId('parse-ingredients').click();
  await expect(sheet.getByRole('heading', { name: 'Esto he entendido', exact: true })).toBeVisible();
  return sheet;
}
async function namedIngredientRow(sheet: Locator, name: string): Promise<Locator> {
  // Scope by the editable value, rather than row position: category grouping can change.
  const rows = sheet.getByTestId('ingredient-review-row');
  for (let index = 0; index < await rows.count(); index++) {
    if (await rows.nth(index).getByRole('textbox', { name: /^Nombre del ingrediente \d+$/ }).inputValue() === name) return rows.nth(index);
  }
  throw new Error(`No se encontró el ingrediente ${name}`);
}
async function rejectWrites(page: Page, key: string): Promise<void> {
  await page.evaluate(blocked => {
    const original = Storage.prototype.setItem;
    (window as unknown as { restoreB05Writes: () => void }).restoreB05Writes = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (name, value) {
      if (name === blocked) throw new Error('Fallo de escritura de prueba B05');
      original.call(this, name, value);
    };
  }, key);
}
async function restoreWrites(page: Page): Promise<void> {
  await page.evaluate(() => (window as unknown as { restoreB05Writes: () => void }).restoreB05Writes());
}

test('prepara y edita cinco cenas sin red y conserva el plan al recargar', async ({ page, context }) => {
  await seed(page, shopping());
  const oldShopping = await page.evaluate(key => localStorage.getItem(key), shoppingKey);
  const externalRequests: string[] = [];
  const runtimeErrors: string[] = [];
  page.on('request', request => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(page.url()).origin) externalRequests.push(request.url());
  });
  page.on('pageerror', error => runtimeErrors.push(error.message));
  await openMenus(page);
  await context.setOffline(true);
  await prepareMenu(page);
  expect((await readMenu(page))?.plan).toEqual({ servings: 2, recipeIds: firstRecipes });
  await page.getByRole('button', { name: 'Aumentar personas', exact: true }).click();
  await expect.poll(async () => (await readMenu(page))?.plan?.servings).toBe(3);
  await page.getByRole('button', { name: 'Aumentar personas', exact: true }).click();
  await expect.poll(async () => (await readMenu(page))?.plan?.servings).toBe(4);
  await page.getByRole('button', { name: 'Cambiar plato del lunes', exact: true }).click();
  const change = page.getByTestId('menu-sheet');
  await change.getByRole('button', { name: 'Pollo con papas', exact: true }).click();
  await change.waitFor({ state: 'detached' });
  expect((await readMenu(page))?.plan?.recipeIds[0]).toBe('pollo-papas');
  expect(await page.evaluate(key => localStorage.getItem(key), shoppingKey)).toBe(oldShopping);
  await context.setOffline(false);
  await page.reload();
  await openMenus(page);
  await expect(page.getByTestId('menu-servings')).toContainText('4');
  await expect(page.getByRole('button', { name: 'Receta de Pollo con papas', exact: true })).toBeVisible();
  expect((await readMenu(page))?.plan).toEqual({ servings: 4, recipeIds: ['pollo-papas', ...firstRecipes.slice(1)] });
  expect(externalRequests).toEqual([]);
  expect(runtimeErrors).toEqual([]);
});

test('cancelar la revisión no modifica las compras; confirmar añade solo lo revisado y permite deshacer', async ({ page }) => {
  await seed(page, shopping());
  const before = await page.evaluate(key => localStorage.getItem(key), shoppingKey);
  const beforeObject = await readShopping(page);
  await openMenus(page);
  await prepareMenu(page);
  await page.getByTestId('review-menu').click();
  let sheet = page.getByTestId('menu-sheet');
  await expect(sheet.getByRole('heading', { name: 'Esto he entendido', exact: true })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), shoppingKey)).toBe(before);
  await sheet.getByRole('button', { name: 'Cancelar propuesta', exact: true }).click();
  await sheet.getByRole('button', { name: 'Cancelar sin añadir', exact: true }).click();
  await sheet.waitFor({ state: 'detached' });
  expect(await page.evaluate(key => localStorage.getItem(key), shoppingKey)).toBe(before);

  await page.getByTestId('review-menu').click();
  sheet = page.getByTestId('menu-sheet');
  const rice = await namedIngredientRow(sheet, 'Arroz');
  await rice.getByRole('textbox', { name: /^Cantidad del ingrediente \d+$/ }).fill('250');
  const water = await namedIngredientRow(sheet, 'Agua');
  await water.getByRole('checkbox', { name: /^Incluir ingrediente \d+: Agua$/ }).uncheck();
  await sheet.getByTestId('confirm-ingredients').click();
  await sheet.waitFor({ state: 'detached' });
  await expect(page.getByRole('tab', { name: 'Mi compra', exact: true })).toHaveAttribute('aria-selected', 'true');
  const result = await readShopping(page);
  const list = result.state.lists[0];
  expect(list.budgetCents).toBe(12500);
  expect(list.items.find(item => item.id === 'pan-before-menu')).toEqual(product());
  expect(list.items.find(item => item.name === 'Arroz')).toMatchObject({ quantityMilli: 250000, unit: 'g', checked: false, unitPriceCents: null, priceKind: null });
  expect(list.items.some(item => item.name === 'Agua')).toBe(false);
  const added = list.items.filter(item => item.id !== 'pan-before-menu');
  expect(added.length).toBeGreaterThan(10);
  expect(added.every(item => !item.checked && item.unitPriceCents === null && item.priceKind === null)).toBe(true);
  expect(await page.evaluate(key => localStorage.getItem(key), comparisonKey)).toBe(comparisonData);
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect.poll(async () => await readShopping(page)).toEqual(beforeObject);
});

test('resuelve duplicados g/kg explícitamente y protege el precio y el estado de productos anteriores', async ({ page }) => {
  const oldRice = product({ id: 'rice-before', name: 'Arroz', quantityMilli: 1000, unit: 'kg', category: 'Despensa', note: '', checked: false, unitPriceCents: null, priceKind: null });
  const oldMilk = product({ id: 'milk-before', name: 'Leche', quantityMilli: 1000, unit: 'L', category: 'Lácteos y huevos', checked: true, unitPriceCents: 120, priceKind: 'entered' });
  await seed(page, shopping([oldRice, oldMilk]));
  await openMenus(page);
  const before = await page.evaluate(key => localStorage.getItem(key), shoppingKey);
  const sheet = await importText(page, '500 g Arroz\n2 L Leche\n1 ud Pan');
  await sheet.getByTestId('confirm-ingredients').click();
  await expect(sheet.getByRole('alert')).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), shoppingKey)).toBe(before);
  const rice = await namedIngredientRow(sheet, 'Arroz');
  await rice.getByRole('button', { name: /^Sumar cantidades del ingrediente \d+$/ }).click();
  const milk = await namedIngredientRow(sheet, 'Leche');
  await expect(milk.getByRole('button', { name: /^Sumar cantidades del ingrediente \d+$/ })).toHaveCount(0);
  await milk.getByRole('button', { name: /^Añadir por separado ingrediente \d+$/ }).click();
  await sheet.getByTestId('confirm-ingredients').click();
  await sheet.waitFor({ state: 'detached' });
  const list = (await readShopping(page)).state.lists[0];
  expect(list.items.find(item => item.id === 'rice-before')).toMatchObject({ quantityMilli: 1500, unit: 'kg', checked: false, unitPriceCents: null });
  expect(list.items.find(item => item.id === 'milk-before')).toEqual(oldMilk);
  expect(list.items.filter(item => item.name === 'Leche')).toHaveLength(2);
  expect(list.items.find(item => item.name === 'Leche' && item.id !== 'milk-before')).toMatchObject({ quantityMilli: 2000, unit: 'L', checked: false, unitPriceCents: null, priceKind: null });
  expect(list.budgetCents).toBe(12500);
});

test('una línea ambigua impide la importación parcial y el texto no se almacena como historial', async ({ page }) => {
  await seed(page, shopping([]));
  await openMenus(page);
  const before = await page.evaluate(key => localStorage.getItem(key), shoppingKey);
  await page.getByTestId('import-text').click();
  const sheet = page.getByTestId('menu-sheet');
  await sheet.getByTestId('ingredient-text').fill('500 g Arroz\nNaranja al gusto');
  await sheet.getByTestId('parse-ingredients').click();
  await expect(sheet.getByRole('alert')).toBeVisible();
  await expect(sheet.getByTestId('confirm-ingredients')).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), shoppingKey)).toBe(before);
  await sheet.getByTestId('ingredient-text').fill('500 g Arroz\n2 L Leche');
  await sheet.getByTestId('parse-ingredients').click();
  await expect(sheet.getByTestId('ingredient-review-row')).toHaveCount(2);
  await sheet.getByRole('button', { name: 'Cancelar propuesta', exact: true }).click();
  await sheet.getByRole('button', { name: 'Cancelar sin añadir', exact: true }).click();
  await sheet.waitFor({ state: 'detached' });
  expect(await page.evaluate(key => localStorage.getItem(key), shoppingKey)).toBe(before);
  expect(await page.evaluate(key => localStorage.getItem(key), menusKey)).toBeNull();
  expect(await page.evaluate(() => Object.values(localStorage).some(value => String(value).includes('Naranja al gusto')))).toBe(false);
});

test('un fallo de escritura conserva la revisión y permite reintentar sin duplicar ingredientes', async ({ page }) => {
  await seed(page, shopping([]));
  await openMenus(page);
  const before = await page.evaluate(key => localStorage.getItem(key), shoppingKey);
  const sheet = await importText(page, '500 g Arroz');
  await rejectWrites(page, shoppingKey);
  await sheet.getByTestId('confirm-ingredients').click();
  await expect(sheet.getByRole('alert').filter({ hasText: 'No se pudieron guardar' })).toBeVisible();
  const rice = await namedIngredientRow(sheet, 'Arroz');
  await expect(rice.getByRole('textbox', { name: /^Cantidad del ingrediente \d+$/ })).toHaveValue('500');
  expect(await page.evaluate(key => localStorage.getItem(key), shoppingKey)).toBe(before);
  expect(await page.evaluate(key => localStorage.getItem(key), comparisonKey)).toBe(comparisonData);
  await restoreWrites(page);
  await sheet.getByTestId('confirm-ingredients').click();
  await sheet.waitFor({ state: 'detached' });
  expect((await readShopping(page)).state.lists[0].items).toHaveLength(1);
  await page.reload();
  expect((await readShopping(page)).state.lists[0].items).toHaveLength(1);
});

test('un menú corrupto no se reemplaza ni impide utilizar las compras locales', async ({ page }) => {
  await seed(page, shopping(), '{menu-corrupto');
  await openMenus(page);
  await expect(page.getByRole('alert').filter({ hasText: 'No se han modificado' })).toBeVisible();
  await expect(page.getByTestId('prepare-menu')).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), menusKey)).toBe('{menu-corrupto');
  await page.getByRole('tab', { name: 'Mi compra', exact: true }).click();
  const oldProduct = page.getByRole('checkbox', { name: 'Marcar Pan', exact: true });
  // The checkbox updates only after its asynchronous, coordinated save.
  await oldProduct.click();
  await expect(oldProduct).not.toBeChecked();
  await expect.poll(async () => (await readShopping(page)).state.lists[0].items[0].checked).toBe(false);
  expect(await page.evaluate(key => localStorage.getItem(key), menusKey)).toBe('{menu-corrupto');
  expect(await page.evaluate(key => localStorage.getItem(key), comparisonKey)).toBe(comparisonData);
});

test('un fallo al guardar el menú no anuncia un plan guardado y permite reintentar', async ({ page }) => {
  await seed(page, shopping());
  const oldShopping = await page.evaluate(key => localStorage.getItem(key), shoppingKey);
  await openMenus(page);
  await rejectWrites(page, menusKey);
  await page.getByTestId('prepare-menu').click();
  await expect(page.getByRole('alert').filter({ hasText: 'No se pudo guardar' })).toBeVisible();
  expect(await readMenu(page)).toBeNull();
  await expect(page.getByTestId('review-menu')).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), shoppingKey)).toBe(oldShopping);
  await restoreWrites(page);
  await prepareMenu(page);
  expect((await readMenu(page))?.plan).toEqual({ servings: 2, recipeIds: firstRecipes });
  expect(await page.evaluate(key => localStorage.getItem(key), shoppingKey)).toBe(oldShopping);
});

test('crea una lista nueva solo al confirmar y permite deshacer todo el grupo', async ({ page }) => {
  const empty: StoredShopping = { version: 1, state: { lists: [], activeListId: null } };
  await seed(page, empty);
  const before = await page.evaluate(key => localStorage.getItem(key), shoppingKey);
  await openMenus(page);
  const sheet = await importText(page, '2 L Leche\n500 g Arroz');
  await sheet.getByRole('textbox', { name: 'Nombre de la nueva lista', exact: true }).fill('Menú para casa');
  expect(await page.evaluate(key => localStorage.getItem(key), shoppingKey)).toBe(before);
  await sheet.getByTestId('confirm-ingredients').click();
  await sheet.waitFor({ state: 'detached' });
  const result = await readShopping(page);
  expect(result.state.lists).toHaveLength(1);
  const created = result.state.lists[0];
  expect(created.name).toBe('Menú para casa');
  expect(created.budgetCents).toBeNull();
  expect(result.state.activeListId).toBe(created.id);
  expect(created.items).toHaveLength(2);
  expect(created.items.every(item => !item.checked && item.unitPriceCents === null && item.priceKind === null)).toBe(true);
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect.poll(async () => await readShopping(page)).toEqual(empty);
  expect(await page.evaluate(key => localStorage.getItem(key), comparisonKey)).toBe(comparisonData);
});
