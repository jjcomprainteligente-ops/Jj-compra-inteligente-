import { appError } from '../i18n/errors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateMealPlan, type MealPlan } from '../domain/menus';

export const STORAGE_KEY = 'jjcompraintelwgiemt.menus.v1';

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Only the chosen recipes and number of people are stored; pasted text is not retained. */
export async function loadMealPlan(): Promise<MealPlan | null> {
  let serialized: string | null;
  try { serialized = await AsyncStorage.getItem(STORAGE_KEY); }
  catch { throw appError("errors.menuLoadFull"); }
  if (serialized === null) return null;

  let parsed: unknown;
  try { parsed = JSON.parse(serialized); }
  catch { throw appError("errors.menuUnreadable"); }
  if (record(parsed) && typeof parsed.version === 'number' && parsed.version !== 1) {
    throw appError("errors.menuVersion");
  }
  try {
    if (!record(parsed) || parsed.version !== 1) throw new Error();
    return parsed.plan === null ? null : validateMealPlan(parsed.plan);
  } catch {
    throw appError("errors.menuUnreadable");
  }
}

export async function saveMealPlan(plan: MealPlan | null): Promise<void> {
  const validated = plan === null ? null : validateMealPlan(plan);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, plan: validated }));
  } catch {
    throw appError("errors.menuSaveFull");
  }
}
