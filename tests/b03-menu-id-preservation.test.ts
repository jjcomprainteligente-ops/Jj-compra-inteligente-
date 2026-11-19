import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RECIPES } from '../src/data/recipes';
import { planIngredients, type MealPlan } from '../src/domain/menus';

const storage = vi.hoisted(() => ({
  getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(),
  multiSet: vi.fn(), multiRemove: vi.fn(), clear: vi.fn(),
}));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }));
import { loadMealPlan, STORAGE_KEY } from '../src/storage/menus';

interface SavedFixture {
  name: string;
  serialized: string;
  expected: MealPlan;
  quantities: { name: string; quantityMilli: number; unit: string }[];
}

// Representative v1 documents, not owner data. These literal identities and
// expected amounts must remain independent of catalogue ordering or generators.
// Together the two documents reference all seven original recipes and two V83
// recipes; neither createMealPlan nor scaleRecipe manufactures an expectation.
const fixtures: SavedFixture[] = [
  {
    name: 'two servings: four legacy recipes and V83 paella',
    serialized: `{
  "version": 1,
  "plan": {
    "servings": 2,
    "recipeIds": ["arroz-verduras", "lentejas-casa", "tortilla-ensalada", "garbanzos-calabaza", "JJ-E03-004"]
  }
}`,
    expected: {
      servings: 2,
      recipeIds: ['arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'JJ-E03-004'],
    },
    quantities: [
      { name: 'Arroz', quantityMilli: 160000, unit: 'g' },
      { name: 'Lentejas secas', quantityMilli: 180000, unit: 'g' },
      { name: 'Huevos', quantityMilli: 3000, unit: 'ud' },
      { name: 'Garbanzos cocidos', quantityMilli: 400000, unit: 'g' },
      { name: 'arroz redondo', quantityMilli: 180000, unit: 'g' },
    ],
  },
  {
    name: 'four servings: remaining legacy recipes and two V83 recipes',
    serialized: '{"plan":{"recipeIds":["pasta-tomate","pollo-papas","cuscus-verduras","JJ-E03-001","JJ-E03-004"],"servings":4},"version":1}',
    expected: {
      servings: 4,
      recipeIds: ['pasta-tomate', 'pollo-papas', 'cuscus-verduras', 'JJ-E03-001', 'JJ-E03-004'],
    },
    quantities: [
      { name: 'Pasta', quantityMilli: 360000, unit: 'g' },
      { name: 'Pollo', quantityMilli: 600000, unit: 'g' },
      { name: 'Cuscús', quantityMilli: 320000, unit: 'g' },
      // 250 g for six people becomes 166.667 g for four; a shopping clove
      // remains one whole unit. These are fixed arithmetic expectations.
      { name: 'queso curado canario', quantityMilli: 166667, unit: 'g' },
      { name: 'ajo (diente)', quantityMilli: 1000, unit: 'ud' },
      { name: 'arroz redondo', quantityMilli: 360000, unit: 'g' },
    ],
  },
];

const otherKeys = [
  'jjcompraintelwgiemt.shopping.v1',
  'jjcompraintelwgiemt.comparisons.v1',
  'jjcompraintelwgiemt.price-observations.v1',
  'jjcompraintelwgiemt.preferences.v1',
  'jjcompraintelwgiemt.expenses.v1',
  'jjcompraintelwgiemt.local-settings.v1',
];

function savedStorage(serialized: string): Map<string, string> {
  // Other documents are deliberately opaque: loading a menu must not read,
  // parse, migrate or replace any of their bytes.
  const values = new Map(otherKeys.map(key => [key, 'opaque saved bytes: ' + key]));
  values.set(STORAGE_KEY, serialized);
  storage.getItem.mockImplementation(async (key: string) => values.get(key) ?? null);
  storage.setItem.mockImplementation(async (key: string, value: string) => { values.set(key, value); });
  storage.removeItem.mockImplementation(async (key: string) => { values.delete(key); });
  storage.clear.mockImplementation(async () => { values.clear(); });
  return values;
}

function expectNoWrites() {
  for (const mutation of [storage.setItem, storage.removeItem, storage.multiSet, storage.multiRemove, storage.clear]) {
    expect(mutation).not.toHaveBeenCalled();
  }
}

beforeEach(() => { vi.resetAllMocks(); });

describe('B03: saved menu identities survive the master catalogue audit', () => {
  it.each(fixtures)('restores $name without rewriting any document', async fixture => {
    const values = savedStorage(fixture.serialized);
    const before = [...values.entries()];
    const catalogueBefore = JSON.stringify(RECIPES);

    const restored = await loadMealPlan();
    expect(restored).toEqual(fixture.expected);
    expect(restored).not.toBeNull();
    const ingredients = planIngredients(restored!);
    expect(ingredients.length).toBeGreaterThan(0);
    for (const ingredient of ingredients) {
      expect(Number.isSafeInteger(ingredient.quantityMilli)).toBe(true);
      expect(ingredient.quantityMilli).toBeGreaterThan(0);
    }
    for (const expected of fixture.quantities) {
      const matches = ingredients.filter(ingredient => ingredient.name === expected.name);
      expect(matches, expected.name).toHaveLength(1);
      expect(matches[0], expected.name).toMatchObject(expected);
    }

    const reopened = await loadMealPlan();
    expect(reopened).toEqual(fixture.expected);
    expect(reopened).not.toBe(restored);
    expect(reopened!.recipeIds).not.toBe(restored!.recipeIds);
    expect([...values.entries()]).toEqual(before);
    expect(values.get(STORAGE_KEY)).toBe(fixture.serialized);
    expect(storage.getItem.mock.calls).toEqual([[STORAGE_KEY], [STORAGE_KEY]]);
    expectNoWrites();
    expect(JSON.stringify(RECIPES)).toBe(catalogueBefore);
  });

  it.each(['JJ-E03-011', 'JJ-E03-031', 'JJ-E03-111', 'JJ-E03-999'])(
    'rejects unavailable ID %s while retaining the complete saved document', async unavailableId => {
      const serialized = fixtures[0].serialized.replace('"JJ-E03-004"', JSON.stringify(unavailableId));
      const values = savedStorage(serialized);
      const before = [...values.entries()];

      await expect(loadMealPlan()).rejects.toMatchObject({ code: 'errors.menuUnreadable' });
      expect(values.get(STORAGE_KEY)).toBe(serialized);
      expect([...values.entries()]).toEqual(before);
      expect(storage.getItem).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY);
      expectNoWrites();
    },
  );
});
