import { expect, test, type Locator, type Page } from '@playwright/test';
import type { PriceObservation } from '../../src/domain/priceObservations';

const storageKey = 'jjcompraintelwgiemt.price-observations.v1';
const shoppingKey = 'jjcompraintelwgiemt.shopping.v1';
const menusKey = 'jjcompraintelwgiemt.menus.v1';
const comparisonKey = 'jjcompraintelwgiemt.comparisons.v1';
const today = '2026-10-30';

const otherStores: Record<string, string> = {
  [shoppingKey]: JSON.stringify({ version: 1, state: { activeListId: 'before-prices', lists: [{
    id: 'before-prices', name: 'Mi compra conservada', budgetCents: 12500, items: [{
      id: 'bread-before-prices', name: 'Pan', quantityMilli: 1000, unit: 'ud', category: 'Panadería',
      note: 'Conservar este producto', checked: true, unitPriceCents: 250, priceKind: 'entered',
    }],
  }] } }),
  [menusKey]: JSON.stringify({ version: 1, plan: { servings: 2,
    recipeIds: ['arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate'],
  } }),
  [comparisonKey]: JSON.stringify({ version: 1, comparisons: [{
    id: 'comparison-before-prices', name: 'Comparación anterior conservada', offers: [],
  }] }),
};

interface StoredObservations { version: number; observations: PriceObservation[] }
interface ObservationEntry {
  product?: string; brand?: string; format?: string; quality?: string;
  store: string; quantity?: string; unit?: PriceObservation['unit']; price?: string;
  observedOn?: string; sourceKind?: PriceObservation['sourceKind']; sourceReference?: string; url?: string;
}

const observation = (id: string, overrides: Partial<PriceObservation> = {}): PriceObservation => ({
  id, product: 'Arroz', brand: 'La Fallera', format: 'Bolsa', quality: 'Redondo', store: id,
  quantityMilli: 1000, unit: 'kg', priceCents: 300, observedOn: today,
  sourceKind: 'manual', sourceReference: `Ticket de prueba de ${id}`, url: null, ...overrides,
});

test.use({ timezoneId: 'Europe/Madrid' });
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-30T12:00:00+01:00') });
});

async function openPrices(page: Page): Promise<void> {
  await page.getByRole('tab', { name: 'Ahorro', exact: true }).click();
  await page.getByTestId('open-price-pilot').click();
  await expect(page.getByRole('heading', { name: 'Compara con criterio.', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Ahorro', exact: true })).toHaveAttribute('aria-selected', 'true');
}

async function seed(page: Page, serialized: string, preserveOtherStores = false): Promise<void> {
  const others: Record<string, string> = preserveOtherStores ? otherStores : {};
  await page.goto('/');
  await page.getByRole('tab', { name: 'Ahorro', exact: true }).waitFor();
  await page.evaluate(({ key, value, others }) => {
    localStorage.setItem(key, value);
    for (const [name, data] of Object.entries(others)) localStorage.setItem(name, data);
  }, { key: storageKey, value: serialized, others });
  await page.reload();
  await openPrices(page);
}

async function seedObservations(page: Page, observations: PriceObservation[], preserveOtherStores = false): Promise<void> {
  await seed(page, JSON.stringify({ version: 1, observations }), preserveOtherStores);
}

async function stored(page: Page): Promise<StoredObservations> {
  const value = await page.evaluate(key => localStorage.getItem(key), storageKey);
  expect(value).not.toBeNull();
  return JSON.parse(value!) as StoredObservations;
}

async function expectOtherStoresIntact(page: Page): Promise<void> {
  expect(await page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), Object.keys(otherStores)))
    .toEqual(otherStores);
}

async function fillObservation(sheet: Locator, entry: ObservationEntry): Promise<void> {
  await sheet.getByRole('textbox', { name: 'Nombre del producto', exact: true }).fill(entry.product ?? 'Arroz');
  await sheet.getByRole('textbox', { name: 'Marca', exact: true }).fill(entry.brand ?? 'La Fallera');
  await sheet.getByRole('textbox', { name: 'Formato', exact: true }).fill(entry.format ?? 'Bolsa');
  await sheet.getByRole('textbox', { name: 'Calidad o variante', exact: true }).fill(entry.quality ?? 'Redondo');
  await sheet.getByRole('textbox', { name: 'Tienda', exact: true }).fill(entry.store);
  await sheet.getByRole('textbox', { name: 'Contenido del envase', exact: true }).fill(entry.quantity ?? '1');
  await sheet.getByRole('button', { name: `Unidad ${entry.unit ?? 'kg'}`, exact: true }).click();
  await sheet.getByRole('textbox', { name: 'Precio del envase (€)', exact: true }).fill(entry.price ?? '3,00');
  await sheet.getByRole('textbox', { name: 'Fecha de observación (AAAA-MM-DD)', exact: true }).fill(entry.observedOn ?? today);
  const source = entry.sourceKind === 'demo' ? 'Demostración' : entry.sourceKind === 'unknown' ? 'Origen desconocido' : 'Aportado por mí';
  await sheet.getByRole('button', { name: source, exact: true }).click();
  await sheet.getByRole('textbox', { name: 'Procedencia', exact: true }).fill(entry.sourceReference ?? `Ticket de prueba de ${entry.store}`);
  await sheet.getByRole('textbox', { name: 'Enlace de la fuente (opcional)', exact: true }).fill(entry.url ?? '');
}

async function startObservation(page: Page, entry: ObservationEntry): Promise<Locator> {
  await page.getByTestId('add-observation').click();
  const sheet = page.getByTestId('price-sheet');
  await fillObservation(sheet, entry);
  return sheet;
}

async function saveObservation(sheet: Locator): Promise<void> {
  await sheet.getByTestId('save-observation').click();
  await sheet.waitFor({ state: 'detached' });
}

test('crea y edita dos formatos equivalentes; ordena por kg y conserva fecha y procedencia al recargar', async ({ page, context }) => {
  test.setTimeout(120_000);
  const runtimeErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', error => runtimeErrors.push(error.message));
  await page.goto('/');
  await openPrices(page);
  page.on('request', request => {
    if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== new URL(page.url()).origin) externalRequests.push(request.url());
  });

  await context.setOffline(true);
  await saveObservation(await startObservation(page, {
    store: 'Tienda 500 g', quantity: '500', unit: 'g', price: '1,80',
    sourceReference: 'Ticket de la visita del viernes', url: 'https://example.com/ticket-arroz',
  }));
  await saveObservation(await startObservation(page, {
    store: 'Tienda 1 kg', quantity: '1', unit: 'kg', price: '3,00', sourceReference: 'Etiqueta de la estantería',
  }));
  const results = page.getByTestId('comparison-result');
  await expect(results).toHaveCount(2);
  await expect(results.first()).toContainText('Tienda 1 kg');
  await expect(results.first().getByTestId('normalized-price')).toHaveText(/3,00\s*€\s*\/kg/);
  await expect(results.first()).toContainText('Menor importe por unidad en tus aportaciones');
  await expect(results.nth(1).getByTestId('normalized-price')).toHaveText(/3,60\s*€\s*\/kg/);
  await expect(page.getByTestId('observation-card')).toHaveCount(2);

  await page.getByRole('button', { name: 'Editar observación de Tienda 500 g', exact: true }).click();
  const editing = page.getByTestId('price-sheet');
  await expect(editing.getByRole('textbox', { name: 'Fecha de observación (AAAA-MM-DD)', exact: true })).toHaveValue(today);
  await expect(editing.getByRole('textbox', { name: 'Procedencia', exact: true })).toHaveValue('Ticket de la visita del viernes');
  await editing.getByRole('textbox', { name: 'Precio del envase (€)', exact: true }).fill('2,00');
  await saveObservation(editing);
  await expect(results.nth(1).getByTestId('normalized-price')).toHaveText(/4,00\s*€\s*\/kg/);
  await context.setOffline(false);
  await page.reload();
  await openPrices(page);

  await expect(page.getByTestId('comparison-result').first()).toContainText('Tienda 1 kg');
  const saved = page.getByTestId('observation-card').filter({ hasText: 'Tienda 500 g' });
  const displayedDate = new Intl.DateTimeFormat('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' })
    .format(new Date(`${today}T12:00:00Z`));
  await expect(saved).toContainText(`Observado el ${displayedDate} · Tienda 500 g`);
  await expect(saved).toContainText('Procedencia: Ticket de la visita del viernes');
  expect((await stored(page)).observations.find(entry => entry.store === 'Tienda 500 g')).toMatchObject({
    product: 'Arroz', quantityMilli: 500000, unit: 'g', priceCents: 200, observedOn: today,
    sourceKind: 'manual', sourceReference: 'Ticket de la visita del viernes', url: 'https://example.com/ticket-arroz',
  });
  await page.getByTestId('comparison-reference').click();
  const reference = page.getByTestId('price-sheet');
  await reference.getByRole('button', { name: 'Comparar desde Arroz en Tienda 1 kg', exact: true }).click();
  await reference.waitFor({ state: 'detached' });
  await expect(page.getByTestId('comparison-reference')).toContainText('Tienda 1 kg');
  expect(externalRequests).toEqual([]);
  expect(runtimeErrors).toEqual([]);
});

test('convierte ml y L para comparar el contenido completo por litro', async ({ page }) => {
  await page.goto('/');
  await openPrices(page);
  await saveObservation(await startObservation(page, {
    product: 'Leche', brand: 'Pascual', format: 'Brik', quality: 'Entera',
    store: 'Tienda 500 ml', quantity: '500', unit: 'ml', price: '0,80',
  }));
  await saveObservation(await startObservation(page, {
    product: 'Leche', brand: 'Pascual', format: 'Brik', quality: 'Entera',
    store: 'Tienda 1 L', quantity: '1', unit: 'L', price: '1,20',
  }));
  const results = page.getByTestId('comparison-result');
  await expect(results).toHaveCount(2);
  await expect(results.first()).toContainText('Tienda 1 L');
  await expect(results.first().getByTestId('normalized-price')).toHaveText(/1,20\s*€\s*\/L/);
  await expect(results.nth(1).getByTestId('normalized-price')).toHaveText(/1,60\s*€\s*\/L/);
  await expect(page.getByTestId('excluded-observation')).toHaveCount(0);
});

test('explica los datos excluidos y las diferencias de calidad o unidad sin presentarlos como verificados', async ({ page }) => {
  await seedObservations(page, [
    observation('reference', { store: 'Referencia reciente' }),
    observation('comparable', { store: 'Otra aportación', quantityMilli: 500000, unit: 'g', priceCents: 180 }),
    observation('old', { store: 'Dato antiguo', observedOn: '2026-10-22', priceCents: 1 }),
    observation('demo', { store: 'Dato de demostración', sourceKind: 'demo', priceCents: 1 }),
    observation('unknown', { store: 'Dato de origen desconocido', sourceKind: 'unknown', priceCents: 1 }),
    observation('missing', { store: 'Dato sin importe', priceCents: null }),
    observation('quality', { store: 'Variedad integral', quality: 'Integral', priceCents: 1 }),
    observation('units', { store: 'Contenido en litros', unit: 'L', priceCents: 1 }),
  ]);
  await expect(page.getByTestId('comparison-result')).toHaveCount(2);
  await expect(page.getByTestId('comparison-result').first()).toContainText('Referencia reciente');
  const excluded = page.getByTestId('excluded-observation');
  await expect(excluded).toHaveCount(6);
  await expect(excluded.filter({ hasText: 'Dato antiguo' })).toContainText('Observación antigua: tiene más de 7 días.');
  await expect(excluded.filter({ hasText: 'Dato de demostración' })).toContainText('Demostración: no participa en la comparación.');
  await expect(excluded.filter({ hasText: 'Dato de origen desconocido' })).toContainText('Procedencia desconocida: no se puede contrastar.');
  await expect(excluded.filter({ hasText: 'Dato sin importe' })).toContainText('Precio desconocido: falta el importe del envase.');
  await expect(excluded.filter({ hasText: 'Variedad integral' })).toContainText('Calidad o variedad distinta a la de referencia.');
  await expect(excluded.filter({ hasText: 'Contenido en litros' })).toContainText('Unidades no compatibles');
  await expect(page.getByTestId('observation-card')).toHaveCount(8);
  await expect(page.getByTestId('observation-card').filter({ hasText: 'Dato antiguo' })).toContainText('Antiguo');
  await expect(page.getByTestId('observation-card').filter({ hasText: 'Dato de demostración' })).toContainText('Demostración');
  await expect(page.getByText('Sin fuentes verificadas conectadas', { exact: true })).toBeVisible();
  await expect(page.getByText('Estas aportaciones no confirman el precio actual de una tienda.', { exact: false })).toBeVisible();
  await expect(page.getByText('Verificado', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Precio actual', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Mejor precio garantizado', { exact: true })).toHaveCount(0);
});

test('rechaza una fecha futura y un enlace javascript, conserva el borrador y permite corregirlo', async ({ page }) => {
  await page.goto('/');
  await openPrices(page);
  const sheet = await startObservation(page, { store: 'Tienda con correcciones', observedOn: '2026-10-31' });
  await sheet.getByTestId('save-observation').click();
  await expect(sheet.getByRole('alert')).toContainText('no puede estar en el futuro');
  await expect(sheet.getByRole('textbox', { name: 'Tienda', exact: true })).toHaveValue('Tienda con correcciones');
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();

  await sheet.getByRole('textbox', { name: 'Fecha de observación (AAAA-MM-DD)', exact: true }).fill(today);
  await sheet.getByRole('textbox', { name: 'Enlace de la fuente (opcional)', exact: true }).fill('javascript:window.__priceObservationInjected=true');
  await sheet.getByTestId('save-observation').click();
  await expect(sheet.getByRole('alert')).toContainText('HTTP o HTTPS');
  await expect(sheet.getByRole('textbox', { name: 'Precio del envase (€)', exact: true })).toHaveValue('3,00');
  await expect(page.getByTestId('observation-card')).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBeNull();
  expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).__priceObservationInjected)).toBeUndefined();

  await sheet.getByRole('textbox', { name: 'Enlace de la fuente (opcional)', exact: true }).fill('https://example.com/fuente-corregida');
  await saveObservation(sheet);
  await expect(page.getByTestId('observation-card')).toHaveCount(1);
  expect((await stored(page)).observations[0]).toMatchObject({ observedOn: today, url: 'https://example.com/fuente-corregida' });
});

test('un fallo de escritura de observaciones mantiene los datos y el formulario hasta reintentar', async ({ page }) => {
  await seedObservations(page, [observation('saved-before-failure', { store: 'Tienda anterior' })], true);
  const before = await page.evaluate(key => localStorage.getItem(key), storageKey);
  const sheet = await startObservation(page, {
    store: 'Tienda pendiente', quantity: '500', unit: 'g', price: '1,80', sourceReference: 'Ticket que debe conservarse',
  });
  await page.evaluate(blocked => {
    const original = Storage.prototype.setItem;
    (window as unknown as { restorePriceObservationWrites: () => void }).restorePriceObservationWrites = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (name, value) {
      if (name === blocked) throw new Error('Fallo de escritura de prueba B06');
      original.call(this, name, value);
    };
  }, storageKey);
  await sheet.getByTestId('save-observation').click();
  await expect(sheet.getByRole('alert')).toContainText('No se pudieron guardar');
  await expect(sheet.getByRole('textbox', { name: 'Tienda', exact: true })).toHaveValue('Tienda pendiente');
  await expect(sheet.getByRole('textbox', { name: 'Precio del envase (€)', exact: true })).toHaveValue('1,80');
  await expect(sheet.getByRole('textbox', { name: 'Procedencia', exact: true })).toHaveValue('Ticket que debe conservarse');
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(before);
  await expectOtherStoresIntact(page);

  await page.evaluate(() => (window as unknown as { restorePriceObservationWrites: () => void }).restorePriceObservationWrites());
  await saveObservation(sheet);
  await expect(page.getByTestId('observation-card')).toHaveCount(2);
  expect((await stored(page)).observations.find(entry => entry.store === 'Tienda pendiente')).toMatchObject({
    quantityMilli: 500000, unit: 'g', priceCents: 180, sourceReference: 'Ticket que debe conservarse',
  });
  await page.reload();
  await openPrices(page);
  await expect(page.getByTestId('observation-card')).toHaveCount(2);
  await expectOtherStoresIntact(page);
});

test('conserva JSON corrupto y versiones incompatibles, permite recuperar y no altera compras, menús ni comparaciones', async ({ page }) => {
  for (const invalid of ['{observaciones-corruptas', JSON.stringify({ version: 999, observations: [] })]) {
    await seed(page, invalid, true);
    await expect(page.getByRole('alert')).toContainText('No se han modificado tus datos');
    await expect(page.getByTestId('add-observation')).toHaveCount(0);
    expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(invalid);
    await expectOtherStoresIntact(page);
    await page.getByRole('button', { name: 'Seguir con Ahorro', exact: true }).click();
    await page.getByRole('tab', { name: 'Mi compra', exact: true }).click();
    await expect(page.getByRole('checkbox', { name: 'Marcar Pan', exact: true })).toBeChecked();
    await openPrices(page);
    expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(invalid);
    await page.evaluate(key => localStorage.removeItem(key), storageKey);
    await page.getByRole('button', { name: 'Volver a cargar observaciones', exact: true }).click();
    await expect(page.getByTestId('add-observation')).toBeVisible();
    await expect(page.getByTestId('observation-card')).toHaveCount(0);
    await expectOtherStoresIntact(page);
  }
});

test('confirma antes de eliminar y permite deshacer el borrado con todos sus datos', async ({ page }) => {
  await seedObservations(page, [
    observation('delete-me', { store: 'Tienda que se elimina', sourceReference: 'Ticket completo que se recupera', url: 'https://example.com/ticket' }),
    observation('keep-me', { store: 'Tienda que se conserva', priceCents: 350 }),
  ]);
  const before = await stored(page);
  await page.getByRole('button', { name: 'Eliminar observación de Tienda que se elimina', exact: true }).click();
  let confirmation = page.getByTestId('price-sheet');
  await expect(confirmation.getByRole('heading', { name: '¿Eliminar esta observación?', exact: true })).toBeVisible();
  await confirmation.getByRole('button', { name: 'Conservar', exact: true }).click();
  await confirmation.waitFor({ state: 'detached' });
  expect(await stored(page)).toEqual(before);

  await page.getByRole('button', { name: 'Eliminar observación de Tienda que se elimina', exact: true }).click();
  confirmation = page.getByTestId('price-sheet');
  await confirmation.getByRole('button', { name: 'Eliminar observación', exact: true }).click();
  await confirmation.waitFor({ state: 'detached' });
  await expect(page.getByTestId('observation-card')).toHaveCount(1);
  await expect(page.getByTestId('observation-card')).toContainText('Tienda que se conserva');
  expect((await stored(page)).observations.map(entry => entry.id)).toEqual(['keep-me']);
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect.poll(async () => stored(page)).toEqual(before);
  await expect(page.getByTestId('observation-card')).toHaveCount(2);
  await page.reload();
  await openPrices(page);
  await expect(page.getByTestId('observation-card').filter({ hasText: 'Tienda que se elimina' })).toContainText('Ticket completo que se recupera');
  expect(await stored(page)).toEqual(before);
});

test('al cambiar el día retira una observación de ocho días y actualiza su estado sin editar ni recargar', async ({ page }) => {
  await seedObservations(page, [
    observation('seven-days', { store: 'Tienda observada hace siete días', observedOn: '2026-10-23', priceCents: 180 }),
    observation('fresh', { product: 'Lentejas', brand: 'Luengo', store: 'Tienda observada hoy', priceCents: 300 }),
  ]);
  const before = await page.evaluate(key => localStorage.getItem(key), storageKey);
  await expect(page.getByTestId('comparison-result')).toHaveCount(1);
  await expect(page.getByTestId('comparison-result')).toContainText('Tienda observada hace siete días');
  await page.getByTestId('comparison-reference').click();
  const reference = page.getByTestId('price-sheet');
  await reference.getByRole('button', { name: 'Comparar desde Arroz en Tienda observada hace siete días', exact: true }).click();
  await reference.waitFor({ state: 'detached' });
  const aging = page.getByTestId('observation-card').filter({ hasText: 'Tienda observada hace siete días' });
  await expect(aging).toContainText('Aportado por ti');

  await page.clock.setSystemTime(new Date('2026-10-31T00:00:00+01:00'));
  await page.clock.runFor(60_001);
  await expect(aging).toContainText('Antiguo');
  await expect(page.getByTestId('excluded-observation').filter({ hasText: 'Tienda observada hace siete días' })).toContainText('Observación antigua: tiene más de 7 días.');
  await expect(page.getByTestId('comparison-result')).toHaveCount(0);
  await expect(page.getByTestId('comparison-reference')).toContainText('Tienda observada hace siete días');
  await expect(page.getByText('La referencia no es apta para comparar.', { exact: false })).toBeVisible();
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe(before);
});
