import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ShoppingState } from '../src/domain/shopping';
import type { PriceObservation } from '../src/domain/priceObservations';
import { manualBasketIsFresh } from '../src/app/manualBasketFreshness';

const storage = vi.hoisted(() => ({
  loadShopping: vi.fn(), loadPriceObservations: vi.fn(),
  saveShopping: vi.fn(), savePriceObservations: vi.fn(), saveIfUnchanged: vi.fn(),
}));
vi.mock('../src/storage/shopping', () => ({
  loadShopping: storage.loadShopping, saveShopping: storage.saveShopping,
}));
vi.mock('../src/storage/priceObservations', () => ({
  loadPriceObservations: storage.loadPriceObservations, savePriceObservations: storage.savePriceObservations,
}));
vi.mock('../src/storage/writeCoordinator', async importOriginal => ({
  ...await importOriginal<typeof import('../src/storage/writeCoordinator')>(),
  saveIfUnchanged: storage.saveIfUnchanged,
}));

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const shopping = (): ShoppingState => ({
  lists: [{ id: 'list-1', name: 'Compra', budgetCents: 2000, items: [{
    id: 'rice', name: 'Arroz', quantityMilli: 750_000, unit: 'g', category: 'Despensa',
    note: 'Sin marca elegida', checked: false, unitPriceCents: null, priceKind: null,
  }] }], activeListId: 'list-1',
});
const observations = (): PriceObservation[] => [{
  id: 'observation-1', product: 'Arroz', brand: 'Marca A', format: 'Bolsa 500 g',
  quality: 'Blanco', store: 'Tienda declarada', quantityMilli: 500_000, unit: 'g',
  priceCents: 200, observedOn: '2026-11-27', sourceKind: 'manual',
  sourceReference: 'Aportación manual', url: null,
}];
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(yes => { resolve = yes; });
  return { promise, resolve };
}
function current(state = shopping(), prices = observations()) {
  storage.loadShopping.mockResolvedValue(state);
  storage.loadPriceObservations.mockResolvedValue(prices);
}

beforeEach(() => { vi.resetAllMocks(); current(); });
afterEach(() => {
  expect(storage.saveShopping).not.toHaveBeenCalled();
  expect(storage.savePriceObservations).not.toHaveBeenCalled();
  expect(storage.saveIfUnchanged).not.toHaveBeenCalled();
});

describe('lectura de frescura de la revisión de cesta, sin escrituras', () => {
  it('acepta copias idénticas y no modifica los documentos recibidos', async () => {
    const state = shopping(), prices = observations();
    const previous = clone({ state, prices });
    await expect(manualBasketIsFresh(state, prices)).resolves.toBe(true);
    expect({ state, prices }).toEqual(previous);
    expect(storage.loadShopping).toHaveBeenCalledOnce();
    expect(storage.loadPriceObservations).toHaveBeenCalledOnce();
  });

  it('acepta documentos vacíos sin inicializar un almacén ni reparar datos', async () => {
    const state: ShoppingState = { lists: [], activeListId: null };
    current(state, []);
    await expect(manualBasketIsFresh(state, [])).resolves.toBe(true);
  });

  it('ignora el orden de propiedades de objetos al comparar las dos lecturas', async () => {
    const state = shopping(), prices = observations();
    const reverseProperties = (value: unknown): unknown => Array.isArray(value)
      ? value.map(reverseProperties)
      : value && typeof value === 'object'
        ? Object.fromEntries(Object.entries(value).reverse().map(([key, entry]) => [key, reverseProperties(entry)]))
        : value;
    current(reverseProperties(state) as ShoppingState, reverseProperties(prices) as PriceObservation[]);
    await expect(manualBasketIsFresh(state, prices)).resolves.toBe(true);
  });

  it.each([
    ['cantidad', (state: ShoppingState) => { state.lists[0].items[0].quantityMilli = 1_000_000; }],
    ['producto', (state: ShoppingState) => { state.lists[0].items[0].name = 'Arroz integral'; }],
    ['línea eliminada', (state: ShoppingState) => { state.lists[0].items = []; }],
    ['lista eliminada', (state: ShoppingState) => { state.lists = []; state.activeListId = null; }],
    ['lista nueva', (state: ShoppingState) => { state.lists.push({ id: 'list-2', name: 'Otra', budgetCents: null, items: [] }); }],
    ['lista activa', (state: ShoppingState) => { state.activeListId = null; }],
  ] as const)('rechaza un cambio persistido de %s sin guardar la revisión anterior', async (_label, change) => {
    const latest = shopping();
    change(latest);
    current(latest);
    await expect(manualBasketIsFresh(shopping(), observations())).resolves.toBe(false);
    expect(storage.loadPriceObservations).toHaveBeenCalledOnce();
  });

  it.each([
    ['precio', (prices: PriceObservation[]) => { prices[0].priceCents = 250; }],
    ['fecha', (prices: PriceObservation[]) => { prices[0].observedOn = '2026-11-26'; }],
    ['procedencia', (prices: PriceObservation[]) => { prices[0].sourceKind = 'demo'; }],
    ['tienda', (prices: PriceObservation[]) => { prices[0].store = 'Otra tienda'; }],
    ['observación eliminada', (prices: PriceObservation[]) => { prices.length = 0; }],
    ['observación nueva', (prices: PriceObservation[]) => { prices.push({ ...prices[0], id: 'observation-2' }); }],
  ] as const)('rechaza un cambio persistido de %s de la observación', async (_label, change) => {
    const latest = observations();
    change(latest);
    current(shopping(), latest);
    await expect(manualBasketIsFresh(shopping(), observations())).resolves.toBe(false);
  });

  it('conserva el orden de las colecciones al detectar cambios', async () => {
    const prices = [...observations(), { ...observations()[0], id: 'observation-2' }];
    current(shopping(), [...prices].reverse());
    await expect(manualBasketIsFresh(shopping(), prices)).resolves.toBe(false);
  });

  it.each(['loadShopping', 'loadPriceObservations'] as const)('cierra el cálculo si falla %s, sin escribir ni reparar', async loader => {
    storage[loader].mockRejectedValue(new Error('Documento incompatible o lectura no disponible'));
    await expect(manualBasketIsFresh(shopping(), observations())).resolves.toBe(false);
    expect(storage.loadShopping).toHaveBeenCalledOnce();
    expect(storage.loadPriceObservations).toHaveBeenCalledOnce();
  });

  it('inicia ambas lecturas sin esperar a que termine la primera', async () => {
    const first = deferred<ShoppingState>(), second = deferred<PriceObservation[]>();
    storage.loadShopping.mockReturnValue(first.promise);
    storage.loadPriceObservations.mockReturnValue(second.promise);
    const check = manualBasketIsFresh(shopping(), observations());
    expect(storage.loadShopping).toHaveBeenCalledOnce();
    expect(storage.loadPriceObservations).toHaveBeenCalledOnce();
    second.resolve(observations());
    first.resolve(shopping());
    await expect(check).resolves.toBe(true);
  });

  it('captura las dos referencias antes de esperar y no sigue mutaciones posteriores del llamador', async () => {
    const state = shopping(), prices = observations();
    const storedState = clone(state), storedPrices = clone(prices);
    const first = deferred<ShoppingState>(), second = deferred<PriceObservation[]>();
    storage.loadShopping.mockReturnValue(first.promise);
    storage.loadPriceObservations.mockReturnValue(second.promise);
    const check = manualBasketIsFresh(state, prices);
    state.lists[0].items[0].quantityMilli = 1_000_000;
    prices[0].priceCents = 999;
    first.resolve(storedState);
    second.resolve(storedPrices);
    await expect(check).resolves.toBe(true);
  });

  it('una mutación del llamador durante la lectura no puede ocultar un cambio persistido', async () => {
    const state = shopping(), prices = observations();
    const first = deferred<ShoppingState>(), second = deferred<PriceObservation[]>();
    storage.loadShopping.mockReturnValue(first.promise);
    storage.loadPriceObservations.mockReturnValue(second.promise);
    const check = manualBasketIsFresh(state, prices);
    state.lists[0].items[0].quantityMilli = 1_000_000;
    prices[0].priceCents = 999;
    first.resolve(clone(state));
    second.resolve(clone(prices));
    await expect(check).resolves.toBe(false);
  });
});
