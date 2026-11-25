import { RECIPES } from '../data/recipes';
import { appError } from '../i18n/errors';
import { createMealPlanDraft } from './mealPlanDraft';
import { defaultMenuFilters, type MenuFilters } from './menuFilters';
import { DEFAULT_SAVED_MEALS, MAX_SAVED_MEALS, MIN_SAVED_MEALS } from './mealPlanLimits';
import {
  planIngredients, replaceMeal, scaleRecipe, validateMealPlan,
  type MealPlan, type ScaledIngredient,
} from './menus';

export { MAX_SAVED_MEALS } from './mealPlanLimits';

/** A deliberately distinct persisted shape; session dietary filters are absent. */
export interface VariableMealPlan {
  kind: 'variable';
  servings: number;
  meals: string[];
}

/** Legacy five-meal values keep their original shape and durable-fence hashes. */
export type SavedMealPlan = MealPlan | VariableMealPlan;

const MAX_PLAN_INGREDIENTS = 2000;
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function checkCount(value: unknown): asserts value is number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < MIN_SAVED_MEALS || value > MAX_SAVED_MEALS) {
    throw appError('errors.draftMealCount', { max: MAX_SAVED_MEALS });
  }
}

function variable(plan: SavedMealPlan): plan is VariableMealPlan {
  return own(plan, 'kind');
}

/** No draft, hidden recovery data, pasted text or filter state crosses this gate. */
function validateVariableMealPlan(input: unknown): VariableMealPlan {
  if (!record(input) || Object.keys(input).length !== 3
    || !['kind', 'servings', 'meals'].every(key => own(input, key)) || input.kind !== 'variable') {
    throw appError('errors.menuInvalid');
  }
  if (typeof input.servings !== 'number' || !Number.isInteger(input.servings) || input.servings < 1 || input.servings > 12) {
    throw appError('errors.servings');
  }
  if (!Array.isArray(input.meals)) throw appError('errors.menuInvalid');
  checkCount(input.meals.length);
  const recipes = new Map(RECIPES.map(recipe => [recipe.id, recipe]));
  const meals: string[] = [];
  const seen = new Set<string>();
  let ingredients = 0;
  for (let index = 0; index < input.meals.length; index++) {
    const id: unknown = input.meals[index];
    if (!own(input.meals, String(index)) || typeof id !== 'string' || seen.has(id)) throw appError('errors.menuInvalid');
    const recipe = recipes.get(id);
    if (!recipe) throw appError('errors.recipeMissing');
    if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) throw appError('errors.recipeIngredients');
    ingredients += recipe.ingredients.length;
    if (ingredients > MAX_PLAN_INGREDIENTS) throw appError('errors.proposalTooMany');
    meals.push(id); seen.add(id);
  }
  return { kind: 'variable', servings: input.servings, meals };
}

/** An explicit union validator, never an implicit legacy/draft conversion. */
export function validateSavedMealPlan(input: unknown): SavedMealPlan {
  if (!record(input)) throw appError('errors.menuInvalid');
  return own(input, 'kind') ? validateVariableMealPlan(input) : validateMealPlan(input);
}

/** Return independent IDs while preserving the selected plan's representation. */
export function savedPlanRecipeIds(plan: SavedMealPlan): string[] {
  const validated = validateSavedMealPlan(plan);
  return variable(validated) ? [...validated.meals] : [...validated.recipeIds];
}

/** Candidate only. The UI still requires an explicit confirmation before writing. */
export function createSavedMealPlan(servings: number, count: number, filters: MenuFilters = defaultMenuFilters()): SavedMealPlan {
  checkCount(count);
  const draft = createMealPlanDraft(servings, count, filters);
  // Keep the normal five-meal workflow and its v1 serializer unchanged.
  return count === DEFAULT_SAVED_MEALS
    ? validateMealPlan({ servings: draft.servings, recipeIds: [...draft.meals] })
    : validateVariableMealPlan({ kind: 'variable', servings: draft.servings, meals: [...draft.meals] });
}

/** A saved plan does not retain session filters or reclassify its other meals. */
export function replaceSavedMeal(plan: SavedMealPlan, index: number, recipeId: string): SavedMealPlan {
  const validated = validateSavedMealPlan(plan);
  if (!variable(validated)) return replaceMeal(validated, index, recipeId);
  if (!Number.isInteger(index) || index < 0 || index >= validated.meals.length) throw appError('errors.draftMealInvalid');
  return validateVariableMealPlan({
    kind: 'variable', servings: validated.servings,
    meals: validated.meals.map((id, position) => position === index ? recipeId : id),
  });
}

/** Reuse integer scaling and expose raw suggestions for the existing review UI. */
export function savedPlanIngredients(plan: SavedMealPlan): ScaledIngredient[] {
  const validated = validateSavedMealPlan(plan);
  if (!variable(validated)) {
    const ingredients = planIngredients(validated);
    if (ingredients.length > MAX_PLAN_INGREDIENTS) throw appError('errors.proposalTooMany');
    return ingredients;
  }
  const recipes = new Map(RECIPES.map(recipe => [recipe.id, recipe]));
  const ingredients: ScaledIngredient[] = [];
  for (const id of validated.meals) {
    const next = scaleRecipe(recipes.get(id)!, validated.servings);
    if (ingredients.length + next.length > MAX_PLAN_INGREDIENTS) throw appError('errors.proposalTooMany');
    ingredients.push(...next);
  }
  return ingredients;
}
