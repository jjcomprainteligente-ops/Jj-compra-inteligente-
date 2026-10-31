import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Comparison } from '../src/domain/comparisons';

const mockStorage = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn() }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: mockStorage }));

import { loadComparisons, saveComparisons, STORAGE_KEY } from '../src/storage/comparisons';

const data: Comparison[] = [{
  id: 'comparison-1', name: 'Auriculares', offers: [{
    id: 'offer-1', store: 'Tienda', url: 'https://example.com/producto', priceCents: 2599, shippingCents: 0,
  }],
}];

beforeEach(() => {
  vi.resetAllMocks();
  mockStorage.getItem.mockResolvedValue(null);
  mockStorage.setItem.mockResolvedValue(undefined);
});

describe('almacenamiento local', () => {
  it('devuelve una lista vacía al arrancar por primera vez', async () => {
    await expect(loadComparisons()).resolves.toEqual([]);
    expect(mockStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
    expect(mockStorage.setItem).not.toHaveBeenCalled();
  });

  it('guarda una envoltura versionada y recupera comparaciones y ofertas', async () => {
    await saveComparisons(data);
    const serialized = mockStorage.setItem.mock.calls[0][1];
    expect(JSON.parse(serialized)).toEqual({ version: 1, comparisons: data });
    mockStorage.getItem.mockResolvedValue(serialized);
    await expect(loadComparisons()).resolves.toEqual(data);
  });

  it.each(['', '{bad-json', 'null', '[]', '{"version":2,"comparisons":[]}', '{"version":1,"comparisons":{}}'])('no reemplaza datos corruptos: %s', async (stored) => {
    mockStorage.getItem.mockResolvedValue(stored);
    await expect(loadComparisons()).rejects.toThrow('No se han modificado');
    expect(mockStorage.setItem).not.toHaveBeenCalled();
  });

  it('rechaza identificadores duplicados y cantidades corruptas', async () => {
    const duplicate = [data[0], data[0]];
    mockStorage.getItem.mockResolvedValue(JSON.stringify({ version: 1, comparisons: duplicate }));
    await expect(loadComparisons()).rejects.toThrow();
    const invalid = [{ ...data[0], offers: [{ ...data[0].offers[0], priceCents: -1 }] }];
    mockStorage.getItem.mockResolvedValue(JSON.stringify({ version: 1, comparisons: invalid }));
    await expect(loadComparisons()).rejects.toThrow();
    await expect(saveComparisons(invalid)).rejects.toThrow();
    expect(mockStorage.setItem).not.toHaveBeenCalled();
  });

  it('rechaza ofertas con ids duplicados, campos vacíos y enlaces no web', async () => {
    const invalidItems = [
      { ...data[0], name: '' },
      { ...data[0], id: '' },
      { ...data[0], offers: [data[0].offers[0], data[0].offers[0]] },
      { ...data[0], offers: [{ ...data[0].offers[0], url: 'javascript:alert(1)' }] },
      { ...data[0], offers: [{ ...data[0].offers[0], shippingCents: 0.2 }] },
    ];
    for (const item of invalidItems) {
      mockStorage.getItem.mockResolvedValue(JSON.stringify({ version: 1, comparisons: [item] }));
      await expect(loadComparisons()).rejects.toThrow();
    }
    expect(mockStorage.setItem).not.toHaveBeenCalled();
  });

  it('comunica errores de lectura y escritura sin éxito aparente', async () => {
    mockStorage.getItem.mockRejectedValueOnce(new Error('disk failure'));
    await expect(loadComparisons()).rejects.toThrow('cargar');
    mockStorage.setItem.mockRejectedValueOnce(new Error('disk full'));
    await expect(saveComparisons(data)).rejects.toThrow('guardar');
  });
});
