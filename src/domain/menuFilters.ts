import { RECIPES } from '../data/recipes';
import { recipeMessages } from '../i18n/catalogs/recipes';
import { normalizeIngredientName, scaleRecipe, validateMealPlan, type MealPlan, type Recipe } from './menus';
import type { Category, Unit } from './shopping';

export const MAX_MENU_MINUTES = [20, 30, 45, 60] as const;
export const MAX_EXCLUDED_INGREDIENTS = 50;
const MAX_RECIPES = 1000;
const MAX_TOTAL_INGREDIENTS = 20_000;
const UNSAFE_TEXT = /[\u0000-\u001F\u007F-\u009F\u200B\u200E\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/;

/** Session preferences only. This module never reads or writes user storage. */
export interface MenuFilters {
  maxMinutes: number | null;
  preference: 'any' | 'vegetarian' | 'vegan';
  excludedIngredients: string[];
}

export type MenuFilterErrorKey = 'menuFilters.invalid' | 'menuFilters.catalogInvalid'
  | 'menuFilters.notEnough' | 'menuFilters.servingsInvalid';

export class MenuFilterError extends Error {
  constructor(readonly key: MenuFilterErrorKey, readonly values?: Readonly<Record<string, string | number>>) {
    super(key);
    this.name = 'MenuFilterError';
  }
}

export function defaultMenuFilters(): MenuFilters {
  return { maxMinutes: null, preference: 'any', excludedIngredients: [] };
}

type IngredientReview = readonly [name: string, quantityMilli: number, unit: Unit, category: Category, note?: string];
type ReviewedPreference = 'vegan' | 'vegetarian' | 'any';
const vegetable: Category = 'Fruta y verdura';
const pantry: Category = 'Despensa';
const dairy: Category = 'Lácteos y huevos';
const other: Category = 'Otros';
const waterNote = recipeMessages.es['recipes.note.water'];
const drainedNote = recipeMessages.es['recipes.note.drained'];

function ingredientSignature(ingredients: readonly IngredientReview[]): string {
  // Exact data comparison, rather than guessing from categories, titles or an ID.
  return ingredients.map(([name, quantity, unit, category, note]) =>
    JSON.stringify([normalizeIngredientName(name), quantity, unit, category, note ?? ''])).sort().join('\n');
}

/** Reviewed culinary contents of the current seven recipes, not an allergy certification. */
const reviewedPreferences = new Map<string, { preference: ReviewedPreference; signature: string }>([
  ['arroz-verduras', { preference: 'vegan', signature: ingredientSignature([
    ['arroz', 160000, 'g', pantry], ['calabacin', 200000, 'g', vegetable],
    ['zanahoria', 150000, 'g', vegetable], ['cebolla', 100000, 'g', vegetable],
    ['aceite de oliva', 20000, 'ml', pantry], ['agua', 400000, 'ml', other, waterNote],
  ]) }],
  ['lentejas-casa', { preference: 'vegan', signature: ingredientSignature([
    ['lentejas secas', 180000, 'g', pantry], ['papas', 250000, 'g', vegetable],
    ['zanahoria', 150000, 'g', vegetable], ['cebolla', 100000, 'g', vegetable],
    ['aceite de oliva', 20000, 'ml', pantry], ['agua', 700000, 'ml', other, waterNote],
  ]) }],
  ['tortilla-ensalada', { preference: 'vegetarian', signature: ingredientSignature([
    ['huevos', 3000, 'ud', dairy], ['papas', 300000, 'g', vegetable],
    ['lechuga', 100000, 'g', vegetable], ['tomate', 150000, 'g', vegetable],
    ['aceite de oliva', 20000, 'ml', pantry],
  ]) }],
  ['garbanzos-calabaza', { preference: 'vegan', signature: ingredientSignature([
    ['garbanzos cocidos', 400000, 'g', pantry, drainedNote], ['calabaza', 300000, 'g', vegetable],
    ['cebolla', 100000, 'g', vegetable], ['tomate', 150000, 'g', vegetable],
    ['aceite de oliva', 20000, 'ml', pantry],
  ]) }],
  ['pasta-tomate', { preference: 'vegetarian', signature: ingredientSignature([
    ['pasta', 180000, 'g', pantry], ['tomate', 300000, 'g', vegetable],
    ['cebolla', 100000, 'g', vegetable], ['aceite de oliva', 20000, 'ml', pantry],
    ['queso rallado', 30000, 'g', dairy],
  ]) }],
  ['pollo-papas', { preference: 'any', signature: ingredientSignature([
    ['pollo', 300000, 'g', 'Carne y pescado'], ['papas', 400000, 'g', vegetable],
    ['zanahoria', 150000, 'g', vegetable], ['cebolla', 100000, 'g', vegetable],
    ['aceite de oliva', 20000, 'ml', pantry],
  ]) }],
  ['cuscus-verduras', { preference: 'vegan', signature: ingredientSignature([
    ['cuscus', 160000, 'g', pantry], ['calabacin', 200000, 'g', vegetable],
    ['zanahoria', 150000, 'g', vegetable], ['garbanzos cocidos', 200000, 'g', pantry, drainedNote],
    ['aceite de oliva', 20000, 'ml', pantry], ['agua', 200000, 'ml', other, waterNote],
  ]) }],
]);

function cleanName(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 120 && !UNSAFE_TEXT.test(value);
}

function validateCatalog(recipes: readonly Recipe[]): void {
  if (!Array.isArray(recipes) || recipes.length > MAX_RECIPES) throw new MenuFilterError('menuFilters.catalogInvalid');
  let ingredientCount = 0;
  const ids = new Set<string>();
  for (const recipe of recipes) {
    if (!recipe || typeof recipe !== 'object' || !cleanName(recipe.id) || recipe.id !== recipe.id.trim() || ids.has(recipe.id)
      || !cleanName(recipe.title) || !Number.isInteger(recipe.minutes) || recipe.minutes < 1 || recipe.minutes > 1440
      || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0 || recipe.ingredients.length > 2000
      || Array.from(recipe.ingredients).some((ingredient: unknown) => !ingredient || typeof ingredient !== 'object'
        || !('name' in ingredient) || !cleanName(ingredient.name))) {
      throw new MenuFilterError('menuFilters.catalogInvalid');
    }
    ingredientCount += recipe.ingredients.length;
    if (ingredientCount > MAX_TOTAL_INGREDIENTS) throw new MenuFilterError('menuFilters.catalogInvalid');
    try { scaleRecipe(recipe, recipe.baseServings); }
    catch { throw new MenuFilterError('menuFilters.catalogInvalid'); }
    ids.add(recipe.id);
  }
}

function ingredientOptions(recipes: readonly Recipe[]): { key: string; name: string }[] {
  const options = new Map<string, string>();
  for (const recipe of recipes) for (const ingredient of recipe.ingredients) {
    const key = normalizeIngredientName(ingredient.name);
    if (!options.has(key)) options.set(key, ingredient.name.trim());
  }
  return [...options].map(([key, name]) => ({ key, name }));
}

/** Stable canonical keys; the presentation translates names without changing stored culinary data. */
export function menuIngredientOptions(recipes: readonly Recipe[] = RECIPES): { key: string; name: string }[] {
  validateCatalog(recipes);
  return ingredientOptions(recipes);
}

function validatedFilters(input: MenuFilters, recipes: readonly Recipe[]): MenuFilters {
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || !Object.prototype.hasOwnProperty.call(input, 'maxMinutes')
    || !Object.prototype.hasOwnProperty.call(input, 'preference')
    || !Object.prototype.hasOwnProperty.call(input, 'excludedIngredients')
    || (input.maxMinutes !== null && !(MAX_MENU_MINUTES as readonly unknown[]).includes(input.maxMinutes))
    || !['any', 'vegetarian', 'vegan'].includes(input.preference)
    || !Array.isArray(input.excludedIngredients) || input.excludedIngredients.length > MAX_EXCLUDED_INGREDIENTS) {
    throw new MenuFilterError('menuFilters.invalid');
  }
  const knownNames = new Set(ingredientOptions(recipes).map(option => option.key));
  const excludedIngredients: string[] = [];
  const seen = new Set<string>();
  for (const name of input.excludedIngredients) {
    if (!cleanName(name)) throw new MenuFilterError('menuFilters.invalid');
    const key = normalizeIngredientName(name);
    if (!knownNames.has(key) || seen.has(key)) throw new MenuFilterError('menuFilters.invalid');
    seen.add(key);
    excludedIngredients.push(key);
  }
  return { maxMinutes: input.maxMinutes, preference: input.preference, excludedIngredients };
}

export function validateMenuFilters(filters: MenuFilters, recipes: readonly Recipe[] = RECIPES): MenuFilters {
  validateCatalog(recipes);
  return validatedFilters(filters, recipes);
}

export function filterRecipes(recipes: readonly Recipe[], filters: MenuFilters): Recipe[] {
  validateCatalog(recipes);
  const selected = validatedFilters(filters, recipes);
  const excluded = new Set(selected.excludedIngredients);
  return recipes.filter(recipe => {
    if (selected.maxMinutes !== null && recipe.minutes > selected.maxMinutes) return false;
    if (recipe.ingredients.some(ingredient => excluded.has(normalizeIngredientName(ingredient.name)))) return false;
    if (selected.preference === 'any') return true;
    const reviewed = reviewedPreferences.get(recipe.id);
    if (!reviewed || reviewed.signature !== ingredientSignature(recipe.ingredients.map(ingredient =>
      [ingredient.name, ingredient.quantityMilli, ingredient.unit, ingredient.category, ingredient.note]))) return false;
    return reviewed.preference === 'vegan' || (selected.preference === 'vegetarian' && reviewed.preference === 'vegetarian');
  });
}

/** Build a candidate only. Persisting or replacing a saved plan always remains a separate user action. */
export function buildFilteredMealPlan(servings: number, filters: MenuFilters, recipes: readonly Recipe[] = RECIPES): MealPlan {
  if (!Number.isInteger(servings) || servings < 1 || servings > 12) throw new MenuFilterError('menuFilters.servingsInvalid');
  const eligible = filterRecipes(recipes, filters);
  if (eligible.length < 5) throw new MenuFilterError('menuFilters.notEnough', { count: eligible.length });
  // The current persistence contract accepts only the current catalogue's IDs.
  // A future imported catalogue must be integrated with its validator before saving its IDs.
  return validateMealPlan({ servings, recipeIds: eligible.slice(0, 5).map(recipe => recipe.id) });
}
