import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  emptyLocalPreferences, LocalPreferencesError, validateLocalPreferences, type LocalPreferences,
} from '../domain/localPreferences';

export const STORAGE_KEY = 'jjcompraintelwgiemt.local-settings.v1';
const MAX_DOCUMENT_LENGTH = 4096;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Missing settings have safe defaults. Invalid/future data is never replaced by loading. */
export async function loadLocalPreferences(): Promise<LocalPreferences> {
  let serialized: string | null;
  try { serialized = await AsyncStorage.getItem(STORAGE_KEY); }
  catch { throw new LocalPreferencesError('localSettings.error.load'); }
  if (serialized === null) return emptyLocalPreferences();
  let parsed: unknown;
  try {
    if (serialized.length > MAX_DOCUMENT_LENGTH) throw new Error();
    parsed = JSON.parse(serialized);
  } catch { throw new LocalPreferencesError('localSettings.error.unreadable'); }
  if (record(parsed) && typeof parsed.version === 'number' && parsed.version !== 1) {
    throw new LocalPreferencesError('localSettings.error.version');
  }
  try {
    if (!record(parsed) || parsed.version !== 1) throw new Error();
    return validateLocalPreferences(parsed.preferences);
  } catch { throw new LocalPreferencesError('localSettings.error.unreadable'); }
}

/** Low-level atomic write; callers use saveIfUnchanged to prevent stale overwrites. */
export async function saveLocalPreferences(preferences: LocalPreferences): Promise<void> {
  const validated = validateLocalPreferences(preferences);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, preferences: validated }));
  } catch { throw new LocalPreferencesError('localSettings.error.save'); }
}
