import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyExpensesState, type Expense, type ExpensesState } from '../src/domain/expenses';

const storage = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn() }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }));
import { loadExpenses, parseExpenses, saveExpenses, serializeExpenses, STORAGE_KEY } from '../src/storage/expenses';
import { createWriteCoordinator } from '../src/storage/writeCoordinator';
import { appError } from '../src/i18n/errors';

const entry = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'expense-1', amountCents: 1234, date: '2026-07-17', store: 'Mercado', note: 'Con ticket',
  listId: 'list-1', listName: 'Semana', source: 'user-confirmed', ...overrides,
});
const state = (): ExpensesState => ({ expenses: [entry()] });
const envelope = (data: unknown, version: unknown = 1) => JSON.stringify({ version, data });

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-07-17T12:00:00Z'));
  storage.getItem.mockResolvedValue(null);
  storage.setItem.mockResolvedValue(undefined);
  vi.stubGlobal('window', undefined);
});

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('gastos en una clave local nueva e independiente', () => {
  it('una primera lectura devuelve cero gastos y no escribe', async () => {
    await expect(loadExpenses()).resolves.toEqual(emptyExpensesState());
    expect(storage.getItem).toHaveBeenCalledExactlyOnceWith('jjcompraintelwgiemt.expenses.v1');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('guarda y recupera un documento versionado sin alias al objeto inicial', async () => {
    const original = state();
    await saveExpenses(original);
    expect(storage.setItem).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY, envelope(original));
    storage.getItem.mockResolvedValue(storage.setItem.mock.calls[0][1]);
    const restored = await loadExpenses();
    expect(restored).toEqual(original);
    expect(restored).not.toBe(original);
    expect(restored.expenses).not.toBe(original.expenses);
    expect(restored.expenses[0]).not.toBe(original.expenses[0]);
  });

  it('preserva listas, comparaciones y menú sin leer ni escribir sus claves', async () => {
    const previous = new Map([
      ['jjcompraintelwgiemt.shopping.v1', '{"preserve":"shopping"}'],
      ['jjcompraintelwgiemt.comparisons.v1', '{"preserve":"comparisons"}'],
      ['jjcompraintelwgiemt.menus.v1', '{"preserve":"menus"}'],
    ]);
    const values = new Map(previous);
    storage.getItem.mockImplementation(async key => values.get(key) ?? null);
    storage.setItem.mockImplementation(async (key, value) => { values.set(key, value); });
    await saveExpenses(state());
    await expect(loadExpenses()).resolves.toEqual(state());
    await saveExpenses(emptyExpensesState());
    for (const [key, value] of previous) expect(values.get(key)).toBe(value);
    expect(storage.getItem.mock.calls.every(([key]) => key === STORAGE_KEY)).toBe(true);
    expect(storage.setItem.mock.calls.every(([key]) => key === STORAGE_KEY)).toBe(true);
  });

  it('serializa solo los datos confirmados del registro', async () => {
    const extra = { expenses: [{ ...entry(), checked: true, pastedText: 'Do not retain', credentials: 'Do not retain' }], estimatedTotal: 8000 };
    const original = JSON.stringify(extra);
    await saveExpenses(extra);
    expect(JSON.parse(storage.setItem.mock.calls[0][1])).toEqual({ version: 1, data: state() });
    expect(JSON.stringify(extra)).toBe(original);
    expect(parseExpenses(envelope(extra), '2026-07-17')).toEqual(state());
  });

  it('ofrece parse/serialize deterministas con fecha inyectable para comprobar futuras fechas', () => {
    const serialized = serializeExpenses(state(), '2026-07-17');
    expect(parseExpenses(serialized, '2026-07-17')).toEqual(state());
    expect(() => parseExpenses(serialized, '2026-07-16')).toThrow('money.errors.unreadable');
  });
});

describe('lectura o escritura fallida sin reemplazos ni migraciones', () => {
  it.each([
    '{bad', 'null', '[]', '{}', '{"version":"1","data":{"expenses":[]}}',
    '{"version":1}', '{"version":1,"data":null}', '{"version":1,"data":{"expenses":{}}}',
  ])('rechaza el documento %s y conserva sus bytes', async raw => {
    const values = new Map([[STORAGE_KEY, raw]]);
    storage.getItem.mockImplementation(async key => values.get(key) ?? null);
    await expect(loadExpenses()).rejects.toThrow('money.errors.unreadable');
    expect(values.get(STORAGE_KEY)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each([0, 2, 999])('no interpreta ni sobreescribe documentos de versión %s', async version => {
    const raw = envelope(state(), version);
    storage.getItem.mockResolvedValue(raw);
    await expect(loadExpenses()).rejects.toThrow('money.errors.version');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each([
    { amountCents: -1 }, { amountCents: 12.34 }, { date: '2026-02-29' }, { date: '2026-07-18' },
    { source: 'estimated' }, { listId: null }, { id: '' }, { note: 'x'.repeat(501) },
  ])('rechaza registros inválidos al cargar y antes de escribir: %j', invalid => {
    const data = { expenses: [{ ...entry(), ...invalid }] } as ExpensesState;
    storage.getItem.mockResolvedValue(envelope(data));
    return (async () => {
      await expect(loadExpenses()).rejects.toThrow('money.errors.unreadable');
      await expect(saveExpenses(data)).rejects.toThrow();
      expect(storage.setItem).not.toHaveBeenCalled();
    })();
  });

  it('no descarta duplicados ni gastos cuyo total desborde los céntimos seguros', async () => {
    for (const data of [
      { expenses: [entry(), entry()] },
      { expenses: [entry({ amountCents: Number.MAX_SAFE_INTEGER }), entry({ id: 'extra', amountCents: 1 })] },
    ]) {
      storage.getItem.mockResolvedValue(envelope(data));
      await expect(loadExpenses()).rejects.toThrow('money.errors.unreadable');
      await expect(saveExpenses(data)).rejects.toThrow();
    }
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('distingue un fallo de lectura de la ausencia de datos sin crear un documento vacío', async () => {
    storage.getItem.mockRejectedValue(new Error('IO failure'));
    await expect(loadExpenses()).rejects.toThrow('money.errors.load');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('conserva los datos anteriores y la entrada del usuario cuando falla el guardado', async () => {
    const raw = envelope(state());
    const previous = new Map([[STORAGE_KEY, raw]]);
    const updated = { expenses: [entry({ note: 'Cambio para reintentar' })] };
    const snapshot = JSON.stringify(updated);
    storage.getItem.mockImplementation(async key => previous.get(key) ?? null);
    storage.setItem.mockRejectedValueOnce(new Error('Disk full'));
    await expect(saveExpenses(updated)).rejects.toThrow('money.errors.save');
    expect(previous.get(STORAGE_KEY)).toBe(raw);
    expect(JSON.stringify(updated)).toBe(snapshot);
    await expect(loadExpenses()).resolves.toEqual(state());
    storage.setItem.mockImplementation(async (key, value) => { previous.set(key, value); });
    await expect(saveExpenses(updated)).resolves.toBeUndefined();
    await expect(loadExpenses()).resolves.toEqual(updated);
    expect(storage.setItem).toHaveBeenCalledTimes(2);
  });

  it('rechaza un archivo desmedido antes de interpretarlo', () => {
    expect(() => parseExpenses(' '.repeat(8 * 1024 * 1024 + 1))).toThrow('money.errors.unreadable');
  });
});

describe('registro de gastos mediante el coordinador de la aplicación', () => {
  it('conserva el primer gasto y rechaza una segunda vista obsoleta sin sobrescribirlo', async () => {
    const documents = new Map<string, string>();
    storage.getItem.mockImplementation(async key => documents.get(key) ?? null);
    storage.setItem.mockImplementation(async (key, value) => { documents.set(key, value); });
    const coordinate = createWriteCoordinator();
    const first = state();
    const second = { expenses: [entry({ id: 'expense-2', amountCents: 6789 })] };
    const results = await Promise.allSettled([
      coordinate({ key: STORAGE_KEY, expected: emptyExpensesState(), next: first, read: loadExpenses, write: saveExpenses }),
      coordinate({ key: STORAGE_KEY, expected: emptyExpensesState(), next: second, read: loadExpenses, write: saveExpenses }),
    ]);
    expect(results[0]).toMatchObject({ status: 'fulfilled', value: first });
    expect(results[1]).toMatchObject({ status: 'rejected' });
    if (results[1].status === 'rejected') expect(results[1].reason.message).toBe(appError('errors.storageConflict').message);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    await expect(loadExpenses()).resolves.toEqual(first);
  });

  it('vuelve a validar el documento al guardar y conserva bytes corruptos aparecidos después de cargar', async () => {
    const raw = '{"version":1,"data":{"expenses":"unexpected"}}';
    storage.getItem.mockResolvedValue(raw);
    const coordinate = createWriteCoordinator();
    await expect(coordinate({ key: STORAGE_KEY, expected: emptyExpensesState(), next: state(), read: loadExpenses, write: saveExpenses }))
      .rejects.toThrow('money.errors.unreadable');
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(await storage.getItem(STORAGE_KEY)).toBe(raw);
  });
});
