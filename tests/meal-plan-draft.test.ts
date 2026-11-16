import { describe, expect, it, vi } from 'vitest';
import { RECIPES } from '../src/data/recipes';
import {
  createMealPlanDraft, draftPlanIngredients, replaceDraftMeal, validateMealPlanDraft,
  type MealPlanDraft,
} from '../src/domain/mealPlanDraft';
import { defaultMenuFilters, filterRecipes, type MenuFilters } from '../src/domain/menuFilters';
import { scaleRecipe, validateMealPlan } from '../src/domain/menus';

const filters = (overrides: Partial<MenuFilters> = {}): MenuFilters => ({ ...defaultMenuFilters(), ...overrides });
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const recipeIds = RECIPES.map(recipe => recipe.id);

describe('motor efímero de N comidas, sin activar otra capacidad en pantalla', () => {
  it.each([1, 2, 12].flatMap(servings =>
    Array.from({ length: RECIPES.length }, (_, index) => [index + 1, servings] as const),
  ))('genera %i comidas para %i personas sin repetir ni perder platos', (count, servings) => {
    const catalogBefore = JSON.stringify(RECIPES);
    const draft = createMealPlanDraft(servings, count);
    expect(draft.kind).toBe('draft');
    expect(draft.servings).toBe(servings);
    expect(draft.meals).toHaveLength(count);
    expect(new Set(draft.meals).size).toBe(count);
    expect(draft.meals.every(id => recipeIds.includes(id))).toBe(true);
    expect(createMealPlanDraft(servings, count)).toEqual(draft);
    expect(validateMealPlanDraft(draft)).toEqual(draft);
    expect(JSON.stringify(RECIPES)).toBe(catalogBefore);
  });

  it('no comparte selección ni exclusiones entre borradores, validación o entrada', () => {
    const selected = filters({ excludedIngredients: ['HUEVOS'] });
    const original = copy(selected);
    const draft = createMealPlanDraft(3, 3, selected);
    const expected = copy(draft);
    expect(draft.filters.excludedIngredients).toEqual(['huevos']);
    selected.excludedIngredients.push('pollo');
    expect(draft).toEqual(expected);
    const validated = validateMealPlanDraft(draft);
    validated.meals.reverse();
    validated.filters.excludedIngredients.push('pollo');
    expect(draft).toEqual(expected);
    draft.meals.reverse();
    expect(createMealPlanDraft(3, 3, original)).toEqual(expected);
    const firstDefault = createMealPlanDraft(2, 1);
    firstDefault.filters.excludedIngredients.push('agua');
    expect(createMealPlanDraft(2, 1).filters.excludedIngredients).toEqual([]);
  });

  it('acepta entradas congeladas y nunca necesita modificarlas para validar, sustituir o escalar', () => {
    const selected = filters({ preference: 'vegan' });
    Object.freeze(selected.excludedIngredients);
    Object.freeze(selected);
    const original = createMealPlanDraft(3, 2, selected);
    const before = copy(original);
    Object.freeze(original.meals);
    Object.freeze(original.filters.excludedIngredients);
    Object.freeze(original.filters);
    Object.freeze(original);
    expect(validateMealPlanDraft(original)).toEqual(before);
    expect(replaceDraftMeal(original, 0, 'cuscus-verduras').meals).toEqual(['cuscus-verduras', 'lentejas-casa']);
    expect(draftPlanIngredients(original).length).toBeGreaterThan(0);
    expect(original).toEqual(before);
  });

  it.each([0, -1, 0.5, 1.5, RECIPES.length + 1, Number.MAX_SAFE_INTEGER, NaN, Infinity, -Infinity, '5', null, undefined])(
    'rechaza un número de comidas inválido o fuera del catálogo: %s', count => {
      expect(() => createMealPlanDraft(2, count as number)).toThrow();
      try { createMealPlanDraft(2, count as number); }
      catch (error) { expect(error).toMatchObject({ code: 'errors.draftMealCount' }); }
    },
  );

  it.each([0, -1, 1.5, 13, NaN, Infinity, '2', null, undefined])('mantiene personas entre 1 y 12: %s', servings => {
    expect(() => createMealPlanDraft(servings as number, 1)).toThrow();
    expect(() => validateMealPlanDraft({ ...createMealPlanDraft(2, 1), servings })).toThrow();
  });

  it('conserva filtros combinados por contenido, tiempo y exclusiones', () => {
    const selected = filters({ maxMinutes: 30, preference: 'vegetarian', excludedIngredients: ['huevos', 'queso rallado'] });
    const before = copy(selected);
    const draft = createMealPlanDraft(4, 3, selected);
    expect(draft.meals).toEqual(['arroz-verduras', 'garbanzos-calabaza', 'cuscus-verduras']);
    expect(draft.meals).toEqual(filterRecipes(RECIPES, selected).map(recipe => recipe.id));
    expect(draft.filters).toEqual(before);
    expect(selected).toEqual(before);
    expect(validateMealPlanDraft(draft)).toEqual(draft);
  });

  it('no usa títulos ni importaciones sin revisión como certificación dietética', () => {
    const vegan = createMealPlanDraft(2, 4, filters({ preference: 'vegan' }));
    expect(vegan.meals).toEqual(['arroz-verduras', 'lentejas-casa', 'garbanzos-calabaza', 'cuscus-verduras']);
    expect(() => createMealPlanDraft(2, 5, filters({ preference: 'vegan' }))).toThrow();
    try { createMealPlanDraft(2, 5, filters({ preference: 'vegan' })); }
    catch (error) { expect(error).toMatchObject({ code: 'errors.draftNotEnough', params: { count: 4, requested: 5 } }); }
  });

  it('rechaza cero coincidencias sin repetir recetas ni relajar una exclusión', () => {
    const selected = filters({ preference: 'vegan', excludedIngredients: ['aceite de oliva'] });
    const before = copy(selected);
    expect(filterRecipes(RECIPES, selected)).toEqual([]);
    expect(() => createMealPlanDraft(2, 1, selected)).toThrow();
    try { createMealPlanDraft(2, 1, selected); }
    catch (error) { expect(error).toMatchObject({ code: 'errors.draftNotEnough', params: { count: 0, requested: 1 } }); }
    expect(selected).toEqual(before);
  });

  it.each([null, [], {}, { ...filters(), maxMinutes: 25 }, { ...filters(), preference: 'allergy-safe' },
    { ...filters(), excludedIngredients: ['ingrediente-inventado'] },
    { ...filters(), excludedIngredients: ['agua', 'AGUA'] },
  ])('no acepta filtros inválidos: %j', invalid => {
    expect(() => createMealPlanDraft(2, 1, invalid as MenuFilters)).toThrow();
    expect(() => validateMealPlanDraft({ ...createMealPlanDraft(2, 1), filters: invalid })).toThrow();
  });
});

describe('fronteras de validación y separación del menú persistido', () => {
  const valid = () => createMealPlanDraft(2, 3);

  it.each([null, [], {}, { kind: 'draft' }, { ...valid(), kind: 'saved' }, { ...valid(), meals: [] },
    { ...valid(), meals: recipeIds.concat('receta-desconocida') },
    { ...valid(), meals: [recipeIds[0], recipeIds[0]] }, { ...valid(), meals: [1] },
    { ...valid(), meals: ['__proto__'] }, { ...valid(), meals: ['constructor'] },
    { ...valid(), meals: ['no-publicada'] }, { ...valid(), meals: [' ' + recipeIds[0]] },
    { ...valid(), meals: [recipeIds[0] + '\u0000'] },
  ])('rechaza borradores corruptos o IDs ajenos al catálogo publicado: %j', invalid => {
    expect(() => validateMealPlanDraft(invalid)).toThrow();
  });

  it('rechaza huecos y elementos heredados, no los convierte en recetas implícitas', () => {
    const sparse = [recipeIds[0], , recipeIds[1]];
    expect(() => validateMealPlanDraft({ ...valid(), meals: sparse })).toThrow();
    const inherited = new Array<string>(1);
    Object.setPrototypeOf(inherited, { 0: recipeIds[0] });
    expect(() => validateMealPlanDraft({ ...valid(), meals: inherited })).toThrow();
    for (const key of ['kind', 'servings', 'meals', 'filters']) {
      const original = valid();
      const ownFields = { ...original } as Record<string, unknown>;
      delete ownFields[key];
      const input = Object.assign(Object.create({ [key]: original[key as keyof MealPlanDraft] }), ownFields);
      expect(() => validateMealPlanDraft(input)).toThrow();
    }
  });

  it('vuelve a verificar filtros aunque una selección se haya editado fuera del motor', () => {
    const vegan = createMealPlanDraft(2, 2, filters({ preference: 'vegan' }));
    expect(() => validateMealPlanDraft({ ...vegan, meals: ['pollo-papas', vegan.meals[1]] })).toThrow();
    const quick = createMealPlanDraft(2, 1, filters({ maxMinutes: 20 }));
    expect(() => validateMealPlanDraft({ ...quick, meals: ['lentejas-casa'] })).toThrow();
    const excluding = createMealPlanDraft(2, 1, filters({ excludedIngredients: ['huevos'] }));
    expect(() => validateMealPlanDraft({ ...excluding, meals: ['tortilla-ensalada'] })).toThrow();
  });

  it('elimina campos extra sin convertir presupuesto en coste o gasto', () => {
    const extra = { ...valid(), budgetCents: 5000, unitPriceCents: 100, paid: true, pastedText: 'No guardar' };
    expect(validateMealPlanDraft(extra)).toEqual(valid());
    expect(draftPlanIngredients(extra).every(ingredient =>
      !('unitPriceCents' in ingredient) && !('budgetCents' in ingredient) && !('price' in ingredient))).toBe(true);
  });

  it.each([1, 5, 6, RECIPES.length])('un borrador de %i comidas nunca cumple el contrato menus.v1', count => {
    const draft = createMealPlanDraft(2, count);
    expect(draft).not.toHaveProperty('recipeIds');
    expect(() => validateMealPlan(draft)).toThrow();
  });
});

describe('edición y cantidades antes de una futura confirmación', () => {
  it.each([1, 3, 5, 8])('sustituye un plato en un borrador de %i sin modificar la entrada', count => {
    const original = createMealPlanDraft(3, count);
    const before = copy(original);
    const replacement = recipeIds.find(id => !original.meals.includes(id))!;
    const result = replaceDraftMeal(original, count - 1, replacement);
    expect(result.meals).toHaveLength(count);
    expect(result.meals[count - 1]).toBe(replacement);
    expect(result.meals.slice(0, count - 1)).toEqual(original.meals.slice(0, count - 1));
    expect(original).toEqual(before);
    result.filters.excludedIngredients.push('agua');
    expect(original).toEqual(before);
    expect(replaceDraftMeal(original, 0, original.meals[0])).toEqual(original);
  });

  it.each([-1, 3, 0.5, NaN, Infinity, '0', null, undefined])('rechaza un índice inválido: %s', index => {
    const original = createMealPlanDraft(2, 3);
    const before = copy(original);
    expect(() => replaceDraftMeal(original, index as number, recipeIds[4])).toThrow();
    expect(original).toEqual(before);
  });

  it('no admite repetir, usar IDs desconocidos ni vulnerar filtros al sustituir', () => {
    const original = createMealPlanDraft(2, 2, filters({ preference: 'vegan' }));
    const before = copy(original);
    for (const replacement of [original.meals[1], 'no-publicada', 'pollo-papas']) {
      expect(() => replaceDraftMeal(original, 0, replacement)).toThrow();
      expect(original).toEqual(before);
    }
    const changed = replaceDraftMeal(original, 0, 'cuscus-verduras');
    expect(changed.meals).toEqual(['cuscus-verduras', 'lentejas-casa']);
    expect(changed.filters).toEqual(original.filters);
    expect(() => replaceDraftMeal({ ...original, meals: [original.meals[0], original.meals[0]] }, 0, 'cuscus-verduras')).toThrow();
  });

  it.each([1, 2, 12])('escala todos los platos para %i personas sin omitir cantidades o redondeos', servings => {
    const draft = createMealPlanDraft(servings, RECIPES.length);
    const before = copy(draft);
    const result = draftPlanIngredients(draft);
    expect(result).toEqual(draft.meals.flatMap(id => scaleRecipe(RECIPES.find(recipe => recipe.id === id)!, servings)));
    expect(result.length).toBe(RECIPES.reduce((total, recipe) => total + recipe.ingredients.length, 0));
    expect(result.length).toBeLessThanOrEqual(2000);
    expect(result.every(ingredient => !('price' in ingredient) && !('unitPriceCents' in ingredient))).toBe(true);
    const firstOriginalQuantity = RECIPES[0].ingredients[0].quantityMilli;
    result[0].quantityMilli = 1;
    expect(RECIPES[0].ingredients[0].quantityMilli).toBe(firstOriginalQuantity);
    expect(draft).toEqual(before);
  });

  it('rechaza entradas corruptas antes de producir cantidades', () => {
    const draft = createMealPlanDraft(2, 2);
    expect(() => draftPlanIngredients({ ...draft, meals: ['no-publicada'] })).toThrow();
    expect(() => draftPlanIngredients({ ...draft, servings: 13 })).toThrow();
  });

  it('limita la propuesta completa a 2000 ingredientes y no trunca el exceso', async () => {
    // Future catalogue growth must fail at the proposal boundary, even when each recipe is valid.
    const makeRecipe = (id: string, count: number) => ({
      ...copy(RECIPES[0]), id,
      ingredients: Array.from({ length: count }, () => ({ ...RECIPES[0].ingredients[0] })),
    });
    const catalog = [makeRecipe('limite-a', 1000), makeRecipe('limite-b', 1000)];
    try {
      vi.resetModules();
      vi.doMock('../src/data/recipes', () => ({ RECIPES: catalog }));
      const engine = await import('../src/domain/mealPlanDraft');
      const atLimit = engine.createMealPlanDraft(2, 2);
      expect(engine.draftPlanIngredients(atLimit)).toHaveLength(2000);
      catalog[1].ingredients.push({ ...RECIPES[0].ingredients[0] });
      expect(() => engine.draftPlanIngredients(atLimit)).toThrow();
      try { engine.draftPlanIngredients(atLimit); }
      catch (error) { expect(error).toMatchObject({ code: 'errors.proposalTooMany' }); }
    } finally {
      vi.doUnmock('../src/data/recipes');
      vi.resetModules();
    }
  });
});
