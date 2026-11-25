import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMealPlan, type MealPlan } from '../src/domain/menus';
import { RECIPES } from '../src/data/recipes';
import { createMealPlanDraft } from '../src/domain/mealPlanDraft';

const storage = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn() }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }));
import { loadMealPlan, saveMealPlan, STORAGE_KEY } from '../src/storage/menus';

const envelope = (plan: unknown) => JSON.stringify({ version: 1, plan });

beforeEach(() => {
  vi.resetAllMocks();
  storage.getItem.mockResolvedValue(null);
  storage.setItem.mockResolvedValue(undefined);
});

describe('menú local en una clave independiente', () => {
  it('inicia sin menú y no escribe ninguna receta automáticamente', async () => {
    await expect(loadMealPlan()).resolves.toBeNull();
    expect(storage.getItem).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('recupera las cinco cenas y las raciones tras otra lectura', async () => {
    const original = createMealPlan(3);
    await saveMealPlan(original);
    expect(storage.setItem).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY, envelope(original));
    storage.getItem.mockResolvedValue(storage.setItem.mock.calls[0][1]);
    const restored = await loadMealPlan();
    expect(restored).toEqual(original);
    expect(restored).not.toBe(original);
    if (restored === null || 'kind' in restored) throw new Error('Expected the original legacy five-meal shape.');
    expect(restored?.recipeIds).not.toBe(original.recipeIds);
  });

  it('admite quitar el menú sin borrar ni modificar las compras', async () => {
    await saveMealPlan(null);
    expect(storage.setItem).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY, envelope(null));
    storage.getItem.mockResolvedValue(envelope(null));
    await expect(loadMealPlan()).resolves.toBeNull();
  });

  it('no lee ni cambia listas, presupuesto o comparaciones anteriores', async () => {
    const shoppingKey = 'jjcompraintelwgiemt.shopping.v1';
    const comparisonKey = 'jjcompraintelwgiemt.comparisons.v1';
    const shopping = JSON.stringify({ version: 1, state: { activeListId: 'list-1', lists: [{ id: 'list-1', name: 'Compra', budgetCents: 6000, items: [] }] } });
    const comparison = JSON.stringify({ version: 1, comparisons: [{ id: 'old-comparison', name: 'Conservar', offers: [] }] });
    const values = new Map([[shoppingKey, shopping], [comparisonKey, comparison]]);
    storage.getItem.mockImplementation(async key => values.get(key) ?? null);
    storage.setItem.mockImplementation(async (key, value) => { values.set(key, value); });
    await saveMealPlan(createMealPlan(2));
    await expect(loadMealPlan()).resolves.toEqual(createMealPlan(2));
    await saveMealPlan(null);
    expect(values.get(shoppingKey)).toBe(shopping);
    expect(values.get(comparisonKey)).toBe(comparison);
    expect(storage.getItem.mock.calls.every(([key]) => key === STORAGE_KEY)).toBe(true);
    expect(storage.setItem.mock.calls.every(([key]) => key === STORAGE_KEY)).toBe(true);
  });

  it('solo serializa personas y referencias de recetas, sin texto o preferencias adicionales', async () => {
    const original = { ...createMealPlan(2), pastedText: 'No guardar', preferences: ['No guardar'] };
    await saveMealPlan(original);
    expect(JSON.parse(storage.setItem.mock.calls[0][1])).toEqual({ version: 1, plan: createMealPlan(2) });
    storage.getItem.mockResolvedValue(envelope(original));
    await expect(loadMealPlan()).resolves.toEqual(createMealPlan(2));
  });
});

describe('datos inválidos o incompatibles no reemplazados', () => {
  it.each([1, 4, 5, 6, 7, RECIPES.length])('mantiene el borrador de %s comidas fuera del documento v1 sin tocar las siete claves', async count => {
    const original = envelope(createMealPlan(3));
    const otherKeys = [
      'jjcompraintelwgiemt.shopping.v1',
      'jjcompraintelwgiemt.comparisons.v1',
      'jjcompraintelwgiemt.price-observations.v1',
      'jjcompraintelwgiemt.preferences.v1',
      'jjcompraintelwgiemt.expenses.v1',
      'jjcompraintelwgiemt.local-settings.v1',
    ];
    const values = new Map(otherKeys.map(key => [key, 'opaque saved bytes: ' + key]));
    values.set(STORAGE_KEY, original);
    storage.getItem.mockImplementation(async (key: string) => values.get(key) ?? null);
    storage.setItem.mockImplementation(async (key: string, value: string) => { values.set(key, value); });
    const savedBefore = [...values.entries()];

    const draft = createMealPlanDraft(4, count);
    const draftBefore = JSON.stringify(draft);
    // Even a five-meal draft must cross a deliberate future conversion boundary;
    // a cast cannot make its session-only shape a valid persisted v1 plan.
    await expect(saveMealPlan(draft as unknown as MealPlan)).rejects.toThrow();
    expect(storage.setItem).not.toHaveBeenCalled();
    expect([...values.entries()]).toEqual(savedBefore);
    expect(JSON.stringify(draft)).toBe(draftBefore);
    await expect(loadMealPlan()).resolves.toEqual(createMealPlan(3));
    expect(values.get(STORAGE_KEY)).toBe(original);

    // A malformed envelope already on disk is retained for recovery, never
    // silently converted, truncated to five dishes, or replaced by a default.
    const malformed = envelope(draft);
    values.set(STORAGE_KEY, malformed);
    const malformedBefore = [...values.entries()];
    await expect(loadMealPlan()).rejects.toThrow('No se han modificado');
    expect(storage.setItem).not.toHaveBeenCalled();
    expect([...values.entries()]).toEqual(malformedBefore);
    expect(storage.getItem.mock.calls.every(([key]) => key === STORAGE_KEY)).toBe(true);
  });

  it.each(['{bad', 'null', '[]', '{}', '{"version":"1","plan":null}', '{"version":1}', '{"version":1,"plan":[]}'])('rechaza el documento %s sin escribir', async value => {
    storage.getItem.mockResolvedValue(value);
    await expect(loadMealPlan()).rejects.toThrow('No se han modificado');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each([0, 3, 999])('preserva la versión %s sin migración implícita', async version => {
    storage.getItem.mockResolvedValue(JSON.stringify({ version, plan: createMealPlan(2) }));
    await expect(loadMealPlan()).rejects.toThrow('versión');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each([
    { servings: 0 }, { servings: 13 }, { servings: 1.5 }, { servings: '2' },
    { recipeIds: [] }, { recipeIds: ['unknown', 'unknown', 'unknown', 'unknown', 'unknown'] },
    { recipeIds: [1, 2, 3, 4, 5] },
  ])('rechaza un plan inválido tanto al leer como al guardar: %j', async invalid => {
    const plan = { ...createMealPlan(2), ...invalid };
    storage.getItem.mockResolvedValue(envelope(plan));
    await expect(loadMealPlan()).rejects.toThrow('No se han modificado');
    await expect(saveMealPlan(plan as MealPlan)).rejects.toThrow();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('rechaza referencias inexistentes aunque haya cinco identificadores distintos', async () => {
    const plan = createMealPlan(2);
    plan.recipeIds[0] = 'receta-que-no-existe';
    storage.getItem.mockResolvedValue(envelope(plan));
    await expect(loadMealPlan()).rejects.toThrow('No se han modificado');
    await expect(saveMealPlan(plan)).rejects.toThrow('receta');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('no confunde un fallo de lectura con ausencia de menú', async () => {
    storage.getItem.mockRejectedValue(new Error('IO'));
    await expect(loadMealPlan()).rejects.toThrow('cargar');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('conserva el plan anterior y la entrada si falla una escritura', async () => {
    const previous = envelope(createMealPlan(2));
    const original = createMealPlan(4);
    const snapshot = JSON.stringify(original);
    const values = new Map([[STORAGE_KEY, previous]]);
    storage.getItem.mockImplementation(async key => values.get(key) ?? null);
    storage.setItem.mockRejectedValue(new Error('Disco lleno'));
    await expect(saveMealPlan(original)).rejects.toThrow('guardar');
    expect(values.get(STORAGE_KEY)).toBe(previous);
    expect(JSON.stringify(original)).toBe(snapshot);
    await expect(loadMealPlan()).resolves.toEqual(createMealPlan(2));
  });

  it('permite reintentar una escritura fallida sin ocultar el fallo inicial', async () => {
    storage.setItem.mockRejectedValueOnce(new Error('Disco lleno'));
    const plan = createMealPlan(2);
    await expect(saveMealPlan(plan)).rejects.toThrow('guardar');
    await expect(saveMealPlan(plan)).resolves.toBeUndefined();
    expect(storage.setItem).toHaveBeenCalledTimes(2);
  });
});
