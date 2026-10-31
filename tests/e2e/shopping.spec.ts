import { expect, test, type Locator, type Page } from '@playwright/test';

const shoppingKey = 'jjcompraintelwgiemt.shopping.v1';
const comparisonKey = 'jjcompraintelwgiemt.comparisons.v1';
const legacyData = JSON.stringify({
  version: 1,
  comparisons: [{ id: 'legacy-comparison', name: 'Comparación conservada', offers: [] }],
});

interface StoredItem {
  id: string;
  name: string;
  quantityMilli: number;
  unit: string;
  category: string;
  checked: boolean;
  unitPriceCents: number | null;
  priceKind: 'entered' | 'estimated' | null;
  note: string;
}

interface StoredList {
  id: string;
  name: string;
  budgetCents: number | null;
  items: StoredItem[];
}

interface StoredEnvelope {
  version: number;
  state: { lists: StoredList[]; activeListId: string | null };
}

interface ProductEntry {
  name: string;
  quantity?: string;
  unit?: 'ud' | 'g' | 'kg' | 'ml' | 'L';
  price?: string;
  priceKind?: 'entered' | 'estimated';
  category?: string;
  note?: string;
}

async function readShopping(page: Page): Promise<StoredEnvelope> {
  const value = await page.evaluate(key => localStorage.getItem(key), shoppingKey);
  expect(value).not.toBeNull();
  return JSON.parse(value!) as StoredEnvelope;
}

async function activeList(page: Page): Promise<StoredList> {
  const value = await readShopping(page);
  const active = value.state.lists.find(list => list.id === value.state.activeListId);
  expect(active).toBeDefined();
  return active!;
}

async function closeAfterSave(sheet: Locator): Promise<void> {
  await sheet.waitFor({ state: 'detached' });
}

async function createList(page: Page, name: string): Promise<void> {
  await page.getByTestId('create-list').click();
  const sheet = page.getByTestId('app-sheet');
  await sheet.getByRole('textbox', { name: 'Nombre de la lista', exact: true }).fill(name);
  await sheet.getByTestId('save-list').click();
  await closeAfterSave(sheet);
}

async function openList(page: Page): Promise<void> {
  await page.getByRole('tab', { name: 'Mi compra', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Mi compra', exact: true })).toHaveAttribute('aria-selected', 'true');
}

async function fillProduct(sheet: Locator, entry: ProductEntry): Promise<void> {
  await sheet.getByRole('textbox', { name: 'Nombre del producto', exact: true }).fill(entry.name);
  await sheet.getByRole('textbox', { name: 'Cantidad', exact: true }).fill(entry.quantity ?? '1');
  await sheet.getByRole('button', { name: `Unidad ${entry.unit ?? 'ud'}`, exact: true }).click();
  await sheet.getByRole('textbox', { name: 'Precio unitario (€)', exact: true }).fill(entry.price ?? '');
  await sheet.getByRole('button', {
    name: entry.priceKind === 'estimated' ? 'Precio estimado' : 'Precio introducido', exact: true,
  }).click();
  if (entry.category) {
    await sheet.getByRole('button', { name: `Categoría ${entry.category}`, exact: true }).click();
  }
  if (entry.note !== undefined) await sheet.getByRole('textbox', { name: 'Nota', exact: true }).fill(entry.note);
}

async function startProduct(page: Page, entry: ProductEntry): Promise<Locator> {
  await page.getByTestId('add-item').click();
  const sheet = page.getByTestId('app-sheet');
  await fillProduct(sheet, entry);
  return sheet;
}

async function addProduct(page: Page, entry: ProductEntry): Promise<void> {
  const sheet = await startProduct(page, entry);
  await sheet.getByTestId('save-item').click();
  await closeAfterSave(sheet);
}

async function chooseList(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Elegir lista', exact: true }).click();
  const sheet = page.getByTestId('app-sheet');
  await sheet.getByRole('button', { name: `Abrir lista ${name}`, exact: true }).click();
  await closeAfterSave(sheet);
}

test('conserva doce productos, funciona sin conexión y distingue gasto, estimaciones y precios pendientes', async ({ page, context }) => {
  test.setTimeout(180_000);
  const runtimeErrors: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  await page.goto('/');
  await createList(page, 'Compra semanal');
  await openList(page);

  await page.getByTestId('edit-budget').click();
  const budget = page.getByTestId('app-sheet');
  await budget.getByRole('textbox', { name: 'Presupuesto (€)', exact: true }).fill('10,00');
  await budget.getByTestId('save-budget').click();
  await closeAfterSave(budget);

  const first = await startProduct(page, {
    name: 'Leche', quantity: '-2', unit: 'L', price: '1,20', category: 'Lácteos y huevos',
  });
  await first.getByTestId('save-item').click();
  await expect(first.getByRole('alert')).toBeVisible();
  await expect(first.getByRole('textbox', { name: 'Nombre del producto', exact: true })).toHaveValue('Leche');
  await first.getByRole('textbox', { name: 'Cantidad', exact: true }).fill('2');
  await first.getByTestId('save-item').click();
  await closeAfterSave(first);
  await addProduct(page, { name: 'Arroz', quantity: '0.5', unit: 'kg', price: '2.50', priceKind: 'estimated', category: 'Despensa' });
  await addProduct(page, { name: 'Huevos', quantity: '6', category: 'Lácteos y huevos' });
  for (let index = 1; index <= 8; index++) await addProduct(page, { name: `Producto ${index}` });

  // The already-loaded native-style app must write locally without making a request.
  // Reload is done after restoring the connection; this is not a PWA offline-install test.
  await context.setOffline(true);
  await addProduct(page, { name: 'Tomates', quantity: '1', unit: 'kg', category: 'Fruta y verdura' });
  expect((await activeList(page)).items).toHaveLength(12);
  await context.setOffline(false);
  await page.reload();
  await openList(page);
  expect((await activeList(page)).items).toHaveLength(12);
  expect((await activeList(page)).budgetCents).toBe(1000);

  const milk = page.getByRole('checkbox', { name: 'Marcar Leche', exact: true });
  await milk.click();
  await expect(milk).toBeChecked();
  const rice = page.getByRole('checkbox', { name: 'Marcar Arroz', exact: true });
  await rice.click();
  await expect(rice).toBeChecked();
  await page.getByRole('tab', { name: 'Ahorro', exact: true }).click();
  await expect(page.getByTestId('entered-total')).toContainText('2,40');
  await expect(page.getByTestId('estimated-total')).toContainText('1,25');
  await expect(page.getByTestId('spent-total')).toContainText('2,40');
  await expect(page.getByTestId('known-total')).toContainText('3,65');
  await expect(page.getByTestId('missing-price-count')).toContainText('10');

  await openList(page);
  await page.getByRole('button', { name: 'Editar Leche', exact: true }).click();
  const editing = page.getByTestId('app-sheet');
  await expect(editing.getByRole('textbox', { name: 'Cantidad', exact: true })).toHaveValue('2');
  await editing.getByRole('textbox', { name: 'Cantidad', exact: true }).fill('6');
  await editing.getByRole('textbox', { name: 'Precio unitario (€)', exact: true }).fill('2,00');
  await editing.getByRole('textbox', { name: 'Nota', exact: true }).fill('Revisar la marca');
  await editing.getByTestId('save-item').click();
  await closeAfterSave(editing);
  const savedMilk = (await activeList(page)).items.find(item => item.name === 'Leche');
  expect(savedMilk).toMatchObject({ quantityMilli: 6000, unit: 'L', unitPriceCents: 200, checked: true, note: 'Revisar la marca' });
  await page.getByRole('tab', { name: 'Ahorro', exact: true }).click();
  await expect(page.getByTestId('spent-total')).toContainText('12,00');
  await expect(page.getByTestId('estimated-total')).toContainText('1,25');
  await expect(page.getByTestId('known-total')).toContainText('13,25');
  await expect(page.locator('body')).toContainText('3,25');

  await openList(page);
  await page.getByRole('button', { name: 'Eliminar Arroz', exact: true }).click();
  await page.getByTestId('confirmation-dialog').getByRole('button', { name: 'Conservar', exact: true }).click();
  await page.getByTestId('confirmation-dialog').waitFor({ state: 'detached' });
  expect((await activeList(page)).items).toHaveLength(12);
  await page.getByRole('button', { name: 'Eliminar Arroz', exact: true }).click();
  await page.getByTestId('confirmation-dialog').getByRole('button', { name: 'Eliminar producto', exact: true }).click();
  await page.getByTestId('confirmation-dialog').waitFor({ state: 'detached' });
  expect((await activeList(page)).items).toHaveLength(11);
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect.poll(async () => (await activeList(page)).items.length).toBe(12);
  expect((await activeList(page)).items.find(item => item.name === 'Arroz')).toMatchObject({ checked: true, priceKind: 'estimated' });

  const eggs = page.getByRole('checkbox', { name: 'Marcar Huevos', exact: true });
  await eggs.click();
  await expect(eggs).toBeChecked();
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect(eggs).not.toBeChecked();
  await page.reload();
  expect((await activeList(page)).items).toHaveLength(12);
  expect((await activeList(page)).items.find(item => item.name === 'Leche')).toMatchObject({ quantityMilli: 6000, unitPriceCents: 200 });
  expect(runtimeErrors).toEqual([]);
});

test('pide una decisión ante duplicados y mantiene las listas separadas al renombrar, eliminar y deshacer', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  await createList(page, 'Semanal');
  await openList(page);
  await addProduct(page, { name: 'Plátano', quantity: '1' });

  let form = await startProduct(page, { name: 'PLATANO', quantity: '2' });
  await form.getByTestId('save-item').click();
  await expect(page.getByText('Ya existe un producto parecido', { exact: true })).toBeVisible();
  expect((await activeList(page)).items).toHaveLength(1);
  await page.getByRole('button', { name: 'Editar existente', exact: true }).click();
  form = page.getByTestId('app-sheet');
  await expect(form.getByRole('textbox', { name: 'Nombre del producto', exact: true })).toHaveValue('Plátano');
  await form.getByRole('textbox', { name: 'Cantidad', exact: true }).fill('3');
  await form.getByTestId('save-item').click();
  await closeAfterSave(form);
  expect((await activeList(page)).items).toHaveLength(1);
  expect((await activeList(page)).items[0].quantityMilli).toBe(3000);

  form = await startProduct(page, { name: 'PLATANO', quantity: '2' });
  await form.getByTestId('save-item').click();
  await expect(page.getByText('Ya existe un producto parecido', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Añadir por separado', exact: true }).click();
  await closeAfterSave(form);
  const items = (await activeList(page)).items;
  expect(items).toHaveLength(2);
  expect(new Set(items.map(item => item.id)).size).toBe(2);
  expect(items.map(item => item.quantityMilli)).toEqual([3000, 2000]);

  await page.getByRole('button', { name: 'Renombrar lista', exact: true }).click();
  const renaming = page.getByTestId('app-sheet');
  await renaming.getByRole('textbox', { name: 'Nombre de la lista', exact: true }).fill('Compra del lunes');
  await renaming.getByTestId('save-list').click();
  await closeAfterSave(renaming);
  expect((await activeList(page)).name).toBe('Compra del lunes');

  await page.getByRole('tab', { name: 'Inicio', exact: true }).click();
  await createList(page, 'Mercado');
  await openList(page);
  expect((await activeList(page)).items).toHaveLength(0);
  await chooseList(page, 'Compra del lunes');
  expect((await activeList(page)).items).toHaveLength(2);
  await chooseList(page, 'Mercado');
  await page.getByRole('button', { name: 'Eliminar lista', exact: true }).click();
  await page.getByTestId('confirmation-dialog').getByRole('button', { name: 'Eliminar lista', exact: true }).click();
  await page.getByTestId('confirmation-dialog').waitFor({ state: 'detached' });
  expect((await readShopping(page)).state.lists.map(list => list.name)).toEqual(['Compra del lunes']);
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect.poll(async () => (await readShopping(page)).state.lists.length).toBe(2);
  await page.reload();
  await openList(page);
  await chooseList(page, 'Compra del lunes');
  expect((await activeList(page)).items).toHaveLength(2);
});

test('un fallo de escritura conserva el formulario y los datos anteriores, y permite reintentar', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('create-list').waitFor();
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: comparisonKey, value: legacyData });
  await createList(page, 'Persistencia segura');
  await openList(page);
  const before = await page.evaluate(key => localStorage.getItem(key), shoppingKey);
  const form = await startProduct(page, { name: 'Aceite de oliva', quantity: '1', unit: 'L', price: '5,75' });
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    (window as unknown as { restoreShoppingWrites: () => void }).restoreShoppingWrites = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new Error('Disco lleno de prueba');
      original.call(this, name, value);
    };
  }, shoppingKey);
  await form.getByTestId('save-item').click();
  await expect(page.getByRole('alert').filter({ hasText: 'No se pudieron guardar' }).first()).toBeVisible();
  await expect(form.getByRole('textbox', { name: 'Nombre del producto', exact: true })).toHaveValue('Aceite de oliva');
  await expect(form.getByRole('textbox', { name: 'Precio unitario (€)', exact: true })).toHaveValue('5,75');
  expect(await page.evaluate(key => localStorage.getItem(key), shoppingKey)).toBe(before);
  expect(await page.evaluate(key => localStorage.getItem(key), comparisonKey)).toBe(legacyData);
  await page.evaluate(() => (window as unknown as { restoreShoppingWrites: () => void }).restoreShoppingWrites());
  await form.getByTestId('save-item').click();
  await closeAfterSave(form);
  expect((await activeList(page)).items).toHaveLength(1);
  await page.reload();
  expect((await activeList(page)).items[0]).toMatchObject({ name: 'Aceite de oliva', unitPriceCents: 575 });
  expect(await page.evaluate(key => localStorage.getItem(key), comparisonKey)).toBe(legacyData);
});

for (const invalid of [
  { label: 'JSON corrupto', value: '{corrupto' },
  { label: 'versión no compatible', value: JSON.stringify({ version: 999, state: { lists: [], activeListId: null } }) },
]) {
  test(`no reemplaza ${invalid.label} ni altera el comparador y permite volver a cargar`, async ({ page }) => {
    await page.addInitScript(({ key, bad, legacyKey, legacy }) => {
      localStorage.setItem(key, bad);
      localStorage.setItem(legacyKey, legacy);
    }, { key: shoppingKey, bad: invalid.value, legacyKey: comparisonKey, legacy: legacyData });
    await page.goto('/');
    await expect(page.getByRole('alert').filter({ hasText: 'No se han modificado' }).first()).toBeVisible();
    await expect(page.getByTestId('create-list')).toHaveCount(0);
    expect(await page.evaluate(key => localStorage.getItem(key), shoppingKey)).toBe(invalid.value);
    expect(await page.evaluate(key => localStorage.getItem(key), comparisonKey)).toBe(legacyData);
    await page.evaluate(key => localStorage.removeItem(key), shoppingKey);
    await page.getByRole('button', { name: 'Volver a cargar', exact: true }).click();
    await expect(page.getByTestId('create-list')).toBeVisible();
    expect(await page.evaluate(key => localStorage.getItem(key), comparisonKey)).toBe(legacyData);
  });
}

test('los nombres y notas se muestran como texto y no ejecutan contenido HTML', async ({ page }) => {
  const untrustedName = '<img src=x onerror="window.__shoppingTestInjected=true">';
  const untrustedNote = '<script>window.__shoppingTestInjected=true</script>';
  await page.goto('/');
  await createList(page, 'Texto sin interpretar');
  await openList(page);
  await addProduct(page, { name: untrustedName, note: untrustedNote });
  await expect(page.getByText(untrustedName, { exact: true })).toBeVisible();
  await expect(page.locator('img[onerror]')).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).__shoppingTestInjected)).toBeUndefined();
  await page.reload();
  await openList(page);
  await expect(page.getByText(untrustedName, { exact: true })).toBeVisible();
  expect((await activeList(page)).items[0].note).toBe(untrustedNote);
  expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).__shoppingTestInjected)).toBeUndefined();
});

test('protege un borrador al cerrar y permite entrar y volver del comparador conservado', async ({ page }) => {
  await page.goto('/');
  await createList(page, 'Borradores');
  await openList(page);
  const sheet = await startProduct(page, { name: 'Café', quantity: '2' });
  await sheet.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await expect(sheet.getByText('¿Descartar los cambios?', { exact: true })).toBeVisible();
  await sheet.getByRole('button', { name: 'Seguir editando', exact: true }).click();
  await expect(sheet.getByRole('textbox', { name: 'Nombre del producto', exact: true })).toHaveValue('Café');
  await sheet.getByTestId('save-item').click();
  await closeAfterSave(sheet);
  await page.getByRole('tab', { name: 'Ahorro', exact: true }).click();
  await page.getByTestId('open-comparisons').click();
  await expect(page.getByTestId('create-comparison')).toBeVisible();
  await page.getByRole('button', { name: 'Volver a Mi compra', exact: true }).click();
  await expect(page.getByText('Café', { exact: true })).toBeVisible();
  expect((await activeList(page)).items).toHaveLength(1);
});
