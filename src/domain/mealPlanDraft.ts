import { RECIPES } from '../data/recipes';
import { appError } from '../i18n/errors';
import {
  defaultMenuFilters, filterRecipes, validateMenuFilters, type MenuFilters,
} from './menuFilters';
import { scaleRecipe, type ScaledIngredient } from './menus';

/**
 * In-memory preparation for variable meal counts. Deliberately incompatible
 * with MealPlan/menus.v1: no recipeIds field, storage, prices or calendar days.
 */
export interface MealPlanDraft {
  kind: 'draft';
  servings: number;
  meals: string[];
  filters: MenuFilters;
}

const MAX_DRAFT_INGREDIENTS = 2000;
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);

function checkServings(value: unknown): asserts value is number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 12) {
    throw appError('errors.servings');
  }
}

function checkMealCount(value: unknown): asserts value is number {
  // A technical bound from the published catalogue, not a promised UI range.
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > RECIPES.length) {
    throw appError('errors.draftMealCount', { max: RECIPES.length });
  }
}

/** Validate filters and every selected ID; return independent, whitelisted data. */
export function validateMealPlanDraft(input: unknown): MealPlanDraft {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw appError('errors.draftInvalid');
  const value = input as Record<string, unknown>;
  if (!['kind', 'servings', 'meals', 'filters'].every(key => own(value, key)) || value.kind !== 'draft') {
    throw appError('errors.draftInvalid');
  }
  checkServings(value.servings);
  if (!Array.isArray(value.meals)) throw appError('errors.draftInvalid');
  checkMealCount(value.meals.length);
  const meals: string[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < value.meals.length; index += 1) {
    const id: unknown = value.meals[index];
    if (!own(value.meals, String(index)) || typeof id !== 'string' || seen.has(id)) {
      throw appError('errors.draftInvalid');
    }
    if (!RECIPES.some(recipe => recipe.id === id)) throw appError('errors.recipeMissing');
    seen.add(id);
    meals.push(id);
  }
  const filters = validateMenuFilters(value.filters as MenuFilters);
  const eligible = new Map(filterRecipes(RECIPES, filters).map(recipe => [recipe.id, recipe]));
  let ingredients = 0;
  for (const id of meals) {
    const recipe = eligible.get(id);
    if (!recipe) throw appError('errors.draftMealInvalid');
    ingredients += recipe.ingredients.length;
    if (ingredients > MAX_DRAFT_INGREDIENTS) throw appError('errors.proposalTooMany');
  }
  return { kind: 'draft', servings: value.servings, meals, filters };
}

/** Deterministic candidate only: never repeats recipes or relaxes the filters. */
export function createMealPlanDraft(
  servings: number, mealCount: number, filters: MenuFilters = defaultMenuFilters(),
): MealPlanDraft {
  checkServings(servings);
  checkMealCount(mealCount);
  const selectedFilters = validateMenuFilters(filters);
  const eligible = filterRecipes(RECIPES, selectedFilters);
  if (eligible.length < mealCount) {
    throw appError('errors.draftNotEnough', { count: eligible.length, requested: mealCount });
  }
  return validateMealPlanDraft({
    kind: 'draft', servings, meals: eligible.slice(0, mealCount).map(recipe => recipe.id), filters: selectedFilters,
  });
}

/** Replacement must still satisfy the draft's exact filters and distinctness. */
export function replaceDraftMeal(plan: MealPlanDraft, index: number, recipeId: string): MealPlanDraft {
  const validated = validateMealPlanDraft(plan);
  if (!Number.isInteger(index) || index < 0 || index >= validated.meals.length) {
    throw appError('errors.draftMealInvalid');
  }
  return validateMealPlanDraft({
    ...validated, meals: validated.meals.map((id, position) => position === index ? recipeId : id),
  });
}

/** Raw scaled suggestions for a later review; no automatic merge or list write. */
export function draftPlanIngredients(plan: MealPlanDraft): ScaledIngredient[] {
  const validated = validateMealPlanDraft(plan);
  const recipes = new Map(RECIPES.map(recipe => [recipe.id, recipe]));
  return validated.meals.flatMap(id => scaleRecipe(recipes.get(id)!, validated.servings));
}
