import { expect, test, type BrowserContext, type Locator, type Page } from '@playwright/test';

const preferencesKey = 'jjcompraintelwgiemt.preferences.v1';
const shoppingKey = 'jjcompraintelwgiemt.shopping.v1';
const comparisonsKey = 'jjcompraintelwgiemt.comparisons.v1';
const businessKeys = [shoppingKey, 'jjcompraintelwgiemt.menus.v1', comparisonsKey,
  'jjcompraintelwgiemt.price-observations.v1'] as const;
const preferences = (language: string | null = 'es', welcomeCompleted = true, version = 1) =>
  JSON.stringify({ version, language, welcomeCompleted });
const shopping = JSON.stringify({ version: 1, state: {
  lists: [{ id: 'integrity-list', name: 'Lista conservada', budgetCents: 4275, items: [{
    id: 'integrity-item', name: 'Tomate de prueba', quantityMilli: 1250, unit: 'kg', category: 'Fruta y verdura',
    checked: false, unitPriceCents: 240, priceKind: 'entered', note: 'Texto propio: mañana, ½ kg',
  }] }], activeListId: 'integrity-list',
} });
const persistedBusiness: Record<string, string> = {
  [shoppingKey]: shopping,
  'jjcompraintelwgiemt.menus.v1': JSON.stringify({ version: 1, plan: { servings: 3,
    recipeIds: ['arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate'],
  } }),
  [comparisonsKey]: JSON.stringify({ version: 1, comparisons: [{ id: 'integrity-comparison', name: 'Comparación conservada', offers: [{
    id: 'integrity-offer', store: 'Tienda de prueba', url: 'https://example.com/conservar', priceCents: 1275, shippingCents: 245,
  }] }] }),
  'jjcompraintelwgiemt.price-observations.v1': JSON.stringify({ version: 1, observations: [{
    id: 'integrity-observation', product: 'Arroz de prueba', brand: 'Marca de prueba', format: 'Bolsa', quality: 'Redondo',
    store: 'Tienda de prueba', quantityMilli: 500000, unit: 'g', priceCents: 180, observedOn: '2026-10-30',
    sourceKind: 'manual', sourceReference: 'Ticket de prueba conservado', url: 'https://example.com/ticket',
  }] }),
};

test.use({ locale: 'es-ES' });

/** Every test owns a fresh context; the marker prevents reseeding either tab or a reload. */
async function seed(context: BrowserContext, entries: Record<string, string> = {}): Promise<void> {
  await context.addInitScript(({ entries, preferencesKey, initialPreferences }) => {
    if (!/^https?:$/.test(location.protocol) || localStorage.getItem('jj-integrity-test-seeded')) return;
    localStorage.clear();
    localStorage.setItem(preferencesKey, initialPreferences);
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
    localStorage.setItem('jj-integrity-test-seeded', '1');
  }, { entries, preferencesKey, initialPreferences: preferences() });
}

async function businessSnapshot(page: Page): Promise<(string | null)[]> {
  return page.evaluate(keys => keys.map(key => localStorage.getItem(key)), [...businessKeys]);
}

async function names(page: Page): Promise<string[]> {
  return page.evaluate(key => {
    const serialized = localStorage.getItem(key);
    return serialized ? JSON.parse(serialized).state.lists.map((list: { name: string }) => list.name) : [];
  }, shoppingKey);
}

async function startList(page: Page, name: string): Promise<Locator> {
  await page.getByTestId('create-list').click();
  const sheet = page.getByTestId('app-sheet');
  await sheet.getByRole('textbox', { name: 'Nombre de la lista', exact: true }).fill(name);
  return sheet;
}

async function openLanguages(page: Page): Promise<void> {
  await page.getByTestId('open-profile').click();
  await page.getByTestId('language-settings').click();
  await expect(page.getByTestId('language-es')).toBeVisible();
}

async function openDraft(page: Page): Promise<Locator> {
  await page.getByTestId('tab-list').click();
  await page.getByTestId('add-item').click();
  const sheet = page.getByTestId('app-sheet');
  await sheet.getByRole('textbox', { name: 'Nombre del producto', exact: true }).fill('Borrador aún sin guardar');
  await sheet.getByRole('textbox', { name: 'Cantidad', exact: true }).fill('1,250');
  await sheet.getByRole('button', { name: 'Unidad kg', exact: true }).click();
  await sheet.getByRole('textbox', { name: 'Precio unitario (€)', exact: true }).fill('2,40');
  await sheet.getByRole('textbox', { name: 'Nota', exact: true }).fill('Conservar esto: à demain, Grüße');
  return sheet;
}

async function expectDraft(sheet: Locator): Promise<void> {
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('textbox').nth(0)).toHaveValue('Borrador aún sin guardar');
  await expect(sheet.getByRole('textbox').nth(1)).toHaveValue('1,250');
  await expect(sheet.getByRole('textbox').nth(2)).toHaveValue('2,40');
  await expect(sheet.getByRole('textbox').nth(3)).toHaveValue('Conservar esto: à demain, Grüße');
}

test('dos pestañas vacías: la segunda escritura rechaza el estado obsoleto y conserva el borrador', async ({ page, context }) => {
  await seed(context);
  await page.goto('/');
  const second = await context.newPage();
  await second.goto('/');
  const a = await startList(page, 'Prueba A');
  const b = await startList(second, 'Prueba B');
  await a.getByTestId('save-list').click();
  await expect(a).toHaveCount(0);
  expect(await names(page)).toEqual(['Prueba A']);
  const saved = await page.evaluate(key => localStorage.getItem(key), shoppingKey);

  await b.getByTestId('save-list').click();
  await expect(b.getByRole('alert')).toContainText('Otra pestaña');
  await expect(b.getByRole('textbox')).toHaveValue('Prueba B');
  expect(await second.evaluate(key => localStorage.getItem(key), shoppingKey)).toBe(saved);
  await page.reload();
  expect(await names(page)).toEqual(['Prueba A']);
});

test('dos guardados simultáneos usan un bloqueo compartido: gana uno y el otro conserva su formulario', async ({ page, context }) => {
  await seed(context);
  await page.goto('/');
  const second = await context.newPage();
  await second.goto('/');
  const a = await startList(page, 'Carrera A');
  const b = await startList(second, 'Carrera B');
  // Keep the origin lock occupied until both UIs have enqueued their save.
  await page.evaluate(async key => {
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    (window as unknown as { releaseIntegrityLock: () => void }).releaseIntegrityLock = release;
    await new Promise<void>(resolve => {
      void navigator.locks.request(`jjcompra:storage:${key}`, async () => { resolve(); await held; });
    });
  }, shoppingKey);
  await Promise.all([a.getByTestId('save-list').click(), b.getByTestId('save-list').click()]);
  await expect.poll(() => page.evaluate(async key => (await navigator.locks.query()).pending?.filter(lock => lock.name === `jjcompra:storage:${key}`).length ?? 0, shoppingKey)).toBe(2);
  expect(await names(page)).toEqual([]);
  await page.evaluate(() => (window as unknown as { releaseIntegrityLock: () => void }).releaseIntegrityLock());
  await expect.poll(async () => (await names(page)).length).toBe(1);
  const winner = (await names(page))[0];
  expect(['Carrera A', 'Carrera B']).toContain(winner);
  const loser = winner === 'Carrera A' ? b : a;
  const successful = winner === 'Carrera A' ? a : b;
  await expect(successful).toHaveCount(0);
  await expect(loser.getByRole('alert')).toContainText('Otra pestaña');
  await expect(loser.getByRole('textbox')).toHaveValue(winner === 'Carrera A' ? 'Carrera B' : 'Carrera A');
  expect(await names(second)).toEqual([winner]);
});

test('el navegador sin Web Locks rechaza el guardado antes de sobrescribir y mantiene el borrador', async ({ page, context }) => {
  await seed(context, persistedBusiness);
  await page.goto('/');
  const before = await businessSnapshot(page);
  const sheet = await startList(page, 'No sobrescribir sin bloqueo');
  await page.evaluate(() => Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined }));
  await sheet.getByTestId('save-list').click();
  await expect(sheet.getByRole('alert')).toContainText('no permite guardar de forma segura');
  await expect(sheet.getByRole('textbox')).toHaveValue('No sobrescribir sin bloqueo');
  expect(await businessSnapshot(page)).toEqual(before);
});

test('un cambio de idioma desde otra pestaña mantiene campos, números y texto propio del editor abierto', async ({ page, context }) => {
  await seed(context, persistedBusiness);
  await page.goto('/');
  const before = await businessSnapshot(page);
  const sheet = await openDraft(page);
  const other = await context.newPage();
  await other.goto('/');
  await openLanguages(other);
  await other.getByTestId('language-en').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expectDraft(sheet);
  expect(await businessSnapshot(page)).toEqual(before);
  await sheet.getByTestId('save-item').click();
  await expect(sheet).toHaveCount(0);
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), shoppingKey);
  expect(saved.state.lists[0].items[1]).toMatchObject({ name: 'Borrador aún sin guardar', quantityMilli: 1250,
    unitPriceCents: 240, note: 'Conservar esto: à demain, Grüße' });
});

test('un cambio remoto de bienvenida no desmonta el espacio ya abierto ni elimina un borrador', async ({ page, context }) => {
  await seed(context, persistedBusiness);
  await page.goto('/');
  const before = await businessSnapshot(page);
  const sheet = await openDraft(page);
  const other = await context.newPage();
  await other.goto('/');
  await expect(other.getByTestId('open-profile')).toBeVisible();
  await other.evaluate(({ key, value }) => localStorage.setItem(key, value), { key: preferencesKey, value: preferences('fr', false) });
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expectDraft(sheet);
  await expect(page.getByTestId('start-app')).toHaveCount(0);
  expect(await businessSnapshot(page)).toEqual(before);
});

test('los cuatro idiomas y el modo dispositivo solo escriben preferencias y conservan las cuatro claves de negocio', async ({ page, context }) => {
  await seed(context, persistedBusiness);
  await page.goto('/');
  const before = await businessSnapshot(page);
  await openLanguages(page);
  for (const language of ['en', 'de', 'fr', 'es'] as const) {
    await page.getByTestId(`language-${language}`).click();
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    expect(await businessSnapshot(page)).toEqual(before);
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), preferencesKey))
      .toEqual({ version: 1, language, welcomeCompleted: true });
  }
  await page.getByTestId('language-auto').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), preferencesKey))
    .toEqual({ version: 1, language: null, welcomeCompleted: true });
  await page.reload();
  await expect(page.getByTestId('open-profile')).toBeVisible();
  expect(await businessSnapshot(page)).toEqual(before);
});

for (const [label, incompatible] of [['corruptas', '{corrupto'], ['de versión futura', preferences('de', true, 999)]]) {
  test(`las preferencias ${label} se conservan al continuar la sesión y recargar`, async ({ page, context }) => {
    await seed(context, { ...persistedBusiness, [preferencesKey]: incompatible });
    await page.goto('/');
    await expect(page.getByRole('alert')).toContainText('No se ha modificado');
    expect(await page.evaluate(key => localStorage.getItem(key), preferencesKey)).toBe(incompatible);
    await page.getByTestId('preferences-session-continue').click();
    await expect(page.getByTestId('open-profile')).toBeVisible();
    await openLanguages(page);
    const french = page.getByTestId('language-fr');
    if (await french.isEnabled()) await french.click();
    expect(await page.evaluate(key => localStorage.getItem(key), preferencesKey)).toBe(incompatible);
    expect(await businessSnapshot(page)).toEqual(businessKeys.map(key => persistedBusiness[key]));
    await page.reload();
    await expect(page.getByTestId('preferences-session-continue')).toBeVisible();
    expect(await page.evaluate(key => localStorage.getItem(key), preferencesKey)).toBe(incompatible);
    expect(await businessSnapshot(page)).toEqual(businessKeys.map(key => persistedBusiness[key]));
  });
}

test('un fallo al guardar preferencias mantiene idioma y datos actuales y permite reintentar', async ({ page, context }) => {
  await seed(context, persistedBusiness);
  await page.goto('/');
  const before = await businessSnapshot(page);
  await openLanguages(page);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    (window as unknown as { restoreIntegrityStorage: () => void }).restoreIntegrityStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (target: string, value: string) {
      if (target === key) throw new Error('Quota exceeded during preference test');
      return original.call(this, target, value);
    };
  }, preferencesKey);
  await page.getByTestId('language-en').click();
  await expect(page.getByRole('alert')).toContainText('Se conserva tu preferencia anterior');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  expect(await page.evaluate(key => localStorage.getItem(key), preferencesKey)).toBe(preferences());
  expect(await businessSnapshot(page)).toEqual(before);
  await page.evaluate(() => (window as unknown as { restoreIntegrityStorage: () => void }).restoreIntegrityStorage());
  await page.getByTestId('language-en').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(await businessSnapshot(page)).toEqual(before);
});

test('las preferencias sin Web Locks no pierden el idioma anterior ni cambian datos de negocio', async ({ page, context }) => {
  await seed(context, persistedBusiness);
  await page.goto('/');
  const before = await businessSnapshot(page);
  await openLanguages(page);
  await page.evaluate(() => Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined }));
  await page.getByTestId('language-de').click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  expect(await page.evaluate(key => localStorage.getItem(key), preferencesKey)).toBe(preferences());
  expect(await businessSnapshot(page)).toEqual(before);
});

test('un evento de preferencias durante una escritura conserva el último idioma persistido en ambas pestañas', async ({ page, context }) => {
  await seed(context, persistedBusiness);
  await page.goto('/');
  const other = await context.newPage();
  await other.goto('/');
  await openLanguages(page);
  await openLanguages(other);
  // Delay only delivery of A's resolved lock promise. The native origin lock is
  // already released, allowing B to commit while A's mutation is still pending.
  await page.evaluate(key => {
    const manager = navigator.locks;
    const request = manager.request.bind(manager);
    const runtime = window as unknown as { releasePreferenceResult: () => void; preferenceResultHeld: boolean; remotePreferenceSeen: boolean };
    runtime.preferenceResultHeld = false;
    runtime.remotePreferenceSeen = false;
    window.addEventListener('storage', event => { if (event.key === key) runtime.remotePreferenceSeen = true; });
    manager.request = (async (...args: Parameters<LockManager['request']>) => {
      const result = await request(...args);
      if (args[0] === key) {
        runtime.preferenceResultHeld = true;
        await new Promise<void>(resolve => { runtime.releasePreferenceResult = resolve; });
      }
      return result;
    }) as LockManager['request'];
  }, preferencesKey);
  await page.getByTestId('language-de').click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { preferenceResultHeld: boolean }).preferenceResultHeld)).toBe(true);
  await other.getByTestId('language-fr').click();
  await expect(other.locator('html')).toHaveAttribute('lang', 'fr');
  await expect.poll(() => page.evaluate(() => (window as unknown as { remotePreferenceSeen: boolean }).remotePreferenceSeen)).toBe(true);
  await page.evaluate(() => (window as unknown as { releasePreferenceResult: () => void }).releasePreferenceResult());
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), preferencesKey)).toEqual({ version: 1, language: 'fr', welcomeCompleted: true });
  expect(await businessSnapshot(page)).toEqual(businessKeys.map(key => persistedBusiness[key]));
});

test('completar bienvenida y elegir idioma conserva ambos campos o rechaza un conflicto explícito y permite reintentar', async ({ page, context }) => {
  await seed(context, { ...persistedBusiness, [preferencesKey]: preferences('es', false) });
  await page.goto('/');
  const other = await context.newPage();
  await other.goto('/');
  await expect(page.getByTestId('start-app')).toBeVisible();
  await expect(other.getByTestId('language-fr')).toBeVisible();
  await page.evaluate(async key => {
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    (window as unknown as { releaseWelcomeLock: () => void }).releaseWelcomeLock = release;
    await new Promise<void>(resolve => {
      void navigator.locks.request(key, async () => { resolve(); await held; });
    });
  }, preferencesKey);
  await Promise.all([page.getByTestId('start-app').click(), other.getByTestId('language-fr').click()]);
  await expect.poll(() => page.evaluate(async key => (await navigator.locks.query()).pending?.filter(lock => lock.name === key).length ?? 0, preferencesKey)).toBe(2);
  await page.evaluate(() => (window as unknown as { releaseWelcomeLock: () => void }).releaseWelcomeLock());
  await expect.poll(() => page.evaluate(async key => {
    const locks = await navigator.locks.query();
    return [...(locks.held ?? []), ...(locks.pending ?? [])].filter(lock => lock.name === key).length;
  }, preferencesKey)).toBe(0);
  const afterRace = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), preferencesKey);
  if (afterRace.language === 'fr' && afterRace.welcomeCompleted === false) {
    // A stale welcome read must NOT silently overwrite the successful choice.
    // Its caller stays on welcome with an explicit failure until it retries.
    await expect(page.getByTestId('start-app')).toBeVisible();
    await expect(page.getByRole('alert')).toBeVisible();
    await page.getByTestId('start-app').click();
  } else if (afterRace.language === 'es' && afterRace.welcomeCompleted === true) {
    // The opposite ordering must keep the completed welcome and tell B that
    // selecting French did not succeed, even if welcome has now closed there.
    await expect(other.getByTestId('open-profile')).toBeVisible();
    await expect(other.getByRole('alert')).toBeVisible();
    await openLanguages(other);
    await other.getByTestId('language-fr').click();
  } else {
    expect(afterRace).toEqual({ version: 1, language: 'fr', welcomeCompleted: true });
  }
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)!), preferencesKey))
    .toEqual({ version: 1, language: 'fr', welcomeCompleted: true });
  await expect(page.getByTestId('open-profile')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
  await expect(other.locator('html')).toHaveAttribute('lang', 'fr');
  expect(await businessSnapshot(page)).toEqual(businessKeys.map(key => persistedBusiness[key]));
});

test('un enlace legado con credenciales sigue legible pero no se abre ni transmite credenciales', async ({ page, context }) => {
  const legacy = JSON.stringify({ version: 1, comparisons: [{ id: 'legacy-unsafe', name: 'Oferta antigua conservada', offers: [{
    id: 'legacy-offer', store: 'Tienda antigua', url: 'https://person:password@example.com/producto', priceCents: 1250, shippingCents: 0,
  }] }] });
  await seed(context, { ...persistedBusiness, [comparisonsKey]: legacy });
  const external: string[] = [];
  const popups: Page[] = [];
  context.on('page', opened => { if (opened !== page) popups.push(opened); });
  context.on('request', request => { if (/^https?:/.test(request.url()) && new URL(request.url()).hostname === 'example.com') external.push(request.url()); });
  await context.route('https://example.com/**', route => route.fulfill({ body: 'Destino bloqueado por la prueba' }));
  await page.goto('/?view=comparisons');
  await page.getByRole('button', { name: /Abrir Oferta antigua conservada/ }).click();
  await expect(page.getByTestId('offer-card')).toContainText('Tienda antigua');
  await page.getByRole('button', { name: 'Ver en tienda', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(/https|http|credenciales/);
  expect(external).toEqual([]);
  expect(popups).toEqual([]);
  expect(await page.evaluate(key => localStorage.getItem(key), comparisonsKey)).toBe(legacy);
});
