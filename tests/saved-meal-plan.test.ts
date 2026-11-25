import { describe, expect, it } from 'vitest';
import { RECIPES } from '../src/data/recipes';
import { createMealPlan, validateMealPlan, type Recipe, type RecipeIngredient } from '../src/domain/menus';
import { createMealPlanDraft } from '../src/domain/mealPlanDraft';
import { defaultMenuFilters } from '../src/domain/menuFilters';
import {
  createSavedMealPlan, MAX_SAVED_MEALS, replaceSavedMeal, savedPlanIngredients, savedPlanRecipeIds,
  validateSavedMealPlan, type VariableMealPlan,
} from '../src/domain/savedMealPlan';
import { deriveLocalNotices } from '../src/domain/localPreferences';

const ids = RECIPES.map(recipe => recipe.id);
const variable = (count = 3): VariableMealPlan => ({ kind: 'variable', servings: 2, meals: ids.slice(0, count) });

describe('explicit saved meal selection, separate from legacy five-meal values and drafts', () => {
  it.each(Array.from({ length: MAX_SAVED_MEALS }, (_, index) => index + 1).flatMap(count =>
    [1, 2, 12].map(servings => [count, servings] as const)))(
    'creates %i distinct meals for %i people without persisting session filters', (count, servings) => {
      const plan = createSavedMealPlan(servings, count);
      const chosen = savedPlanRecipeIds(plan);
      expect(chosen).toHaveLength(count);
      expect(new Set(chosen).size).toBe(count);
      expect(chosen.every(id => ids.includes(id))).toBe(true);
      expect(plan.servings).toBe(servings);
      expect('filters' in plan).toBe(false);
      expect('recipeIds' in plan).toBe(count === 5);
      expect('kind' in plan).toBe(count !== 5);
      expect(validateSavedMealPlan(plan)).toEqual(plan);
      expect(savedPlanIngredients(plan).every(ingredient => Number.isSafeInteger(ingredient.quantityMilli) && ingredient.quantityMilli > 0)).toBe(true);
    },
  );

  it('keeps the normal five-meal creation and strict legacy validator unchanged', () => {
    expect(createSavedMealPlan(4, 5)).toEqual(createMealPlan(4));
    const original = createMealPlan(3);
    expect(validateSavedMealPlan(original)).toEqual(original);
    const legacy = validateSavedMealPlan({ ...original, pastedText: 'not stored', filters: defaultMenuFilters() });
    expect(legacy).toEqual(original);
    const explicitV2Five = { kind: 'variable', servings: 3, meals: [...original.recipeIds] };
    expect(validateSavedMealPlan(explicitV2Five)).toEqual(explicitV2Five);
    expect(() => validateMealPlan(explicitV2Five)).toThrow();
  });

  it('converts a generated candidate explicitly and refuses casts of raw drafts even at five meals', () => {
    for (const count of [1, 5, 14]) {
      const draft = createMealPlanDraft(2, count);
      const before = JSON.stringify(draft);
      expect(() => validateSavedMealPlan(draft)).toThrow();
      expect(() => validateSavedMealPlan({ ...draft, recipeIds: ids.slice(0, 5) })).toThrow();
      expect(() => validateSavedMealPlan({ ...draft, kind: 'variable' })).toThrow();
      expect(JSON.stringify(draft)).toBe(before);
      expect(savedPlanRecipeIds(createSavedMealPlan(2, count))).toHaveLength(count);
    }
  });

  it('keeps honest dietary filtering and refuses to fill beyond the reviewed eligible recipes', () => {
    const filters = { ...defaultMenuFilters(), preference: 'vegan' as const };
    const before = JSON.stringify(filters);
    const plan = createSavedMealPlan(2, 4, filters);
    expect(savedPlanRecipeIds(plan)).toEqual(['arroz-verduras', 'lentejas-casa', 'garbanzos-calabaza', 'cuscus-verduras']);
    expect('filters' in plan).toBe(false);
    expect(() => createSavedMealPlan(2, 5, filters)).toThrow();
    try { createSavedMealPlan(2, 14, filters); }
    catch (error) { expect(error).toMatchObject({ code: 'errors.draftNotEnough', params: { count: 4, requested: 14 } }); }
    expect(JSON.stringify(filters)).toBe(before);
  });

  it('preserves count, other saved meals and independent arrays when replacing a variable meal', () => {
    const original = variable();
    const before = JSON.stringify(original);
    const replaced = replaceSavedMeal(original, 0, 'pollo-papas');
    expect(savedPlanRecipeIds(replaced)).toEqual(['pollo-papas', 'lentejas-casa', 'tortilla-ensalada']);
    expect(JSON.stringify(original)).toBe(before);
    expect(() => replaceSavedMeal(original, 0, original.meals[1])).toThrow();
    expect(() => replaceSavedMeal(original, 3, 'pollo-papas')).toThrow();
    expect(() => replaceSavedMeal(original, 0.5, 'pollo-papas')).toThrow();
    expect(() => replaceSavedMeal(original, 0, 'unknown')).toThrow();
    // A later session filter does not retroactively invalidate other saved dishes.
    expect(validateSavedMealPlan(replaced)).toEqual(replaced);
    const selected = savedPlanRecipeIds(original);
    selected.reverse();
    expect(JSON.stringify(original)).toBe(before);
  });

  it('preserves the previous legacy replacement semantics and independent data', () => {
    const original = createMealPlan(3);
    const replaced = replaceSavedMeal(original, 0, 'cuscus-verduras');
    expect(replaced).toEqual({ servings: 3, recipeIds: ['cuscus-verduras', ...original.recipeIds.slice(1)] });
    expect(original).toEqual(createMealPlan(3));
  });

  it('scales the first meal using its actual two-person quantities and adds no prices', () => {
    const plan = createSavedMealPlan(4, 1);
    const ingredients = savedPlanIngredients(plan);
    expect(ingredients.find(ingredient => ingredient.name === 'Arroz')).toMatchObject({ quantityMilli: 320000, unit: 'g' });
    expect(ingredients.find(ingredient => ingredient.name === 'Aceite de oliva')).toMatchObject({ quantityMilli: 40000, unit: 'ml' });
    expect(ingredients.every(ingredient => !('unitPriceCents' in ingredient))).toBe(true);
  });

  it('reports the actual variable meal count in optional local notices', () => {
    expect(deriveLocalNotices({ favoriteStores: [], inAppReminders: true }, [], variable(14))).toEqual([
      { kind: 'recipes', id: 'meal-plan', recipeCount: 14, servings: 2 },
    ]);
    expect(deriveLocalNotices({ favoriteStores: [], inAppReminders: false }, [], variable(14))).toEqual([]);
  });

  it.each([0, -1, 15, 157, 1.5, NaN, Infinity, '5', null, undefined])('rejects invalid or out-of-preview counts: %s', count => {
    expect(() => createSavedMealPlan(2, count as number)).toThrow();
  });

  it.each([0, 13, 1.5, NaN, Infinity, '2', null, undefined])('rejects invalid people for a variable plan: %s', servings => {
    expect(() => validateSavedMealPlan({ ...variable(), servings })).toThrow();
    expect(() => createSavedMealPlan(servings as number, 1)).toThrow();
  });

  it.each([
    null, [], {}, { ...variable(), kind: 'draft' }, { ...variable(), filters: defaultMenuFilters() },
    { ...variable(), recovery: {} }, { ...variable(), meals: [] }, { ...variable(), meals: ids.slice(0, 15) },
    { ...variable(), meals: [ids[0], ids[0]] }, { ...variable(), meals: ['unknown'] },
    { ...variable(), meals: [2] }, { ...variable(), meals: Array(1) },
  ])('rejects ambiguous or malformed variable shapes: %j', input => {
    expect(() => validateSavedMealPlan(input)).toThrow();
  });

  it('rejects inherited fields and inherited meal slots', () => {
    for (const key of ['kind', 'servings', 'meals'] as const) {
      const base = variable();
      const input = Object.assign(Object.create({ [key]: base[key] }), base);
      delete input[key];
      expect(() => validateSavedMealPlan(input)).toThrow();
    }
    const inherited = [ids[0]];
    Object.setPrototypeOf(inherited, { 0: ids[0] });
    delete inherited[0];
    expect(() => validateSavedMealPlan({ ...variable(), meals: inherited })).toThrow();
  });

  it('allows at most 2,000 measured suggestions without truncation', () => {
    const first = RECIPES[0] as Recipe & { ingredients: RecipeIngredient[] };
    const second = RECIPES[1] as Recipe & { ingredients: RecipeIngredient[] };
    const firstBefore = first.ingredients, secondBefore = second.ingredients;
    try {
      first.ingredients = Array.from({ length: 1000 }, () => ({ ...firstBefore[0] }));
      second.ingredients = Array.from({ length: 1000 }, () => ({ ...secondBefore[0] }));
      const plan = { kind: 'variable', servings: 2, meals: [first.id, second.id] };
      expect(savedPlanIngredients(validateSavedMealPlan(plan))).toHaveLength(2000);
      first.ingredients = [...first.ingredients, { ...firstBefore[0] }];
      expect(() => validateSavedMealPlan(plan)).toThrow();
      expect(() => savedPlanIngredients(plan as VariableMealPlan)).toThrow();
    } finally {
      first.ingredients = firstBefore;
      second.ingredients = secondBefore;
    }
  });
});
