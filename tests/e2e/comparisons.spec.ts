import { expect, test, type Page } from '@playwright/test';

const storageKey = 'jjcompraintelwgiemt.comparisons.v1';

async function createComparison(page: Page) {
  await page.getByTestId('create-comparison').click();
  await page.getByRole('textbox', { name: 'Nombre del producto' }).fill('Auriculares Sony');
  await page.getByTestId('save-comparison').click();
  await expect(page.getByRole('heading', { name: 'Auriculares Sony' })).toBeVisible();
}

async function fillOffer(page: Page, store: string, price: string, shipping: string) {
  await page.getByRole('textbox', { name: 'Nombre de la tienda' }).fill(store);
  await page.getByRole('textbox', { name: 'Enlace del producto' }).fill(`https://example.com/${store.replaceAll(' ', '-')}`);
  await page.getByRole('textbox', { name: 'Precio del producto (€)' }).fill(price);
  await page.getByRole('textbox', { name: 'Gastos de envío (€)' }).fill(shipping);
}

test('crea, ordena, empata, edita y elimina; conserva los datos al recargar', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/?view=comparisons');
  await page.getByTestId('create-comparison').click();
  await page.getByTestId('save-comparison').click();
  await expect(page.getByRole('alert')).toContainText('Escribe el nombre');
  await page.getByRole('textbox', { name: 'Nombre del producto' }).fill('Auriculares Sony');
  await page.getByTestId('save-comparison').click();
  await page.getByRole('button', { name: 'Añadir oferta', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Gastos de envío (€)' })).toHaveValue('0');
  await page.getByTestId('save-offer').click();
  await expect(page.getByRole('alert')).toContainText('nombre de la tienda');
  await fillOffer(page, 'Tienda A', '100,00', '5');
  await page.getByTestId('save-offer').click();
  await expect(page.getByTestId('offer-card')).toContainText('105,00');
  await page.getByRole('button', { name: 'Añadir oferta', exact: true }).click();
  await fillOffer(page, 'Tienda B', '99.50', '9');
  await page.getByTestId('save-offer').click();
  await expect(page.getByTestId('offer-card')).toHaveCount(2);
  await expect(page.getByTestId('offer-card').first()).toContainText('Tienda A');
  await expect(page.getByTestId('offer-card').nth(1)).toContainText('108,50');

  await page.getByRole('button', { name: 'Editar oferta de Tienda B' }).click();
  await page.getByRole('textbox', { name: 'Gastos de envío (€)' }).fill('5,50');
  await page.getByTestId('save-offer').click();
  await expect(page.getByText('Mejor total · empate', { exact: true })).toHaveCount(2);

  await context.route('https://example.com/**', route => route.fulfill({ body: 'Tienda de prueba' }));
  const newPage = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Ver en tienda', exact: true }).first().click();
  const store = await newPage;
  await store.waitForLoadState();
  expect(store.url()).toContain('example.com/Tienda-A');
  await store.close();

  await page.getByRole('button', { name: 'Renombrar comparación' }).click();
  await page.getByRole('textbox', { name: 'Nombre del producto' }).fill('Sony WH-1000XM5');
  await page.getByTestId('save-comparison').click();
  await expect(page.getByRole('heading', { name: 'Sony WH-1000XM5' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Abrir Sony WH-1000XM5/ }).click();
  await expect(page.getByTestId('offer-card')).toHaveCount(2);
  await expect(page.getByText('Mejor total · empate', { exact: true })).toHaveCount(2);

  await page.getByRole('button', { name: 'Eliminar oferta de Tienda A' }).click();
  await page.getByRole('button', { name: 'Conservar', exact: true }).click();
  await expect(page.getByTestId('offer-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'Eliminar oferta de Tienda A' }).click();
  await page.getByRole('button', { name: 'Eliminar oferta', exact: true }).click();
  await expect(page.getByTestId('offer-card')).toHaveCount(1);
  await expect(page.getByTestId('offer-card')).toContainText('Tienda B');
  await page.getByRole('button', { name: 'Eliminar comparación', exact: true }).click();
  await page.getByRole('heading', { name: '¿Eliminar comparación?' }).waitFor();
  // The underlying screen and confirmation share a label; the confirmation is last.
  await page.getByRole('button', { name: 'Eliminar comparación', exact: true }).last().click();
  await expect(page.getByText('Una buena compra empieza aquí')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Una buena compra empieza aquí')).toBeVisible();
  expect(errors).toEqual([]);
});

test('un error al guardar mantiene el formulario y permite reintentar', async ({ page }) => {
  await page.goto('/?view=comparisons');
  await createComparison(page);
  await page.getByRole('button', { name: 'Añadir oferta', exact: true }).click();
  await fillOffer(page, 'Tienda A', '25.99', '0');
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    (window as unknown as { restoreStorage: () => void }).restoreStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = () => { throw new Error('Disco lleno'); };
  });
  await page.getByTestId('save-offer').click();
  await expect(page.getByRole('alert')).toContainText('No se pudieron guardar');
  await expect(page.getByRole('textbox', { name: 'Precio del producto (€)' })).toHaveValue('25.99');
  const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), storageKey);
  expect(stored.comparisons[0].offers).toHaveLength(0);
  await page.evaluate(() => (window as unknown as { restoreStorage: () => void }).restoreStorage());
  await page.getByTestId('save-offer').click();
  await expect(page.getByTestId('offer-card')).toContainText('25,99');
});

test('no reemplaza datos corruptos y permite volver a cargar', async ({ page }) => {
  await page.goto('/?view=comparisons');
  await page.getByTestId('create-comparison').waitFor();
  await page.evaluate(key => localStorage.setItem(key, '{corrupto'), storageKey);
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('No se han modificado');
  await expect(page.getByTestId('create-comparison')).toHaveCount(0);
  expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe('{corrupto');
  await page.evaluate(key => localStorage.removeItem(key), storageKey);
  await page.getByRole('button', { name: 'Volver a cargar' }).click();
  await expect(page.getByTestId('create-comparison')).toBeVisible();
});
