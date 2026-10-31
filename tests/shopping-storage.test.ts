import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ShoppingItem, ShoppingState } from '../src/domain/shopping';

const storage = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn() }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }));
import { emptyShoppingState, loadShopping, saveShopping, STORAGE_KEY } from '../src/storage/shopping';

const item = (id: string): ShoppingItem => ({
  id, name: `Producto ${id}`, quantityMilli: 1000, unit: 'ud', category: 'Otros', note: '',
  checked: false, unitPriceCents: null, priceKind: null,
});
const state = (): ShoppingState => ({
  activeListId: 'list-1',
  lists: [{ id: 'list-1', name: 'Mi compra', budgetCents: 6000, items: Array.from({ length: 10 }, (_, i) => item(`item-${i}`)) }],
});
const envelope = (value: unknown) => JSON.stringify({ version: 1, state: value });

beforeEach(() => {
  vi.resetAllMocks();
  storage.getItem.mockResolvedValue(null);
  storage.setItem.mockResolvedValue(undefined);
});

describe('persistencia de compras local y separada del comparador', () => {
  it('empieza vacío sin sembrar demostraciones ni escribir nada', async () => {
    expect(emptyShoppingState()).toEqual({ lists: [], activeListId: null });
    expect(emptyShoppingState().lists).not.toBe(emptyShoppingState().lists);
    await expect(loadShopping()).resolves.toEqual({ lists: [], activeListId: null });
    expect(storage.getItem).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('recupera diez productos tras una nueva lectura, con cantidades/precios/marcados', async () => {
    const data = state();
    data.lists[0].items[0] = { ...item('item-0'), unit: 'kg', quantityMilli: 1250, checked: true, unitPriceCents: 199, priceKind: 'entered', note: 'Maduro' };
    data.lists[0].items[1] = { ...item('item-1'), unitPriceCents: 0, priceKind: 'estimated' };
    await saveShopping(data);
    const serialized = storage.setItem.mock.calls[0][1];
    expect(JSON.parse(serialized)).toEqual({ version: 1, state: data });
    storage.getItem.mockResolvedValue(serialized);
    const restored = await loadShopping();
    expect(restored).toEqual(data);
    expect(restored.lists[0].items).toHaveLength(10);
  });

  it('nunca lee ni reemplaza el almacenamiento de comparaciones anterior', async () => {
    const legacyKey = 'jjcompraintelwgiemt.comparisons.v1';
    const legacy = '{"version":1,"comparisons":[{"id":"legacy"}]}';
    const values = new Map([[legacyKey, legacy]]);
    storage.getItem.mockImplementation(async key => values.get(key) ?? null);
    storage.setItem.mockImplementation(async (key, value) => { values.set(key, value); });
    await saveShopping(state());
    await expect(loadShopping()).resolves.toEqual(state());
    expect(values.get(legacyKey)).toBe(legacy);
    expect(storage.getItem).not.toHaveBeenCalledWith(legacyKey);
    expect(storage.setItem.mock.calls.every(call => call[0] === STORAGE_KEY)).toBe(true);
  });

  it.each(['{bad', 'null', '[]', '{}', '{"version":"1","state":{}}', '{"version":1,"state":null}'])('preserva contenido corrupto: %s', async value => {
    storage.getItem.mockResolvedValue(value);
    await expect(loadShopping()).rejects.toThrow('No se han modificado');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('preserva versiones desconocidas y no intenta una migración implícita', async () => {
    storage.getItem.mockResolvedValue(JSON.stringify({ version: 2, state: state() }));
    await expect(loadShopping()).rejects.toThrow('versión');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('no confunde un error de lectura con un primer inicio', async () => {
    storage.getItem.mockRejectedValue(new Error('IO'));
    await expect(loadShopping()).rejects.toThrow('cargar');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('propaga el error de escritura sin modificar ni devolver éxito', async () => {
    const original = state();
    const snapshot = JSON.stringify(original);
    storage.setItem.mockRejectedValue(new Error('Full'));
    await expect(saveShopping(original)).rejects.toThrow('guardar');
    expect(JSON.stringify(original)).toBe(snapshot);
  });

  it('admite listas sin selección activa', async () => {
    const original = { ...state(), activeListId: null };
    storage.getItem.mockResolvedValue(envelope(original));
    await expect(loadShopping()).resolves.toEqual(original);
  });
});

describe('validación del registro guardado', () => {
  it.each([
    { quantityMilli: 0 }, { quantityMilli: 1.5 }, { quantityMilli: 1_000_000_001 },
    { quantityMilli: 1500, unit: 'ud' }, { unit: 'caja' }, { category: 'Secreto' },
    { checked: 'false' }, { unitPriceCents: -1, priceKind: 'entered' },
    { unitPriceCents: 1.5, priceKind: 'entered' }, { unitPriceCents: Number.MAX_SAFE_INTEGER + 1, priceKind: 'entered' },
    { unitPriceCents: 1, priceKind: null }, { unitPriceCents: null, priceKind: 'entered' },
    { unitPriceCents: 1, priceKind: 'verified' }, { name: '' }, { name: 'x'.repeat(121) }, { note: 'x'.repeat(501) },
    { id: '' }, { id: 'x'.repeat(129) },
  ])('rechaza un producto inválido: %j', async invalid => {
    const data = state();
    Object.assign(data.lists[0].items[0], invalid);
    storage.getItem.mockResolvedValue(envelope(data));
    await expect(loadShopping()).rejects.toThrow('No se han modificado');
    await expect(saveShopping(data)).rejects.toThrow();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('rechaza listas/ids duplicados, referencia activa inexistente y presupuesto inseguro', async () => {
    const cases: ShoppingState[] = [
      { ...state(), activeListId: 'missing' },
      { ...state(), lists: [state().lists[0], state().lists[0]] },
      { ...state(), lists: [{ ...state().lists[0], items: [item('same'), item('same')] }] },
      { ...state(), lists: [{ ...state().lists[0], budgetCents: -1 }] },
      { ...state(), lists: [{ ...state().lists[0], name: 'x'.repeat(81) }] },
    ];
    for (const invalid of cases) await expect(saveShopping(invalid)).rejects.toThrow();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('impide reutilizar el mismo id de producto en dos listas distintas', async () => {
    const data = state();
    data.lists.push({ id: 'list-2', name: 'Otra', budgetCents: null, items: [item('item-0')] });
    await expect(saveShopping(data)).rejects.toThrow();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('limita cantidades de listas y artículos antes de escribir', async () => {
    const data = state();
    data.lists[0].items = Array.from({ length: 2001 }, (_, i) => item(`item-${i}`));
    await expect(saveShopping(data)).rejects.toThrow();
    const excessive = { activeListId: null, lists: Array.from({ length: 101 }, (_, i) => ({ id: `list-${i}`, name: 'Compra', budgetCents: null, items: [] })) };
    await expect(saveShopping(excessive)).rejects.toThrow();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('rechaza totales desbordados y copia únicamente los campos esperados', async () => {
    const data = state();
    data.lists[0].items[0] = { ...item('huge'), quantityMilli: 2000, unitPriceCents: Number.MAX_SAFE_INTEGER, priceKind: 'entered' };
    await expect(saveShopping(data)).rejects.toThrow('demasiado grande');
    expect(storage.setItem).not.toHaveBeenCalled();
    const withExtra = JSON.parse(envelope(state()));
    withExtra.state.lists[0].items[0].unexpected = 'ignore';
    withExtra.state.unexpected = 'ignore';
    storage.getItem.mockResolvedValue(JSON.stringify(withExtra));
    await expect(loadShopping()).resolves.toEqual(state());
  });
});
