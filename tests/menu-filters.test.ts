import { describe, expect, it } from 'vitest';
import { LEGACY_RECIPES as RECIPES } from '../src/data/recipes';
import { createMealPlan, type Recipe } from '../src/domain/menus';
import {
  buildFilteredMealPlan, defaultMenuFilters, filterRecipes, MAX_EXCLUDED_INGREDIENTS,
  MenuFilterError, menuIngredientOptions, validateMenuFilters, type MenuFilters,
} from '../src/domain/menuFilters';

const filters = (overrides: Partial<MenuFilters> = {}): MenuFilters => ({ ...defaultMenuFilters(), ...overrides });
const ids = (recipes: readonly Recipe[]) => recipes.map(recipe => recipe.id);
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

describe('session menu filters', () => {
  it('preserves the current unfiltered plan, order, catalogue and independent defaults', () => {
    const before = JSON.stringify(RECIPES);
    expect(ids(filterRecipes(RECIPES, filters()))).toEqual(ids(RECIPES));
    expect(buildFilteredMealPlan(3, filters())).toEqual(createMealPlan(3));
    const first = defaultMenuFilters();
    first.excludedIngredients.push('arroz');
    expect(defaultMenuFilters().excludedIngredients).toEqual([]);
    expect(JSON.stringify(RECIPES)).toBe(before);
  });

  it('filters by actual preparation times, keeping the exact boundary', () => {
    expect(ids(filterRecipes(RECIPES, filters({ maxMinutes: 20 })))).toEqual(['cuscus-verduras']);
    expect(ids(filterRecipes(RECIPES, filters({ maxMinutes: 30 })))).toEqual([
      'arroz-verduras', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate', 'cuscus-verduras',
    ]);
    expect(filterRecipes(RECIPES, filters({ maxMinutes: 45 }))).toHaveLength(7);
    expect(filterRecipes(RECIPES, filters({ maxMinutes: 60 }))).toHaveLength(7);
  });

  it('uses reviewed ingredients for vegetarian and vegan preferences rather than recipe titles', () => {
    expect(ids(filterRecipes(RECIPES, filters({ preference: 'vegetarian' })))).toEqual([
      'arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate', 'cuscus-verduras',
    ]);
    expect(ids(filterRecipes(RECIPES, filters({ preference: 'vegan' })))).toEqual([
      'arroz-verduras', 'lentejas-casa', 'garbanzos-calabaza', 'cuscus-verduras',
    ]);
    const misleading = { ...copy(RECIPES[5]), title: 'Plato vegano de verduras' };
    expect(filterRecipes([misleading], filters({ preference: 'vegetarian' }))).toEqual([]);
  });

  it('does not inherit a reviewed label merely by reusing a recipe ID', () => {
    const changed = copy(RECIPES[0]);
    changed.ingredients = [...changed.ingredients, RECIPES[5].ingredients[0]];
    expect(filterRecipes([changed], filters())).toHaveLength(1);
    expect(filterRecipes([changed], filters({ preference: 'vegan' }))).toEqual([]);
    const changedNote = copy(RECIPES[0]);
    changedNote.ingredients = changedNote.ingredients.map((ingredient, index) => index === 0 ? { ...ingredient, note: 'Otro producto.' } : ingredient);
    expect(filterRecipes([changedNote], filters({ preference: 'vegetarian' }))).toEqual([]);
  });

  it.each([
    { name: 'caldo de pollo', note: 'Al gusto' },
    { name: 'miel', note: 'Opcional' },
    { name: 'arroz', note: 'Con mantequilla' },
  ])('invalidates the previous dietary review when unmeasured ingredients are added: %j', ingredient => {
    const changed = { ...copy(RECIPES[0]), unmeasuredIngredients: [ingredient] };
    expect(filterRecipes([changed], filters())).toHaveLength(1);
    expect(filterRecipes([changed], filters({ preference: 'vegan' }))).toEqual([]);
    expect(filterRecipes([changed], filters({ preference: 'vegetarian' }))).toEqual([]);
    expect(filterRecipes([changed], filters({ excludedIngredients: [ingredient.name] }))).toEqual([]);
  });

  it('does not inherit a dietary review after a new editorial condition or optional accompaniment', () => {
    const changed = { ...copy(RECIPES[0]), editorialNotes: ['Servir opcionalmente con pollo.'] };
    expect(filterRecipes([changed], filters())).toHaveLength(1);
    expect(filterRecipes([changed], filters({ preference: 'vegan' }))).toEqual([]);
    expect(filterRecipes([changed], filters({ preference: 'vegetarian' }))).toEqual([]);
    expect(filterRecipes([{ ...copy(RECIPES[0]), unmeasuredIngredients: [], editorialNotes: [] }], filters({ preference: 'vegan' })))
      .toEqual([{ ...copy(RECIPES[0]), unmeasuredIngredients: [], editorialNotes: [] }]);
  });

  it('invalidates an old dietary decision when steps or warnings change, including step-only accompaniments', () => {
    const original = copy(RECIPES[0]);
    for (const changed of [
      { ...original, steps: [...original.steps, 'Servir con pollo o mantequilla.'] },
      { ...original, steps: original.steps.slice(1) },
      { ...original, steps: original.steps.map((step, index) => index === 0 ? 'Usar caldo de carne.' : step) },
      { ...original, allergenNote: original.allergenNote + '\nComprobar la composición del caldo.' },
    ]) {
      expect(filterRecipes([changed], filters())).toHaveLength(1);
      expect(filterRecipes([changed], filters({ preference: 'vegan' }))).toEqual([]);
      expect(filterRecipes([changed], filters({ preference: 'vegetarian' }))).toEqual([]);
    }
    expect(filterRecipes([original], filters({ preference: 'vegan' }))).toEqual([original]);
  });

  it('preserves legitimate multiline warnings and editorial conditions without treating them as reviewed', () => {
    const changed = { ...copy(RECIPES[0]), editorialNotes: ['Primera línea\nSegunda línea'],
      allergenNote: 'Ingredientes declarados.\n\nComprobar etiquetas y trazas.' };
    expect(filterRecipes([changed], filters())).toEqual([changed]);
    expect(filterRecipes([changed], filters({ preference: 'vegan' }))).toEqual([]);
  });

  it.each([null, [], [null], [5], ['x'.repeat(2001)], ['no\u0000válido'], Array(1), Array(101).fill('Paso')])(
    'rejects malformed or excessive steps before checking their review: %j', steps => {
      const changed = { ...copy(RECIPES[0]), steps } as unknown as Recipe;
      expect(() => filterRecipes([changed], filters())).toThrow('menuFilters.catalogInvalid');
    });

  it.each([null, 5, {}, 'x'.repeat(10_001), 'no\u0000válido'])('rejects malformed or excessive warnings: %j', allergenNote => {
    const changed = { ...copy(RECIPES[0]), allergenNote } as unknown as Recipe;
    expect(() => filterRecipes([changed], filters())).toThrow('menuFilters.catalogInvalid');
  });

  it.each([null, 7, {}, { name: 'sal', note: 2 }, { name: 'sal', note: null },
    { name: 'sal', note: 'x'.repeat(501) }, { name: 'sal', note: 'no\u0000válido' },
    { name: 'sal', note: 'texto\u202ecambiado' },
  ])('rejects malformed or unsafe unmeasured annotations: %j', ingredient => {
    const changed = { ...copy(RECIPES[0]), unmeasuredIngredients: [ingredient] } as unknown as Recipe;
    expect(() => filterRecipes([changed], filters())).toThrow('menuFilters.catalogInvalid');
  });

  it.each([null, {}, 'nota', [null], [4], ['x'.repeat(2001)], ['no\u0000válido'], Array(1), Array(101).fill('nota')])(
    'rejects malformed or excessive editorial notes: %j', editorialNotes => {
      const changed = { ...copy(RECIPES[0]), editorialNotes } as unknown as Recipe;
      expect(() => filterRecipes([changed], filters())).toThrow('menuFilters.catalogInvalid');
    });

  it('accepts a future valid catalogue for time/exclusion filtering without guessing dietary labels', () => {
    const future = { ...copy(RECIPES[0]), id: 'receta-del-propietario', title: 'Receta propia', minutes: 20 };
    expect(filterRecipes([future], filters({ maxMinutes: 20 }))).toEqual([future]);
    expect(filterRecipes([future], filters({ preference: 'vegetarian' }))).toEqual([]);
    expect(filterRecipes([future], filters({ excludedIngredients: ['arroz'] }))).toEqual([]);
  });

  it('offers each actual canonical ingredient once, independent from the labels of the interface', () => {
    const options = menuIngredientOptions(RECIPES);
    expect(options.find(option => option.key === 'calabacin')).toEqual({ key: 'calabacin', name: 'Calabacín' });
    expect(options.filter(option => option.key === 'aceite de oliva')).toHaveLength(1);
    expect(options).toHaveLength(17);
    expect(validateMenuFilters(filters({ excludedIngredients: ['CALABACÍN'] }), RECIPES).excludedIngredients).toEqual(['calabacin']);
  });

  it('combines exclusions, time and preference without changing the original recipe or filters', () => {
    const input = filters({ maxMinutes: 30, preference: 'vegetarian', excludedIngredients: ['huevos', 'queso rallado'] });
    const before = copy(input);
    expect(ids(filterRecipes(RECIPES, input))).toEqual(['arroz-verduras', 'garbanzos-calabaza', 'cuscus-verduras']);
    expect(input).toEqual(before);
    const validated = validateMenuFilters(input);
    validated.excludedIngredients.push('pollo');
    expect(input).toEqual(before);
  });

  it('refuses to fill a week by duplicating or relaxing filters when fewer than five recipes remain', () => {
    const original = createMealPlan(2);
    expect(() => buildFilteredMealPlan(2, filters({ preference: 'vegan' }))).toThrow(MenuFilterError);
    try { buildFilteredMealPlan(2, filters({ preference: 'vegan' })); }
    catch (error) { expect(error).toMatchObject({ key: 'menuFilters.notEnough', values: { count: 4 } }); }
    expect(() => buildFilteredMealPlan(2, filters({ excludedIngredients: ['aceite de oliva'] }), RECIPES)).toThrow('menuFilters.notEnough');
    expect(original).toEqual(createMealPlan(2));
  });

  it('builds five unique candidates in a supplied deterministic catalogue order', () => {
    const reordered = [...RECIPES].reverse();
    const candidate = buildFilteredMealPlan(4, filters({ maxMinutes: 30 }), reordered);
    expect(candidate).toEqual({ servings: 4, recipeIds: [
      'cuscus-verduras', 'pasta-tomate', 'garbanzos-calabaza', 'tortilla-ensalada', 'arroz-verduras',
    ] });
    expect(new Set(candidate.recipeIds).size).toBe(5);
    candidate.recipeIds.reverse();
    expect(buildFilteredMealPlan(4, filters({ maxMinutes: 30 }), reordered).recipeIds[0]).toBe('cuscus-verduras');
  });

  it.each([null, [], {}, { ...filters(), maxMinutes: 25 }, { ...filters(), maxMinutes: NaN },
    { ...filters(), maxMinutes: '30' }, { ...filters(), preference: 'medical-diet' },
    { ...filters(), excludedIngredients: ['no existe'] }, { ...filters(), excludedIngredients: ['agua', 'AGUA'] },
    { ...filters(), excludedIngredients: ['agua\u200b'] }, { ...filters(), excludedIngredients: Array(MAX_EXCLUDED_INGREDIENTS + 1).fill('agua') },
  ])('rejects invalid or ambiguous filters: %j', input => {
    expect(() => filterRecipes(RECIPES, input as MenuFilters)).toThrow('menuFilters.invalid');
  });

  it.each([0, -1, 13, 1.5, Infinity, NaN, '2', null, undefined])('rejects invalid servings %s before building a candidate', input => {
    expect(() => buildFilteredMealPlan(input as number, filters())).toThrow('menuFilters.servingsInvalid');
  });

  it.each([null, {}, [RECIPES[0], RECIPES[0]], [{ ...RECIPES[0], minutes: NaN }],
    [{ ...RECIPES[0], id: '__proto__\u0000' }], [{ ...RECIPES[0], id: ' receta ' }], [{ ...RECIPES[0], ingredients: [] }],
    [{ ...RECIPES[0], ingredients: Array(2) }],
    [{ ...RECIPES[0], ingredients: Array(2001).fill(RECIPES[0].ingredients[0]) }],
    [{ ...RECIPES[0], ingredients: [{ ...RECIPES[0].ingredients[0], quantityMilli: -1 }] }],
    Array.from({ length: 1001 }, (_, index) => ({ ...RECIPES[0], id: `future-${index}` })),
  ])('rejects a corrupt or excessive catalogue', input => {
    expect(() => filterRecipes(input as readonly Recipe[], filters())).toThrow('menuFilters.catalogInvalid');
  });

  it('does not save unknown recipe IDs into the existing persisted plan contract', () => {
    const future = RECIPES.slice(0, 5).map(recipe => ({ ...copy(recipe), id: `future-${recipe.id}` }));
    expect(filterRecipes(future, filters())).toHaveLength(5);
    expect(() => buildFilteredMealPlan(2, filters(), future)).toThrow();
  });
});
