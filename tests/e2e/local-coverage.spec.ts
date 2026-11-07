import { expect, test, type Page } from '@playwright/test';

const shoppingKey = 'jjcompraintelwgiemt.shopping.v1';
const expensesKey = 'jjcompraintelwgiemt.expenses.v1';
const settingsKey = 'jjcompraintelwgiemt.local-settings.v1';
const businessKeys = [shoppingKey, expensesKey, settingsKey, 'jjcompraintelwgiemt.menus.v1',
  'jjcompraintelwgiemt.comparisons.v1', 'jjcompraintelwgiemt.price-observations.v1'];

function item(id: string, name: string, overrides = {}) {
  return { id, name, quantityMilli: 1000, unit: 'ud', category: 'Otros', note: '',
    checked: false, unitPriceCents: null, priceKind: null, ...overrides };
}
function fixture() {
  return { version: 1, state: { activeListId: 'active-list', lists: [
    { id: 'active-list', name: 'Compra actual', budgetCents: 5000,
      items: [item('rice', 'Arroz', { unit: 'kg', category: 'Despensa', unitPriceCents: 200, priceKind: 'entered', checked: true })] },
    { id: 'other-list', name: 'Compra de mañana', budgetCents: null,
      items: [item('milk', 'Leche de avena', { unit: 'L', category: 'Lácteos y huevos', unitPriceCents: 150, priceKind: 'entered' })] },
  ] } };
}
async function raw(page: Page, key: string) { return page.evaluate(key => localStorage.getItem(key), key); }
async function shopping(page: Page) { return JSON.parse((await raw(page, shoppingKey))!); }
async function expenses(page: Page) { return JSON.parse((await raw(page, expensesKey)) ?? '{"data":{"expenses":[]}}').data.expenses as { id: string; amountCents: number; source: string }[]; }
async function snapshot(page: Page) {
  return page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), businessKeys);
}
async function seed(page: Page) {
  await page.goto('/');
  await page.getByTestId('open-profile').waitFor();
  await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), { key: shoppingKey, data: fixture() });
  await page.reload();
  await page.getByTestId('open-profile').waitFor();
}
async function openBudget(page: Page) {
  await page.getByTestId('tab-savings').click();
  await page.getByTestId('open-budget-page').click();
  await page.getByTestId('record-expense').waitFor();
}
async function noCaptureCapabilities(page: Page) {
  await page.addInitScript(() => {
    const counters = { media: 0, notifications: 0 };
    Object.defineProperty(window, '__captureCounters', { value: counters });
    Object.defineProperty(window, 'SpeechRecognition', { value: undefined, configurable: true });
    Object.defineProperty(window, 'webkitSpeechRecognition', { value: undefined, configurable: true });
    Object.defineProperty(window, 'BarcodeDetector', { value: undefined, configurable: true });
    if (navigator.mediaDevices) Object.defineProperty(navigator.mediaDevices, 'getUserMedia', {
      configurable: true, value: async () => { counters.media++; throw new Error('Unexpected permission request'); },
    });
    if (typeof Notification !== 'undefined') Object.defineProperty(Notification, 'requestPermission', {
      configurable: true, value: async () => { counters.notifications++; return 'denied'; },
    });
  });
}
async function expectNoPermissionRequest(page: Page) {
  expect(await page.evaluate(() => (window as unknown as { __captureCounters: unknown }).__captureCounters))
    .toEqual({ media: 0, notifications: 0 });
}

test('buscar en otras listas edita el producto de su lista sin cambiar la lista activa', async ({ page }) => {
  await seed(page);
  const original = await shopping(page);
  await page.getByTestId('open-search').click();
  await page.getByTestId('product-search-input').fill('avena');
  await expect(page.getByTestId('product-result-rice')).toHaveCount(0);
  await page.getByTestId('product-result-milk').click();
  await expect(page.getByTestId('product-detail-screen')).toContainText('Sin precio verificado');
  await expect(page.getByTestId('product-detail-screen')).toContainText('Compra de mañana');
  await page.getByTestId('product-review-edit').click();
  const sheet = page.getByTestId('app-sheet');
  await sheet.getByRole('textbox', { name: 'Nota', exact: true }).fill('Revisar ingredientes');
  await sheet.getByTestId('save-item').click();
  await sheet.waitFor({ state: 'detached' });
  const saved = await shopping(page);
  expect(saved.state.activeListId).toBe('active-list');
  expect(saved.state.lists[0]).toEqual(original.state.lists[0]);
  expect(saved.state.lists[1].items[0]).toMatchObject({ id: 'milk', note: 'Revisar ingredientes' });
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect.poll(async () => (await shopping(page)).state).toEqual(original.state);
});

test('favoritos y avisos locales persisten sin solicitar notificaciones del dispositivo', async ({ page }) => {
  await noCaptureCapabilities(page);
  await seed(page);
  const before = await raw(page, shoppingKey);
  await page.getByTestId('open-profile').click();
  await page.getByTestId('profile-stores').click();
  await page.getByTestId('favorite-hiperdino').click();
  await expect.poll(async () => JSON.parse((await raw(page, settingsKey)) ?? '{"preferences":{"favoriteStores":[]}}').preferences.favoriteStores).toEqual(['hiperdino']);
  await page.reload();
  await page.getByTestId('open-profile').click();
  await page.getByTestId('profile-stores').click();
  await expect(page.getByTestId('favorite-hiperdino')).toHaveAttribute('aria-label', /Quitar/);
  await expect(page.getByTestId('stores-screen')).toContainText('Sin acuerdos conectados');
  await expect(page.getByTestId('stores-screen')).toContainText('Sin catálogo conectado');
  expect(await raw(page, shoppingKey)).toBe(before);
  await page.getByTestId('open-notifications').click();
  await expect(page.getByTestId('local-notices')).toHaveCount(0);
  await page.getByTestId('in-app-reminders').click();
  await expect(page.getByTestId('notice-list-other-list')).toBeVisible();
  await page.getByTestId('notice-filter-recipes').click();
  await expect(page.getByTestId('local-notices')).toHaveCount(0);
  await page.getByTestId('notice-filter-list').click();
  await page.getByTestId('notice-list-other-list').click();
  await expect.poll(async () => (await shopping(page)).state.activeListId).toBe('other-list');
  await expect(page.getByTestId('shopping-item')).toContainText('Leche de avena');
  await expectNoPermissionRequest(page);
  await page.reload();
  expect(JSON.parse((await raw(page, settingsKey))!).preferences).toEqual({ favoriteStores: ['hiperdino'], inAppReminders: true });
  await expectNoPermissionRequest(page);
});

test('registrar gasto exige confirmar un pago y revisar; historial permite editar, borrar y deshacer', async ({ page }) => {
  await seed(page);
  const before = await raw(page, shoppingKey);
  await openBudget(page);
  await expect(page.getByTestId('budget-actual-value')).toHaveText('Sin registrar');
  await page.getByTestId('record-expense').click();
  const editor = page.getByTestId('expense-editor');
  await editor.getByTestId('expense-amount').fill('12,35');
  await editor.getByTestId('expense-store').fill('Tienda de prueba');
  await editor.getByTestId('expense-review').click();
  await expect(editor.getByRole('alert')).toBeVisible();
  expect(await expenses(page)).toHaveLength(0);
  await editor.getByTestId('expense-paid-confirmation').click();
  await editor.getByTestId('expense-review').click();
  await expect(editor.getByRole('heading', { name: 'Revisar antes de guardar', exact: true })).toBeVisible();
  expect(await expenses(page)).toHaveLength(0);
  await editor.getByTestId('expense-confirm-save').click();
  await editor.waitFor({ state: 'detached' });
  expect(await expenses(page)).toMatchObject([{ amountCents: 1235, source: 'user-confirmed', listId: 'active-list' }]);
  expect(await raw(page, shoppingKey)).toBe(before);
  await expect(page.getByTestId('budget-actual-value')).toContainText('12,35');
  await page.getByTestId('tab-home').click();
  await expect(page.getByTestId('home-actual-spend')).toContainText('12,35');
  await page.getByTestId('tab-savings').click();
  await expect(page.getByTestId('actual-spend-total')).toContainText('12,35');
  await expect(page.getByTestId('spent-total')).toContainText('2,00');
  await page.getByTestId('open-history').click();
  await expect(page.getByTestId('expenses-period-total')).toContainText('12,35');
  await page.getByRole('button', { name: /^Editar gasto de/ }).click();
  await editor.getByTestId('expense-amount').fill('13,50');
  await editor.getByTestId('expense-paid-confirmation').click();
  await editor.getByTestId('expense-review').click();
  await editor.getByTestId('expense-confirm-save').click();
  await editor.waitFor({ state: 'detached' });
  await expect(page.getByTestId('expenses-period-total')).toContainText('13,50');
  await page.getByRole('button', { name: /^Eliminar gasto de/ }).click();
  await page.getByTestId('expense-confirm-delete').click();
  await page.getByTestId('expense-delete-confirmation').waitFor({ state: 'detached' });
  await expect(page.getByTestId('expenses-empty')).toBeVisible();
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect(page.getByTestId('expenses-period-total')).toContainText('13,50');
  await page.reload();
  expect(await expenses(page)).toHaveLength(1);
  expect((await expenses(page))[0].amountCents).toBe(1350);
  expect(await raw(page, shoppingKey)).toBe(before);
});

test('cancelar un gasto conserva el borrador hasta descartarlo y no escribe registros', async ({ page }) => {
  await seed(page);
  const before = await snapshot(page);
  await openBudget(page);
  await page.getByTestId('record-expense').click();
  const editor = page.getByTestId('expense-editor');
  await editor.getByTestId('expense-amount').fill('8,40');
  await editor.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await editor.getByRole('button', { name: 'Conservar y seguir', exact: true }).click();
  await expect(editor.getByTestId('expense-amount')).toHaveValue('8,40');
  await editor.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await editor.getByRole('button', { name: 'Descartar formulario', exact: true }).click();
  await editor.waitFor({ state: 'detached' });
  expect(await snapshot(page)).toEqual(before);
});

test('alta manual y presupuesto permiten deshacer; duplicados g/kg exigen una decisión sin sumarse', async ({ page }) => {
  await seed(page);
  const original = (await shopping(page)).state;
  await page.getByTestId('tab-list').click();
  await page.getByTestId('add-item').click();
  const editor = page.getByTestId('app-sheet');
  await editor.getByRole('textbox', { name: 'Nombre del producto', exact: true }).fill('Manzanas');
  await editor.getByTestId('save-item').click();
  await editor.waitFor({ state: 'detached' });
  await expect.poll(async () => (await shopping(page)).state.lists[0].items.length).toBe(2);
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect.poll(async () => (await shopping(page)).state).toEqual(original);
  await page.getByTestId('edit-budget').click();
  await editor.getByRole('textbox', { name: 'Presupuesto (€)', exact: true }).fill('75');
  await editor.getByTestId('save-budget').click();
  await editor.waitFor({ state: 'detached' });
  await expect.poll(async () => (await shopping(page)).state.lists[0].budgetCents).toBe(7500);
  await page.getByRole('button', { name: 'Deshacer', exact: true }).click();
  await expect.poll(async () => (await shopping(page)).state).toEqual(original);
  await page.getByTestId('add-item').click();
  await editor.getByRole('textbox', { name: 'Nombre del producto', exact: true }).fill('ARROZ');
  await editor.getByRole('textbox', { name: 'Cantidad', exact: true }).fill('500');
  await editor.getByRole('button', { name: 'Unidad g', exact: true }).click();
  await editor.getByTestId('save-item').click();
  await expect(editor).toContainText('no se suman automáticamente');
  expect((await shopping(page)).state).toEqual(original);
  await editor.getByRole('button', { name: 'Editar existente', exact: true }).click();
  await expect(editor.getByRole('textbox', { name: 'Cantidad', exact: true })).toHaveValue('1');
  await editor.getByRole('textbox', { name: 'Cantidad', exact: true }).fill('2');
  await editor.getByTestId('save-item').click();
  await editor.waitFor({ state: 'detached' });
  expect((await shopping(page)).state.lists[0].items).toHaveLength(1);
  expect((await shopping(page)).state.lists[0].items[0]).toMatchObject({ id: 'rice', unit: 'kg', quantityMilli: 2000 });
});

test('entrada manual de voz pasa por revisión y cancelar no añade; solo la confirmación añade', async ({ page }) => {
  await noCaptureCapabilities(page);
  await seed(page);
  const before = await raw(page, shoppingKey);
  await page.getByTestId('open-voice').click();
  await page.getByTestId('voice-transcript').fill('2 kg manzanas');
  expect(await raw(page, shoppingKey)).toBe(before);
  await page.getByTestId('voice-review').click();
  const review = page.getByTestId('menu-sheet');
  await expect(review.getByRole('heading', { name: 'Esto he entendido', exact: true })).toBeVisible();
  expect(await raw(page, shoppingKey)).toBe(before);
  await review.getByRole('button', { name: 'Cancelar propuesta', exact: true }).click();
  await review.getByRole('button', { name: 'Cancelar sin añadir', exact: true }).click();
  await review.waitFor({ state: 'detached' });
  expect(await raw(page, shoppingKey)).toBe(before);
  await page.getByTestId('tab-home').click();
  await page.getByTestId('open-voice').click();
  await expect(page.getByTestId('voice-transcript')).toHaveValue('2 kg manzanas');
  await page.getByTestId('voice-review').click();
  await review.getByTestId('confirm-ingredients').click();
  await review.waitFor({ state: 'detached' });
  const saved = await shopping(page);
  expect(saved.state.lists[0].items).toHaveLength(2);
  expect(saved.state.lists[0].items[1]).toMatchObject({ name: 'manzanas', quantityMilli: 2000, unit: 'kg', unitPriceCents: null });
  await expectNoPermissionRequest(page);
});

test('escáner sin capacidad permite un código válido sin identificar ni añadir automáticamente', async ({ page }) => {
  await noCaptureCapabilities(page);
  await seed(page);
  const before = await raw(page, shoppingKey);
  await page.getByTestId('open-scanner').click();
  await expect(page.getByTestId('scanner-capture-toggle')).toHaveCount(0);
  await page.getByTestId('scanner-code').fill('4006381333932');
  await page.getByRole('button', { name: 'Comprobar código', exact: true }).click();
  await expect(page.getByTestId('scanner-screen')).toContainText('Revisa el código');
  await page.getByTestId('scanner-code').fill('4006381333931');
  await page.getByRole('button', { name: 'Comprobar código', exact: true }).click();
  await expect(page.getByTestId('scanner-screen')).toContainText('Código no reconocido en un catálogo');
  expect(await raw(page, shoppingKey)).toBe(before);
  await page.getByTestId('scanner-add-manually').click();
  const editor = page.getByTestId('app-sheet');
  await expect(editor.getByRole('textbox', { name: 'Nombre del producto', exact: true })).toHaveValue('');
  await expect(editor.getByRole('textbox', { name: 'Nota', exact: true })).toHaveValue('EAN/UPC: 4006381333931');
  expect(await raw(page, shoppingKey)).toBe(before);
  await editor.getByRole('textbox', { name: 'Nombre del producto', exact: true }).fill('Producto escrito por mí');
  await editor.getByTestId('save-item').click();
  await editor.waitFor({ state: 'detached' });
  expect((await shopping(page)).state.lists[0].items).toHaveLength(2);
  await expectNoPermissionRequest(page);
});

test('escanear sin una lista conserva el código al crearla y exige rellenar el producto', async ({ page }) => {
  await noCaptureCapabilities(page);
  await page.goto('/');
  await page.getByTestId('open-scanner').click();
  await page.getByTestId('scanner-code').fill('4006381333931');
  await page.getByTestId('scanner-add-manually').click();
  const editor = page.getByTestId('app-sheet');
  await editor.getByRole('textbox', { name: 'Nombre de la lista', exact: true }).fill('Mi primera lista');
  await editor.getByTestId('save-list').click();
  await expect(editor.getByRole('textbox', { name: 'Nombre del producto', exact: true })).toHaveValue('');
  await expect(editor.getByRole('textbox', { name: 'Nota', exact: true })).toHaveValue('EAN/UPC: 4006381333931');
  expect((await shopping(page)).state.lists[0].items).toHaveLength(0);
  await editor.getByRole('textbox', { name: 'Nombre del producto', exact: true }).fill('Producto revisado');
  await editor.getByTestId('save-item').click();
  await editor.waitFor({ state: 'detached' });
  expect((await shopping(page)).state.lists[0].items).toHaveLength(1);
  await expectNoPermissionRequest(page);
});

test('preferencias futuras y gastos corruptos se conservan, bloquean su escritura y permiten seguir con la compra', async ({ page }) => {
  await seed(page);
  const corruptSettings = '{"version":2,"preferences":{"favoriteStores":["hiperdino"],"inAppReminders":true}}';
  const corruptExpenses = '{"version":1,"data":{"expenses":[{"id":"invalid","amountCents":-500}]}}';
  await page.evaluate(({ settingsKey, expensesKey, corruptSettings, corruptExpenses }) => {
    localStorage.setItem(settingsKey, corruptSettings);
    localStorage.setItem(expensesKey, corruptExpenses);
  }, { settingsKey, expensesKey, corruptSettings, corruptExpenses });
  await page.reload();
  await expect(page.getByTestId('home-actual-spend')).toContainText('Registro no disponible');
  await page.getByTestId('open-profile').click();
  await page.getByTestId('profile-stores').click();
  await expect(page.getByTestId('stores-screen').getByRole('alert')).toBeVisible();
  await expect(page.getByTestId('favorite-hiperdino')).toHaveAttribute('aria-disabled', 'true');
  expect(await raw(page, settingsKey)).toBe(corruptSettings);
  await page.getByTestId('tab-savings').click();
  await page.getByTestId('open-budget-page').click();
  await expect(page.getByTestId('budget-actual-value')).toHaveText('No disponible');
  await expect(page.getByTestId('record-expense')).toHaveAttribute('aria-disabled', 'true');
  expect(await raw(page, expensesKey)).toBe(corruptExpenses);
  await page.getByTestId('tab-list').click();
  await page.getByRole('checkbox', { name: 'Marcar Arroz', exact: true }).click();
  await expect.poll(async () => (await shopping(page)).state.lists[0].items[0].checked).toBe(false);
  expect(await raw(page, settingsKey)).toBe(corruptSettings);
  expect(await raw(page, expensesKey)).toBe(corruptExpenses);
});

test('los nueve estados están etiquetados como ejemplos y no alteran datos ni permisos', async ({ page }) => {
  await noCaptureCapabilities(page);
  await seed(page);
  const before = await snapshot(page);
  await page.getByTestId('open-profile').click();
  await page.getByTestId('open-state-review').click();
  const view = page.getByTestId('state-review-screen');
  await expect(view).toContainText('ejemplo; no modifica tus datos');
  for (const kind of ['empty', 'no_price', 'offline', 'network', 'microphone_denied', 'camera_denied', 'unknown_barcode', 'duplicate', 'success']) {
    await view.getByTestId(`state-choice-${kind}`).click();
    await expect(view.getByTestId(`state-card-${kind}`)).toBeVisible();
    expect(await snapshot(page)).toEqual(before);
  }
  await view.getByTestId('state-action-success').click();
  await expect(view.getByTestId('state-card-empty')).toBeVisible();
  await view.getByTestId('state-choice-network').click();
  await view.getByTestId('state-action-network').click();
  await expect(view).toContainText('No se ha enviado ninguna solicitud de red');
  expect(await snapshot(page)).toEqual(before);
  await expectNoPermissionRequest(page);
});
