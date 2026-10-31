import AsyncStorage from '@react-native-async-storage/async-storage';
import { isLanguage, type Language } from './types';
import { isBrowserStorage, storageSignature, type WriteCoordinationOptions } from '../storage/writeCoordinator';
import { createBrowserWriteFence, hashWriteSignature, WriteFenceError } from '../storage/writeFence';

export const PREFERENCES_STORAGE_KEY = 'jjcompraintelwgiemt.preferences.v1';
export interface LanguagePreferences {
  version: 1;
  language: Language | null;
  welcomeCompleted: boolean;
}
export type PreferenceErrorKey = 'common.preferencesLoadError' | 'common.preferencesCorrupt' |
  'common.preferencesVersion' | 'common.preferencesWriteError' | 'common.preferencesInvalidLanguage' |
  'common.preferencesLocksUnavailable' | 'common.preferencesConflict' | 'common.preferencesUncertain' |
  'common.preferencesCoordinationUnavailable';
export class PreferenceError extends Error {
  constructor(readonly key: PreferenceErrorKey) { super(key); this.name = 'PreferenceError'; }
}
export const emptyPreferences = (): LanguagePreferences => ({ version: 1, language: null, welcomeCompleted: false });

/** Parsing never writes or removes an incompatible preference document. */
export function parsePreferences(serialized: string | null): LanguagePreferences {
  if (serialized === null) return emptyPreferences();
  if (serialized.length > 2048) throw new PreferenceError('common.preferencesCorrupt');
  let value: unknown;
  try { value = JSON.parse(serialized); } catch { throw new PreferenceError('common.preferencesCorrupt'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new PreferenceError('common.preferencesCorrupt');
  const record = value as Record<string, unknown>;
  if (!['version', 'language', 'welcomeCompleted'].every(key => Object.prototype.hasOwnProperty.call(record, key))) {
    throw new PreferenceError('common.preferencesCorrupt');
  }
  if (typeof record.version === 'number' && record.version !== 1) throw new PreferenceError('common.preferencesVersion');
  if (record.version !== 1 || (record.language !== null && !isLanguage(record.language)) || typeof record.welcomeCompleted !== 'boolean') {
    throw new PreferenceError('common.preferencesCorrupt');
  }
  return { version: 1, language: record.language as Language | null, welcomeCompleted: record.welcomeCompleted };
}

export interface PreferenceStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
export type PreferenceLock = <T>(operation: () => Promise<T>) => Promise<T>;

let writeQueue: Promise<unknown> = Promise.resolve();
function queued<T>(operation: () => Promise<T>): Promise<T> {
  const pending = writeQueue.then(operation, operation);
  writeQueue = pending.catch(() => undefined);
  return pending;
}

const browserLock: PreferenceLock = operation => {
  const web = typeof window !== 'undefined' && typeof window.document !== 'undefined';
  if (!web) return operation();
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (!locks || typeof locks.request !== 'function') {
    return Promise.reject(new PreferenceError('common.preferencesLocksUnavailable'));
  }
  return locks.request(PREFERENCES_STORAGE_KEY, { mode: 'exclusive' }, operation);
};

export function createPreferencesStore(storage: PreferenceStorage = AsyncStorage, lock: PreferenceLock = browserLock,
  options: WriteCoordinationOptions = {}) {
  const fence = options.fence ?? createBrowserWriteFence();
  const hash = options.hash ?? hashWriteSignature;
  async function load(): Promise<LanguagePreferences> {
    let serialized: string | null;
    try { serialized = await storage.getItem(PREFERENCES_STORAGE_KEY); }
    catch { throw new PreferenceError('common.preferencesLoadError'); }
    return parsePreferences(serialized);
  }
  async function update(change: (previous: LanguagePreferences) => LanguagePreferences): Promise<LanguagePreferences> {
    try {
      return await queued(() => lock(async () => {
        const web = isBrowserStorage();
        // A prior ambiguous write stays blocked even when a local cache can be read.
        if (web) await fence.check(PREFERENCES_STORAGE_KEY);
        const previous = await load();
        const previousSignature = storageSignature(previous);
        const next = parsePreferences(JSON.stringify(change(previous)));
        const claim = web ? await fence.claim(PREFERENCES_STORAGE_KEY, await hash(previousSignature),
          await hash(storageSignature(next))) : null;
        try { await storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(next)); }
        catch {
          if (claim) {
            let unchanged = false;
            try { unchanged = storageSignature(await load()) === previousSignature; } catch { /* Keep an ambiguous claim pending. */ }
            if (!unchanged) throw new PreferenceError('common.preferencesUncertain');
            try { await fence.rollback(claim); }
            catch { throw new PreferenceError('common.preferencesUncertain'); }
          }
          throw new PreferenceError('common.preferencesWriteError');
        }
        let saved: LanguagePreferences;
        try {
          saved = await load();
          if (claim) await fence.commit(claim, await hash(storageSignature(saved)));
        } catch {
          throw new PreferenceError(claim ? 'common.preferencesUncertain' : 'common.preferencesLoadError');
        }
        return saved;
      }));
    } catch (error) {
      if (error instanceof WriteFenceError) {
        throw new PreferenceError(error.kind === 'conflict' ? 'common.preferencesConflict' :
          error.kind === 'uncertain' ? 'common.preferencesUncertain' : 'common.preferencesCoordinationUnavailable');
      }
      throw error;
    }
  }
  return {
    load,
    setLanguage(language: Language | null): Promise<LanguagePreferences> {
      if (language !== null && !isLanguage(language)) return Promise.reject(new PreferenceError('common.preferencesInvalidLanguage'));
      return update(previous => ({ ...previous, language }));
    },
    completeWelcome(): Promise<LanguagePreferences> {
      return update(previous => ({ ...previous, welcomeCompleted: true }));
    },
  };
}
