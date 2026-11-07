import type { MealPlan } from './menus';
import type { ShoppingList } from './shopping';

export const STORE_IDS = ['hiperdino', 'carrefour', 'mercadona', 'other'] as const;
export type StoreId = typeof STORE_IDS[number];

export interface LocalPreferences {
  favoriteStores: StoreId[];
  /** Enables derived notices inside JJ only, never device push notifications. */
  inAppReminders: boolean;
}

export type LocalPreferencesErrorKey = 'localSettings.error.invalid' | 'localSettings.error.load'
  | 'localSettings.error.unreadable' | 'localSettings.error.version' | 'localSettings.error.save';

export class LocalPreferencesError extends Error {
  constructor(readonly code: LocalPreferencesErrorKey) {
    super(code);
    this.name = 'LocalPreferencesError';
  }
}

export function emptyLocalPreferences(): LocalPreferences {
  return { favoriteStores: [], inAppReminders: false };
}

export function isStoreId(value: unknown): value is StoreId {
  return typeof value === 'string' && (STORE_IDS as readonly string[]).includes(value);
}

/** Return a fresh, bounded allowlisted record rather than retaining caller input. */
export function validateLocalPreferences(input: unknown): LocalPreferences {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new LocalPreferencesError('localSettings.error.invalid');
  }
  const value = input as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(value, 'favoriteStores') ||
      !Object.prototype.hasOwnProperty.call(value, 'inAppReminders') ||
      !Array.isArray(value.favoriteStores) || value.favoriteStores.length > STORE_IDS.length ||
      Array.from(value.favoriteStores).some(id => !isStoreId(id)) ||
      new Set(value.favoriteStores).size !== value.favoriteStores.length ||
      typeof value.inAppReminders !== 'boolean') {
    throw new LocalPreferencesError('localSettings.error.invalid');
  }
  return { favoriteStores: [...value.favoriteStores] as StoreId[], inAppReminders: value.inAppReminders };
}

export type LocalNotice =
  | { kind: 'list'; id: string; listName: string; pendingCount: number }
  | { kind: 'recipes'; id: 'meal-plan'; recipeCount: number; servings: number };

/** Computed from saved app data on render: no delivery, scheduler or commercial source. */
export function deriveLocalNotices(
  preferences: LocalPreferences, lists: readonly ShoppingList[], mealPlan?: MealPlan | null,
): LocalNotice[] {
  if (!preferences.inAppReminders) return [];
  const notices: LocalNotice[] = [];
  for (const list of lists) {
    const pendingCount = list.items.filter(item => !item.checked).length;
    if (pendingCount > 0) notices.push({ kind: 'list', id: list.id, listName: list.name, pendingCount });
  }
  if (mealPlan && mealPlan.recipeIds.length > 0) {
    notices.push({ kind: 'recipes', id: 'meal-plan', recipeCount: mealPlan.recipeIds.length, servings: mealPlan.servings });
  }
  return notices;
}
