import { appError } from '../i18n/errors';
import { RECIPES } from '../data/recipes';
import { CATEGORIES, UNITS, formatQuantity, parseQuantity, type Category, type Unit } from './shopping';

export interface RecipeIngredient {
  name: string;
  quantityMilli: number;
  unit: Unit;
  category: Category;
  note?: string;
}

export interface Recipe {
  id: string;
  title: string;
  minutes: number;
  baseServings: number;
  ingredients: readonly RecipeIngredient[];
  steps: readonly string[];
  allergenNote: string;
}

export interface ScaledIngredient extends RecipeIngredient {
  /** Quantity was rounded to a representable thousandth or a whole shopping unit. */
  rounded: boolean;
}

export interface MealPlan {
  servings: number;
  recipeIds: string[];
}

export interface CanonicalMeasure {
  dimension: 'mass' | 'volume' | 'count';
  quantityMilli: number;
  unit: 'g' | 'ml' | 'ud';
}

const MAX_QUANTITY_MILLI = 1_000_000_000n;
const MAX_INGREDIENTS = 2000;
const INGREDIENT_ALIASES = new Map([
  ['aceite oliva', 'aceite de oliva'], ['platanos', 'platano'],
]);

function checkServings(value: unknown): asserts value is number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 12) {
    throw appError("errors.servings");
  }
}

function checkIngredient(ingredient: RecipeIngredient): void {
  if (!ingredient || typeof ingredient.name !== 'string' || !ingredient.name.trim() || ingredient.name.trim().length > 120 ||
      !(UNITS as readonly unknown[]).includes(ingredient.unit) ||
      !(CATEGORIES as readonly unknown[]).includes(ingredient.category) ||
      (ingredient.note !== undefined && (typeof ingredient.note !== 'string' || ingredient.note.length > 500))) {
    throw appError("errors.ingredientInvalid");
  }
  // Reuse the shopping quantity contract without decimal floating point.
  parseQuantity(formatQuantity(ingredient.quantityMilli), ingredient.unit);
}

function checkedQuantity(value: bigint, unit: Unit): number {
  if (value <= 0n || value > MAX_QUANTITY_MILLI) throw appError("errors.scaledQuantity");
  const quantityMilli = Number(value);
  parseQuantity(formatQuantity(quantityMilli), unit);
  return quantityMilli;
}

function knownRecipe(id: string): Recipe {
  const recipe = RECIPES.find(entry => entry.id === id);
  if (!recipe) throw appError("errors.recipeMissing");
  return recipe;
}

export function createMealPlan(servings: number): MealPlan {
  checkServings(servings);
  return { servings, recipeIds: RECIPES.slice(0, 5).map(recipe => recipe.id) };
}

export function validateMealPlan(input: unknown): MealPlan {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw appError("errors.menuInvalid");
  const value = input as Record<string, unknown>;
  checkServings(value.servings);
  if (!Array.isArray(value.recipeIds) || value.recipeIds.length !== 5 ||
      value.recipeIds.some(id => typeof id !== 'string') || new Set(value.recipeIds).size !== 5) {
    throw appError("errors.fiveRecipes");
  }
  const recipeIds = value.recipeIds as string[];
  recipeIds.forEach(knownRecipe);
  return { servings: value.servings, recipeIds: [...recipeIds] };
}

export function replaceMeal(plan: MealPlan, index: number, recipeId: string): MealPlan {
  const validated = validateMealPlan(plan);
  if (!Number.isInteger(index) || index < 0 || index >= validated.recipeIds.length) throw appError("errors.dinnerInvalid");
  knownRecipe(recipeId);
  const recipeIds = validated.recipeIds.map((id, position) => position === index ? recipeId : id);
  return validateMealPlan({ servings: validated.servings, recipeIds });
}

/** Scale with integer arithmetic; purchased whole units round up explicitly. */
export function scaleRecipe(recipe: Recipe, servings: number): ScaledIngredient[] {
  checkServings(servings);
  if (!recipe || typeof recipe !== 'object') throw appError("errors.recipeInvalid");
  checkServings(recipe.baseServings);
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0 || recipe.ingredients.length > MAX_INGREDIENTS) {
    throw appError("errors.recipeIngredients");
  }
  return recipe.ingredients.map(ingredient => {
    checkIngredient(ingredient);
    const numerator = BigInt(ingredient.quantityMilli) * BigInt(servings);
    const denominator = BigInt(recipe.baseServings);
    const quantum = ingredient.unit === 'ud' ? 1000n : 1n;
    const divisor = denominator * quantum;
    const quotient = ingredient.unit === 'ud' ? (numerator + divisor - 1n) / divisor : (numerator + divisor / 2n) / divisor;
    // Tiny positive ingredients still require a visible minimum quantity.
    const scaled = (quotient === 0n ? 1n : quotient) * quantum;
    return {
      name: ingredient.name.trim(), unit: ingredient.unit, category: ingredient.category, note: ingredient.note?.trim(),
      quantityMilli: checkedQuantity(scaled, ingredient.unit), rounded: scaled * denominator !== numerator,
    };
  });
}

export function planIngredients(plan: MealPlan): ScaledIngredient[] {
  const validated = validateMealPlan(plan);
  return validated.recipeIds.flatMap(id => scaleRecipe(knownRecipe(id), validated.servings));
}

/** Deliberately small alias table; it does not guess food equivalence or strip all plurals. */
export function normalizeIngredientName(input: string): string {
  if (typeof input !== 'string' || !input.trim() || input.trim().length > 120) throw appError("errors.ingredientNameInvalid");
  const normalized = input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
  return INGREDIENT_ALIASES.get(normalized) ?? normalized;
}

/** Canonical quantities are thousandths of grams, millilitres or whole items. */
export function canonicalMeasure(quantityMilli: number, unit: Unit): CanonicalMeasure {
  if (!(UNITS as readonly unknown[]).includes(unit)) throw appError("errors.unitInvalid");
  parseQuantity(formatQuantity(quantityMilli), unit);
  if (unit === 'ud') return { dimension: 'count', quantityMilli, unit: 'ud' };
  const factor = unit === 'kg' || unit === 'L' ? 1000n : 1n;
  const canonical = BigInt(quantityMilli) * factor;
  if (canonical > BigInt(Number.MAX_SAFE_INTEGER)) throw appError("errors.convertedQuantity");
  return { dimension: unit === 'g' || unit === 'kg' ? 'mass' : 'volume', quantityMilli: Number(canonical), unit: unit === 'g' || unit === 'kg' ? 'g' : 'ml' };
}

/** Combines suggestions only; it never writes or silently merges the user's shopping list. */
export function combineIngredients(ingredients: readonly ScaledIngredient[]): ScaledIngredient[] {
  if (!Array.isArray(ingredients) || ingredients.length > MAX_INGREDIENTS) throw appError("errors.proposalTooMany");
  const grouped = new Map<string, { first: ScaledIngredient; total: bigint; notes: Set<string>; rounded: boolean; baseUnit: CanonicalMeasure['unit'] }>();
  for (const ingredient of ingredients) {
    checkIngredient(ingredient);
    if (typeof ingredient.rounded !== 'boolean') throw appError("errors.roundingInvalid");
    const canonical = canonicalMeasure(ingredient.quantityMilli, ingredient.unit);
    const key = `${normalizeIngredientName(ingredient.name)}\u0000${canonical.dimension}`;
    const previous = grouped.get(key);
    if (previous) {
      previous.total += BigInt(canonical.quantityMilli);
      previous.rounded ||= ingredient.rounded;
      if (ingredient.note?.trim()) previous.notes.add(ingredient.note.trim());
    } else grouped.set(key, {
      first: ingredient, total: BigInt(canonical.quantityMilli),
      notes: new Set(ingredient.note?.trim() ? [ingredient.note.trim()] : []),
      rounded: ingredient.rounded, baseUnit: canonical.unit,
    });
  }
  return [...grouped.values()].map(group => {
    const firstFactor = group.first.unit === 'kg' || group.first.unit === 'L' ? 1000n : 1n;
    // A tiny g/ml addition may not fit the first kg/L unit's precision. Keep it exact in the base unit.
    const preserveFirst = group.total % firstFactor === 0n;
    const unit = preserveFirst ? group.first.unit : group.baseUnit;
    const quantityMilli = checkedQuantity(preserveFirst ? group.total / firstFactor : group.total, unit);
    const note = [...group.notes].join(' · ');
    if (note.length > 500) throw appError("errors.combinedNotesLength");
    return { name: group.first.name.trim(), category: group.first.category, quantityMilli, unit, note: note || undefined, rounded: group.rounded };
  });
}
