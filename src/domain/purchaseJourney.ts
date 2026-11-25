import { validateBudget } from './shopping';
import { PILOT_STORE_IDS, type StoreId } from './stores';
import { MAX_SAVED_MEALS, MIN_SAVED_MEALS } from './mealPlanLimits';

/** A planning limit, never an expense, a quotation or a verified meal cost. */
export interface PlanningRequest {
  budgetCents: number;
  meals: number;
  servings: number;
}

/** Session context only; this module neither reads nor writes saved documents. */
export interface PlanningContext {
  mode: 'recipes' | 'budget';
  budgetCents: number | null;
  meals: number;
  servings: number;
  stores: StoreId[];
}

export type PurchaseJourneyErrorKey = 'mealJourney.invalidBudget' | 'mealJourney.invalidMeals'
  | 'mealJourney.invalidPeople' | 'mealJourney.invalidStores';

export class PurchaseJourneyError extends Error {
  constructor(readonly key: PurchaseJourneyErrorKey) {
    super(key);
    this.name = 'PurchaseJourneyError';
  }
}

const MAX_FIELD_LENGTH = 32;
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const boundedText = (value: unknown): value is string => typeof value === 'string' && value.length <= MAX_FIELD_LENGTH;

/** Reuse the existing EUR parser; numeric conversion follows an explicit syntax check. */
export function validatePlanningRequest(input: { budget: string; meals: string; servings: string }): PlanningRequest {
  if (!input || typeof input !== 'object' || Array.isArray(input) || !own(input, 'budget') || !boundedText(input.budget)) {
    throw new PurchaseJourneyError('mealJourney.invalidBudget');
  }
  let budgetCents: number | null;
  try { budgetCents = validateBudget(input.budget); }
  catch { throw new PurchaseJourneyError('mealJourney.invalidBudget'); }
  if (budgetCents === null || !Number.isSafeInteger(budgetCents) || budgetCents <= 0) {
    throw new PurchaseJourneyError('mealJourney.invalidBudget');
  }
  if (!own(input, 'meals') || !boundedText(input.meals) || !/^[0-9]{1,2}$/.test(input.meals.trim())
    || Number(input.meals.trim()) < MIN_SAVED_MEALS || Number(input.meals.trim()) > MAX_SAVED_MEALS) {
    throw new PurchaseJourneyError('mealJourney.invalidMeals');
  }
  if (!own(input, 'servings') || !boundedText(input.servings) || !/^(?:[1-9]|1[0-2])$/.test(input.servings.trim())) {
    throw new PurchaseJourneyError('mealJourney.invalidPeople');
  }
  return { budgetCents, meals: Number(input.meals.trim()), servings: Number(input.servings.trim()) };
}

/** A journey may have no stores; selection never changes saved favourites. */
export function validateJourneyStores(input: readonly unknown[]): StoreId[] {
  if (!Array.isArray(input) || input.length > PILOT_STORE_IDS.length) {
    throw new PurchaseJourneyError('mealJourney.invalidStores');
  }
  const stores: StoreId[] = [];
  const seen = new Set<StoreId>();
  for (const id of input) {
    if (typeof id !== 'string' || !(PILOT_STORE_IDS as readonly string[]).includes(id) || seen.has(id as StoreId)) {
      throw new PurchaseJourneyError('mealJourney.invalidStores');
    }
    seen.add(id as StoreId);
    stores.push(id as StoreId);
  }
  return stores;
}
