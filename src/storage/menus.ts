import { appError } from '../i18n/errors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateMealPlan } from '../domain/menus';
import { validateSavedMealPlan, type SavedMealPlan } from '../domain/savedMealPlan';

export const STORAGE_KEY = 'jjcompraintelwgiemt.menus.v1';

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Only the chosen recipes and number of people are stored; pasted text is not retained. */
export async function loadMealPlan(): Promise<SavedMealPlan | null> {
  let serialized: string | null;
  try { serialized = await AsyncStorage.getItem(STORAGE_KEY); }
  catch { throw appError("errors.menuLoadFull"); }
  if (serialized === null) return null;

  let parsed: unknown;
  try { parsed = JSON.parse(serialized); }
  catch { throw appError("errors.menuUnreadable"); }
  if (record(parsed) && typeof parsed.version === 'number' && parsed.version !== 1 && parsed.version !== 2) {
    throw appError("errors.menuVersion");
  }
  try {
    if (!record(parsed) || !Object.prototype.hasOwnProperty.call(parsed, 'version')
      || !Object.prototype.hasOwnProperty.call(parsed, 'plan')) throw new Error();
    if (parsed.version === 1) {
      if (record(parsed.plan) && Object.prototype.hasOwnProperty.call(parsed.plan, 'kind')) throw new Error();
      return parsed.plan === null ? null : validateMealPlan(parsed.plan);
    }
    if (parsed.version !== 2 || Object.keys(parsed).length !== 2 || !record(parsed.plan)
      || !Object.prototype.hasOwnProperty.call(parsed.plan, 'kind') || parsed.plan.kind !== 'variable') throw new Error();
    const validated = validateSavedMealPlan(parsed.plan);
    if (!('kind' in validated)) throw new Error();
    return validated;
  } catch {
    throw appError("errors.menuUnreadable");
  }
}

export async function saveMealPlan(plan: SavedMealPlan | null): Promise<void> {
  const validated = plan === null ? null : validateSavedMealPlan(plan);
  const version = validated !== null && Object.prototype.hasOwnProperty.call(validated, 'kind') ? 2 : 1;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ version, plan: validated }));
  } catch {
    throw appError("errors.menuSaveFull");
  }
}
