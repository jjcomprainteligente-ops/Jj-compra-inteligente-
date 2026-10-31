import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PriceObservation } from '../src/domain/priceObservations';

const storage = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn() }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }));
import {
  loadPriceObservations, savePriceObservations, validateObservations, STORAGE_KEY,
} from '../src/storage/priceObservations';

const observation = (overrides: Partial<PriceObservation> = {}): PriceObservation => ({
  id: 'observation-1', product: 'Arroz', brand: 'Marca de prueba', format: 'Bolsa',
  quality: 'Redondo', store: 'Tienda de prueba', quantityMilli: 1000, unit: 'kg',
  priceCents: 199, observedOn: '2026-10-30', sourceKind: 'manual',
  sourceReference: 'Anotación de prueba', url: null, ...overrides,
});
const envelope = (observations: unknown) => JSON.stringify({ version: 1, observations });

beforeEach(() => {
  vi.resetAllMocks();
  storage.getItem.mockResolvedValue(null);
  storage.setItem.mockResolvedValue(undefined);
});

describe('observaciones en una clave local independiente', () => {
  it('inicia vacío sin crear precios o modificar almacenamiento', async () => {
    expect(STORAGE_KEY).toBe('jjcompraintelwgiemt.price-observations.v1');
    await expect(loadPriceObservations()).resolves.toEqual([]);
    expect(storage.getItem).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('recupera observaciones tras guardar sin compartir objetos con la entrada', async () => {
    const original = [observation(), observation({ id: 'observation-2', store: 'Otra tienda de prueba', priceCents: 210 })];
    await savePriceObservations(original);
    expect(storage.setItem).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY, envelope(original));
    storage.getItem.mockResolvedValue(storage.setItem.mock.calls[0][1]);
    const restored = await loadPriceObservations();
    expect(restored).toEqual(original);
    expect(restored).not.toBe(original);
    expect(restored[0]).not.toBe(original[0]);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it('conserva un precio desconocido como null y un precio cero como cero', async () => {
    const original = [
      observation({ id: 'missing-price', priceCents: null, sourceKind: 'unknown' }),
      observation({ id: 'zero-price', priceCents: 0 }),
    ];
    await savePriceObservations(original);
    storage.getItem.mockResolvedValue(storage.setItem.mock.calls[0][1]);
    await expect(loadPriceObservations()).resolves.toEqual(original);
  });

  it('conserva fechas futuras válidas al leer, sin sobrescribir datos si el reloj cambia', async () => {
    const original = [observation({ observedOn: '2050-01-02' })];
    storage.getItem.mockResolvedValue(envelope(original));
    await expect(loadPriceObservations()).resolves.toEqual(original);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('vacía solo su propia colección y no elimina listas, menús ni comparaciones', async () => {
    const oldValues = new Map([
      ['jjcompraintelwgiemt.shopping.v1', JSON.stringify({ version: 1, state: { activeListId: 'list-1', lists: [{ id: 'list-1', name: 'Compra anterior', budgetCents: 6000, items: [] }] } })],
      ['jjcompraintelwgiemt.menus.v1', JSON.stringify({ version: 1, plan: { servings: 2, recipeIds: ['arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate'] } })],
      ['jjcompraintelwgiemt.comparisons.v1', JSON.stringify({ version: 1, comparisons: [{ id: 'comparison-1', name: 'Conservar', offers: [] }] })],
    ]);
    const values = new Map(oldValues);
    storage.getItem.mockImplementation(async key => values.get(key) ?? null);
    storage.setItem.mockImplementation(async (key, value) => { values.set(key, value); });
    await savePriceObservations([observation()]);
    await expect(loadPriceObservations()).resolves.toEqual([observation()]);
    await savePriceObservations([]);
    await expect(loadPriceObservations()).resolves.toEqual([]);
    for (const [key, value] of oldValues) expect(values.get(key)).toBe(value);
    expect(storage.getItem.mock.calls.every(([key]) => key === STORAGE_KEY)).toBe(true);
    expect(storage.setItem.mock.calls.every(([key]) => key === STORAGE_KEY)).toBe(true);
  });

  it('serializa solo campos conocidos, sin conservar supuestas verificaciones ni objetos externos', async () => {
    const original = { ...observation(), verified: true, importedData: { secret: 'No guardar' } };
    await savePriceObservations([original]);
    expect(JSON.parse(storage.setItem.mock.calls[0][1])).toEqual({ version: 1, observations: [observation()] });
    storage.getItem.mockResolvedValue(envelope([original]));
    await expect(loadPriceObservations()).resolves.toEqual([observation()]);
  });

  it('valida una copia limpia antes de que se pueda mutar la entrada del guardado', async () => {
    const original = [observation()];
    const clean = validateObservations(original);
    expect(clean).toEqual(original);
    expect(clean).not.toBe(original);
    expect(clean[0]).not.toBe(original[0]);
    original[0].priceCents = 999;
    expect(clean[0].priceCents).toBe(199);
  });

  it('mantiene el documento iniciado aunque la entrada cambie durante una escritura pendiente', async () => {
    let finishWrite!: () => void;
    storage.setItem.mockReturnValue(new Promise<void>(resolve => { finishWrite = resolve; }));
    const original = [observation()];
    const pending = savePriceObservations(original);
    original[0].store = 'Cambio posterior';
    original.push(observation({ id: 'posterior' }));
    expect(JSON.parse(storage.setItem.mock.calls[0][1]).observations).toEqual([observation()]);
    finishWrite();
    await expect(pending).resolves.toBeUndefined();
  });
});

describe('contenido inválido preservado sin migración ni borrado automático', () => {
  it.each([
    '{broken', 'null', '[]', '{}', '{"version":"1","observations":[]}',
    '{"version":1}', '{"version":1,"observations":null}', '{"version":1,"observations":{}}',
  ])('rechaza el documento %s sin escribir', async value => {
    storage.getItem.mockResolvedValue(value);
    await expect(loadPriceObservations()).rejects.toThrow('No se han modificado');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each([0, 2, 999])('preserva la versión incompatible %s', async version => {
    storage.getItem.mockResolvedValue(JSON.stringify({ version, observations: [observation()] }));
    await expect(loadPriceObservations()).rejects.toThrow('versión');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each([
    { id: '' }, { id: 'x'.repeat(129) }, { product: '' }, { brand: '' }, { store: '' },
    { quantityMilli: -1 }, { quantityMilli: 0 }, { quantityMilli: 1.5 },
    { priceCents: -1 }, { priceCents: 1.5 }, { priceCents: Number.MAX_SAFE_INTEGER + 1 },
    { sourceKind: 'verified' }, { sourceReference: '' }, { observedOn: '2026-02-30' },
    { unit: 'caja' }, { url: 'javascript:alert(1)' },
  ])('rechaza una observación inválida al leer y guardar: %j', async invalid => {
    const value = [{ ...observation(), ...invalid }];
    storage.getItem.mockResolvedValue(envelope(value));
    await expect(loadPriceObservations()).rejects.toThrow('No se han modificado');
    await expect(savePriceObservations(value as PriceObservation[])).rejects.toThrow();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('no mezcla dos observaciones con el mismo identificador', async () => {
    const duplicated = [observation(), observation({ priceCents: 299 })];
    storage.getItem.mockResolvedValue(envelope(duplicated));
    await expect(loadPriceObservations()).rejects.toThrow('No se han modificado');
    await expect(savePriceObservations(duplicated)).rejects.toThrow();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('acepta el límite de 2000 y rechaza 2001 sin una escritura parcial', async () => {
    const limit = Array.from({ length: 2000 }, (_, index) => observation({ id: `observation-${index}` }));
    await savePriceObservations(limit);
    expect(JSON.parse(storage.setItem.mock.calls[0][1]).observations).toHaveLength(2000);
    storage.setItem.mockClear();
    const oversized = [...limit, observation({ id: 'one-too-many' })];
    storage.getItem.mockResolvedValue(envelope(oversized));
    await expect(loadPriceObservations()).rejects.toThrow('No se han modificado');
    await expect(savePriceObservations(oversized)).rejects.toThrow();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('rechaza una colección de forma incorrecta sin escribir', async () => {
    expect(() => validateObservations(null)).toThrow();
    expect(() => validateObservations({ observations: [] })).toThrow();
    await expect(savePriceObservations(null as unknown as PriceObservation[])).rejects.toThrow();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});

describe('errores de lectura y escritura recuperables', () => {
  it('no presenta un fallo de lectura como ausencia de precios', async () => {
    storage.getItem.mockRejectedValue(new Error('IO'));
    await expect(loadPriceObservations()).rejects.toThrow('cargar');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('un fallo de escritura conserva la colección anterior y no muta la propuesta', async () => {
    const previous = envelope([observation()]);
    const values = new Map([[STORAGE_KEY, previous]]);
    storage.getItem.mockImplementation(async key => values.get(key) ?? null);
    storage.setItem.mockRejectedValue(new Error('Disco lleno'));
    const next = [observation({ priceCents: 275 })];
    const snapshot = JSON.stringify(next);
    await expect(savePriceObservations(next)).rejects.toThrow('guardar');
    expect(values.get(STORAGE_KEY)).toBe(previous);
    expect(JSON.stringify(next)).toBe(snapshot);
    await expect(loadPriceObservations()).resolves.toEqual([observation()]);
  });

  it('permite reintentar una escritura fallida sin duplicar observaciones', async () => {
    storage.setItem.mockRejectedValueOnce(new Error('Disco lleno'));
    await expect(savePriceObservations([observation()])).rejects.toThrow('guardar');
    await expect(savePriceObservations([observation()])).resolves.toBeUndefined();
    expect(storage.setItem).toHaveBeenCalledTimes(2);
    expect(JSON.parse(storage.setItem.mock.calls[1][1]).observations).toEqual([observation()]);
  });
});
