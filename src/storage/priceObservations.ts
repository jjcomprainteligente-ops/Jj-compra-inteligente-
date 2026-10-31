import { appError } from '../i18n/errors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validatePriceObservation, type PriceObservation } from '../domain/priceObservations';

export const STORAGE_KEY = 'jjcompraintelwgiemt.price-observations.v1';

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Returns a clean snapshot, without retaining aliases to a caller's objects. */
export function validateObservations(value: unknown): PriceObservation[] {
  if (!Array.isArray(value) || value.length > 2000) {
    throw appError("errors.observationLimit");
  }
  const ids = new Set<string>();
  const observations: PriceObservation[] = [];
  for (const entry of value) {
    if (!record(entry) || typeof entry.id !== 'string' || !entry.id || entry.id.length > 128 ||
        entry.id.trim() !== entry.id || ids.has(entry.id)) {
      throw appError("errors.observationIds");
    }
    const validated = validatePriceObservation(entry);
    ids.add(validated.id);
    observations.push(validated);
  }
  return observations;
}

export async function loadPriceObservations(): Promise<PriceObservation[]> {
  let serialized: string | null;
  try { serialized = await AsyncStorage.getItem(STORAGE_KEY); }
  catch {
    throw appError("errors.observationsLoadFull");
  }
  if (serialized === null) return [];
  let parsed: unknown;
  try { parsed = JSON.parse(serialized); }
  catch { throw appError("errors.observationsUnreadable"); }
  if (record(parsed) && typeof parsed.version === 'number' && parsed.version !== 1) {
    throw appError("errors.observationsVersion");
  }
  try {
    if (!record(parsed) || parsed.version !== 1) throw new Error();
    return validateObservations(parsed.observations);
  } catch {
    throw appError("errors.observationsUnreadable");
  }
}

export async function savePriceObservations(value: PriceObservation[]): Promise<void> {
  const observations = validateObservations(value);
  try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, observations })); }
  catch {
    throw appError("errors.observationsSaveFull");
  }
}
