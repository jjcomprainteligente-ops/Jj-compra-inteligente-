/// <reference types="node" />
import { expect, test, type BrowserContext, type Download, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { expenseToday } from '../../src/domain/expenses';
import { createTranslator } from '../../src/i18n/core';
import { resources } from '../../src/i18n/resources';
import { LANGUAGES, type Language } from '../../src/i18n/types';

// Every context is isolated and receives only the fixtures below. No owner data is read.
const prefix = 'jjcompraintelwgiemt.';
const keys = {
  shopping: prefix + 'shopping.v1', menus: prefix + 'menus.v1', comparisons: prefix + 'comparisons.v1',
  observations: prefix + 'price-observations.v1', expenses: prefix + 'expenses.v1', settings: prefix + 'local-settings.v1',
  preferences: prefix + 'preferences.v1',
} as const;
type Scope = Exclude<keyof typeof keys, 'preferences'>;
const storageKeys = Object.values(keys);
const otherKey = 'qa.other-application.private-data';
const otherValue = 'QA_EXCLUDED_SENTINEL_XYZ';
const firstRecipes = ['arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate'];
const confirmationWords = { es: 'BORRAR', en: 'DELETE', de: 'LÖSCHEN', fr: 'EFFACER' } as const;

function fixtures(language: Language = 'es', savedPlan = true): Record<string, string> {
  return {
    [keys.shopping]: JSON.stringify({ version: 1, state: { activeListId: 'privacy-list', lists: [{
      id: 'privacy-list', name: 'Lista aislada de prueba', budgetCents: 6000, items: [{
        id: 'qa-rice', name: 'Arroz', quantityMilli: 1000, unit: 'kg', category: 'Despensa', note: 'Nota QA · Größe / crème / ñ',
        checked: true, unitPriceCents: 250, priceKind: 'entered',
      }],
    }] } }),
    [keys.menus]: JSON.stringify({ version: 1, plan: savedPlan ? { servings: 3, recipeIds: firstRecipes } : null }),
    [keys.comparisons]: JSON.stringify({ version: 1, comparisons: [{ id: 'qa-comparison', name: 'Comparación aislada QA', offers: [] }] }),
    [keys.observations]: JSON.stringify({ version: 1, observations: [{ id: 'qa-observation', product: 'Arroz de prueba', brand: 'Marca ficticia QA',
      format: 'Bolsa', quality: 'Blanco de prueba', store: 'Comercio ficticio QA', quantityMilli: 1000, unit: 'kg', priceCents: 250,
      observedOn: expenseToday(), sourceKind: 'manual', sourceReference: 'Dato ficticio para prueba aislada', url: null }] }),
    [keys.expenses]: JSON.stringify({ version: 1, data: { expenses: [
      { id: 'qa-expense-a', amountCents: 1234, date: expenseToday(), store: 'Comercio ficticio QA', note: 'Gasto ficticio aislado',
        listId: 'privacy-list', listName: 'Lista aislada de prueba', source: 'user-confirmed' },
      { id: 'qa-expense-b', amountCents: 766, date: expenseToday(), store: 'Comercio ficticio QA', note: '',
        listId: null, listName: null, source: 'user-confirmed' },
    ] } }),
    [keys.settings]: JSON.stringify({ version: 1, preferences: { favoriteStores: ['hiperdino'], inAppReminders: true } }),
    [keys.preferences]: JSON.stringify({ version: 1, language, welcomeCompleted: true }),
    [otherKey]: otherValue,
  };
}

async function seed(page: Page, data = fixtures()) {
  await page.goto('/');
  await expect(page.getByTestId('open-profile')).toBeVisible();
  await page.evaluate(entries => { for (const [key, raw] of Object.entries(entries)) localStorage.setItem(key, raw); }, data);
  await page.reload();
  await expect(page.getByTestId('open-profile')).toBeVisible();
}
async function snapshot(page: Page) {
  return page.evaluate(names => Object.fromEntries(names.map(name => [name, localStorage.getItem(name)])), [...storageKeys, otherKey]);
}
async function raw(page: Page, key: string) { return page.evaluate(name => localStorage.getItem(name), key); }
async function stored(page: Page, scope: Scope) { return JSON.parse((await raw(page, keys[scope]))!); }
async function openPrivacy(page: Page) {
  await page.getByTestId('open-profile').click();
  await page.getByTestId('profile-privacy').click();
  await expect(page.getByTestId('privacy-screen')).toBeVisible();
  await expect(page.getByTestId('privacy-export-all')).toBeEnabled();
}
async function openFilters(page: Page) {
  await page.getByTestId('menu-filters-open').click();
  const sheet = page.getByTestId('menu-filter-sheet');
  await expect(sheet).toBeVisible();
  return sheet;
}
async function applyFilters(page: Page) {
  await page.getByTestId('menu-filters-apply').click();
  await expect(page.getByTestId('menu-filter-sheet')).toHaveCount(0);
}
async function deletionReview(page: Page, scope: Scope) {
  await page.getByTestId('privacy-delete-' + scope).click();
  const dialog = page.getByTestId('privacy-delete-dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByTestId('privacy-delete-review-next').click();
  return dialog;
}
async function allowDeletion(dialog: Locator, language: Language = 'es') {
  await dialog.getByTestId('privacy-delete-word').fill(confirmationWords[language]);
  await dialog.getByTestId('privacy-delete-ack').check();
  await expect(dialog.getByTestId('privacy-delete-ack')).toHaveAttribute('aria-checked', 'true');
  await expect(dialog.getByTestId('privacy-delete-confirm')).toBeEnabled();
}
async function finishDeletion(page: Page, scope: Scope, language: Language = 'es') {
  const dialog = await deletionReview(page, scope);
  await allowDeletion(dialog, language);
  await dialog.getByTestId('privacy-delete-confirm').click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByTestId('privacy-delete-result')).toBeVisible();
}
async function backupText(download: Download) {
  expect(download.suggestedFilename()).toMatch(/^jj[-_].*\.json$/);
  const filename = await download.path();
  expect(filename).not.toBeNull();
  return fs.readFile(filename!, 'utf8');
}
async function exportBackup(page: Page, scope?: Scope) {
  const pending = page.waitForEvent('download');
  await page.getByTestId(scope ? 'privacy-export-' + scope : 'privacy-export-all').click();
  return backupText(await pending);
}
async function addItem(page: Page, name: string) {
  await page.getByTestId('tab-list').click();
  await page.getByTestId('add-item').click();
  const sheet = page.getByTestId('app-sheet');
  await sheet.getByRole('textbox', { name: 'Nombre del producto', exact: true }).fill(name);
  await sheet.getByTestId('save-item').click();
  await expect(sheet).toHaveCount(0);
}

function assertEmptyDocument(scope: Scope, value: unknown) {
  switch (scope) {
    case 'shopping': expect(value).toEqual({ version: 1, state: { lists: [], activeListId: null } }); break;
    case 'menus': expect(value).toEqual({ version: 1, plan: null }); break;
    case 'comparisons': expect(value).toEqual({ version: 1, comparisons: [] }); break;
    case 'observations': expect(value).toEqual({ version: 1, observations: [] }); break;
    case 'expenses': expect(value).toEqual({ version: 1, data: { expenses: [] } }); break;
    case 'settings': expect(value).toEqual({ version: 1, preferences: { favoriteStores: [], inAppReminders: false } }); break;
  }
}

test('los filtros se aplican solo a la sesión; menos de cinco recetas no reemplaza el menú ni guarda datos', async ({ page }) => {
  await seed(page, fixtures('es', false));
  const before = await snapshot(page);
  await page.getByTestId('tab-menus').click();
  const filters = await openFilters(page);
  await filters.getByTestId('menu-filter-time-20').click();
  await applyFilters(page);
  expect(await snapshot(page)).toEqual(before);
  await page.getByTestId('prepare-menu').click();
  await expect(page.getByRole('alert')).toBeVisible();
  expect(await raw(page, keys.menus)).toBe(before[keys.menus]);
  await page.getByTestId('menus-section-discover').click();
  await expect(page.getByRole('button', { name: /^Receta de / })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Receta de Cuscús con verduras', exact: true })).toBeVisible();
  const emptyFilters = await openFilters(page);
  await emptyFilters.getByTestId('menu-filter-exclude-zanahoria').click();
  await applyFilters(page);
  await expect(page.getByTestId('menu-catalog-empty')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Receta de / })).toHaveCount(0);
  await page.getByTestId('menu-catalog-reset').click();
  await expect(page.getByRole('button', { name: /^Receta de / })).toHaveCount(7);
  expect(await snapshot(page)).toEqual(before);
  // Reapply one filter to prove leaving/reopening the session clears it.
  const sessionFilters = await openFilters(page);
  await sessionFilters.getByTestId('menu-filter-time-20').click();
  await applyFilters(page);
  await page.reload();
  await page.getByTestId('tab-menus').click();
  await page.getByTestId('menus-section-discover').click();
  await expect(page.getByRole('button', { name: /^Receta de / })).toHaveCount(7);
  expect(await snapshot(page)).toEqual(before);
});

test('preferencias y exclusiones filtran el catálogo sin cambiar las cinco cenas guardadas', async ({ page }) => {
  await seed(page);
  const before = await snapshot(page);
  await page.getByTestId('tab-menus').click();
  let filters = await openFilters(page);
  await filters.getByTestId('menu-filter-preference-vegetarian').click();
  await filters.getByTestId('menu-filter-exclude-huevos').click();
  await applyFilters(page);
  await page.getByTestId('menus-section-discover').click();
  await expect(page.getByRole('button', { name: 'Receta de Pollo con papas', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Receta de Tortilla con ensalada', exact: true })).toHaveCount(0);
  expect(await snapshot(page)).toEqual(before);
  filters = await openFilters(page);
  await filters.getByTestId('menu-filter-preference-vegan').click();
  await applyFilters(page);
  await expect(page.getByRole('button', { name: 'Receta de Pasta con tomate', exact: true })).toHaveCount(0);
  expect(await snapshot(page)).toEqual(before);
});

test('una nueva semana filtrada exige propuesta y confirmación; cancelar conserva el plan exacto', async ({ page }) => {
  await seed(page);
  const before = await snapshot(page);
  await page.getByTestId('tab-menus').click();
  const filters = await openFilters(page);
  await filters.getByTestId('menu-filter-exclude-huevos').click();
  await applyFilters(page);
  await page.getByTestId('menu-new-proposal').click();
  const proposal = page.getByTestId('menu-plan-proposal-sheet');
  await expect(proposal).toBeVisible();
  expect(await snapshot(page)).toEqual(before);
  await proposal.getByTestId('cancel-menu-plan').click();
  await expect(proposal).toHaveCount(0);
  expect(await snapshot(page)).toEqual(before);
  await page.getByTestId('menu-new-proposal').click();
  await page.getByTestId('confirm-menu-plan').click();
  await expect(proposal).toHaveCount(0);
  const plan = (await stored(page, 'menus')).plan;
  expect(plan.servings).toBe(3);
  expect(plan.recipeIds).toHaveLength(5);
  expect(new Set(plan.recipeIds).size).toBe(5);
  expect(plan.recipeIds).not.toContain('tortilla-ensalada');
  for (const name of storageKeys.filter(key => key !== keys.menus)) expect(await raw(page, name)).toBe(before[name]);
});

test('una sustitución solo ofrece recetas compatibles y no duplica las otras cenas', async ({ page }) => {
  await seed(page);
  const before = await raw(page, keys.shopping);
  await page.getByTestId('tab-menus').click();
  const filters = await openFilters(page);
  await filters.getByTestId('menu-filter-preference-vegan').click();
  await applyFilters(page);
  await page.getByRole('button', { name: 'Cambiar plato del lunes', exact: true }).click();
  const sheet = page.getByTestId('menu-sheet');
  await expect(sheet.getByRole('button', { name: 'Pollo con papas', exact: true })).toHaveCount(0);
  await expect(sheet.getByRole('button', { name: 'Lentejas de casa', exact: true })).toHaveCount(0);
  await sheet.getByRole('button', { name: 'Cuscús con verduras', exact: true }).click();
  await expect(sheet).toHaveCount(0);
  const ids = (await stored(page, 'menus')).plan.recipeIds as string[];
  expect(ids[0]).toBe('cuscus-verduras');
  expect(new Set(ids).size).toBe(5);
  expect(await raw(page, keys.shopping)).toBe(before);
});

test('volver de privacidad al perfil conserva la sección de origen y evita un bucle de navegación', async ({ page }) => {
  await seed(page);
  const before = await snapshot(page);
  await page.getByTestId('tab-savings').click();
  await openPrivacy(page);
  await page.getByTestId('subpage-back').click();
  await expect(page.getByTestId('profile-privacy')).toBeVisible();
  await page.getByTestId('profile-back').click();
  await expect(page.getByTestId('screen-title')).toHaveText('Ahorro');
  await expect(page.getByTestId('tab-savings')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('privacy-screen')).toHaveCount(0);
  expect(await snapshot(page)).toEqual(before);
});

test('exportar descarga siete documentos exactos y excluye datos de otras aplicaciones sin escribir almacenamiento', async ({ page }) => {
  await seed(page);
  const before = await snapshot(page);
  await openPrivacy(page);
  const text = await exportBackup(page);
  const backup = JSON.parse(text);
  expect(backup).toMatchObject({ format: 'jj-local-backup', version: 1, currency: 'EUR' });
  expect(Number.isFinite(Date.parse(backup.createdAt))).toBe(true);
  expect(backup.documents.map((entry: { key: string }) => entry.key).sort()).toEqual(storageKeys.slice().sort());
  expect(backup.documents).toHaveLength(7);
  for (const entry of backup.documents) expect(entry.raw).toBe(before[entry.key]);
  expect(text).not.toContain(otherKey);
  expect(text).not.toContain(otherValue);
  expect(await snapshot(page)).toEqual(before);
});

test('un documento corrupto puede exportarse íntegro y bloquea su borrado sin ocultar los datos anteriores', async ({ page }) => {
  const source = fixtures();
  const corrupt = '{"version":1,"state":corrupto QA · ñ';
  source[keys.shopping] = corrupt;
  await seed(page, source);
  await page.getByTestId('data-error-privacy').click();
  await expect(page.getByTestId('privacy-screen')).toBeVisible();
  await expect(page.getByTestId('privacy-delete-shopping')).toBeDisabled();
  const text = await exportBackup(page, 'shopping');
  expect(JSON.parse(text).documents).toEqual([{ key: keys.shopping, raw: corrupt }]);
  expect(await snapshot(page)).toEqual(source);
});

test('el borrado requiere palabra y casilla; cancelar en ambos pasos no modifica ningún documento', async ({ page }) => {
  await seed(page);
  const before = await snapshot(page);
  await openPrivacy(page);
  await page.getByTestId('privacy-delete-expenses').click();
  let dialog = page.getByTestId('privacy-delete-dialog');
  await dialog.getByTestId('privacy-delete-cancel').click();
  await expect(dialog).toHaveCount(0);
  expect(await snapshot(page)).toEqual(before);
  dialog = await deletionReview(page, 'expenses');
  const button = dialog.getByTestId('privacy-delete-confirm');
  await expect(button).toBeDisabled();
  await dialog.getByTestId('privacy-delete-word').fill('BORRAR');
  await expect(button).toBeDisabled();
  await dialog.getByTestId('privacy-delete-ack').check();
  await expect(button).toBeEnabled();
  await dialog.getByTestId('privacy-delete-word').fill('palabra incorrecta');
  await expect(button).toBeDisabled();
  await dialog.getByTestId('privacy-delete-cancel').click();
  await expect(dialog).toHaveCount(0);
  expect(await snapshot(page)).toEqual(before);
});

test('borrar compras actualiza la app y retira deshacer sin restaurar listas eliminadas ni tocar otras categorías', async ({ page }) => {
  await seed(page);
  await addItem(page, 'Producto QA para deshacer');
  await expect(page.getByRole('button', { name: 'Deshacer', exact: true })).toBeVisible();
  const before = await snapshot(page);
  await openPrivacy(page);
  await finishDeletion(page, 'shopping');
  assertEmptyDocument('shopping', await stored(page, 'shopping'));
  for (const name of [...storageKeys, otherKey].filter(key => key !== keys.shopping)) expect(await raw(page, name)).toBe(before[name]);
  await expect(page.getByRole('button', { name: 'Deshacer', exact: true })).toHaveCount(0);
  await page.getByTestId('tab-list').click();
  await expect(page.getByTestId('shopping-item')).toHaveCount(0);
  await expect(page.getByTestId('create-list')).toBeVisible();
  await page.reload();
  assertEmptyDocument('shopping', await stored(page, 'shopping'));
});

test('borrar gastos confirmados retira el importe real y conserva los productos marcados y sus precios', async ({ page }) => {
  await seed(page);
  const before = await snapshot(page);
  await page.getByTestId('tab-savings').click();
  await expect(page.getByTestId('actual-spend-total')).toContainText('12,34');
  await expect(page.getByTestId('spent-total')).toContainText('2,50');
  await openPrivacy(page);
  await finishDeletion(page, 'expenses');
  assertEmptyDocument('expenses', await stored(page, 'expenses'));
  for (const name of [...storageKeys, otherKey].filter(key => key !== keys.expenses)) expect(await raw(page, name)).toBe(before[name]);
  await page.getByTestId('tab-savings').click();
  await expect(page.getByTestId('actual-spend-total')).toHaveText('Sin registrar');
  await expect(page.getByTestId('spent-total')).toContainText('2,50');
});

for (const scope of ['menus', 'comparisons', 'observations', 'settings'] as const) {
  test(`borrar ${scope} mantiene los otros documentos y la preferencia de idioma`, async ({ page }) => {
    await seed(page);
    const before = await snapshot(page);
    await openPrivacy(page);
    await finishDeletion(page, scope);
    assertEmptyDocument(scope, await stored(page, scope));
    for (const name of [...storageKeys, otherKey].filter(key => key !== keys[scope])) expect(await raw(page, name)).toBe(before[name]);
    await page.reload();
    assertEmptyDocument(scope, await stored(page, scope));
  });
}

test('una modificación en otra pestaña después de revisar el borrado bloquea la confirmación obsoleta', async ({ page, context }) => {
  await seed(page);
  await openPrivacy(page);
  const dialog = await deletionReview(page, 'shopping');
  await allowDeletion(dialog);
  const second = await context.newPage();
  await second.goto('/');
  await expect(second.getByTestId('open-profile')).toBeVisible();
  await addItem(second, 'Cambio concurrente QA');
  const updated = await raw(second, keys.shopping);
  await dialog.getByTestId('privacy-delete-confirm').click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  expect(await raw(page, keys.shopping)).toBe(updated);
  await expect(dialog).toBeVisible();
  await second.close();
});

test('un fallo de escritura conserva los datos y exige revisar de nuevo antes de reintentar el borrado', async ({ page }) => {
  await seed(page);
  await openPrivacy(page);
  const before = await snapshot(page);
  const dialog = await deletionReview(page, 'expenses');
  await allowDeletion(dialog);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    (window as unknown as { restorePrivacyWrites: () => void }).restorePrivacyWrites = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new Error('Fallo de escritura QA');
      original.call(this, name, value);
    };
  }, keys.expenses);
  await dialog.getByTestId('privacy-delete-confirm').click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  expect(await snapshot(page)).toEqual(before);
  await page.evaluate(() => (window as unknown as { restorePrivacyWrites: () => void }).restorePrivacyWrites());
  await expect(dialog.getByTestId('privacy-delete-confirm')).toHaveCount(0);
  await dialog.getByTestId('privacy-delete-review-again').click();
  await dialog.getByTestId('privacy-delete-review-next').click();
  await allowDeletion(dialog);
  await dialog.getByTestId('privacy-delete-confirm').click();
  await expect(dialog).toHaveCount(0);
  assertEmptyDocument('expenses', await stored(page, 'expenses'));
});

for (const language of ['es', 'en', 'de', 'fr'] as const) {
  test(`${language}: filtros y privacidad traducidos conservan EUR, fechas y datos y no recortan texto`, async ({ browser }, testInfo) => {
    const context: BrowserContext = await browser.newContext({ locale: LANGUAGES[language].locale,
      viewport: testInfo.project.use.viewport, isMobile: !!testInfo.project.use.isMobile, hasTouch: !!testInfo.project.use.hasTouch,
      storageState: { cookies: [], origins: [] }, baseURL: 'http://127.0.0.1:8081' });
    const page = await context.newPage();
    const t = createTranslator(language, resources);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      const source = fixtures(language);
      await context.addInitScript(preferences => { if (!localStorage.getItem('jjcompraintelwgiemt.preferences.v1')) localStorage.setItem('jjcompraintelwgiemt.preferences.v1', preferences); }, source[keys.preferences]);
      await seed(page, source);
      const before = await snapshot(page);
      await page.getByTestId('tab-menus').click();
      const filters = await openFilters(page);
      const euro = new Intl.NumberFormat(LANGUAGES[language].locale, { style: 'currency', currency: 'EUR' }).format(60);
      await expect(filters.getByText(euro, { exact: true })).toBeAttached();
      await filters.getByTestId('menu-filter-preference-vegetarian').click();
      await page.screenshot({ path: testInfo.outputPath(language + '-filters.png'), fullPage: false });
      await applyFilters(page);
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      expect(await snapshot(page)).toEqual(before);
      await openPrivacy(page);
      await expect(page.getByTestId('screen-title')).toHaveText(t('privacy.title'));
      await page.screenshot({ path: testInfo.outputPath(language + '-privacy.png'), fullPage: false });
      const backup = JSON.parse(await exportBackup(page));
      expect(backup.currency).toBe('EUR');
      expect(Number.isFinite(Date.parse(backup.createdAt))).toBe(true);
      expect(backup.documents.find((entry: { key: string }) => entry.key === keys.expenses).raw).toBe(before[keys.expenses]);
      const deletion = await deletionReview(page, 'expenses');
      await deletion.getByTestId('privacy-delete-ack').check();
      await deletion.getByTestId('privacy-delete-word').fill('INVALID');
      await expect(deletion.getByTestId('privacy-delete-confirm')).toBeDisabled();
      await deletion.getByTestId('privacy-delete-word').fill(confirmationWords[language]);
      await expect(deletion.getByTestId('privacy-delete-confirm')).toBeEnabled();
      await page.screenshot({ path: testInfo.outputPath(language + '-delete-review.png'), fullPage: false });
      const health = await page.evaluate(() => {
        const text = document.body.innerText;
        return { horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
          rawKeys: text.match(/\b(?:menuFilters|privacy)\.[A-Za-z][\w.-]*/g) ?? [],
          clipped: [...document.querySelectorAll<HTMLElement>('[role="button"], [role="checkbox"], [role="radio"]')].filter(element => {
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && element.scrollWidth > element.clientWidth + 2 && getComputedStyle(element).overflowX === 'hidden';
          }).map(element => element.innerText) };
      });
      expect(health).toEqual({ horizontalOverflow: false, rawKeys: [], clipped: [] });
      await deletion.getByTestId('privacy-delete-cancel').click();
      await expect(deletion).toHaveCount(0);
      expect(await snapshot(page)).toEqual(before);
      expect(errors).toEqual([]);
    } finally { await context.close(); }
  });
}
