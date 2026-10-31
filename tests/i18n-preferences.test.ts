import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const unusedStorage = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn() }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: unusedStorage }));
import { createPreferencesStore, emptyPreferences, parsePreferences, PreferenceError, PREFERENCES_STORAGE_KEY,
  type LanguagePreferences, type PreferenceLock } from '../src/i18n/preferences';
import { storageSignature } from '../src/storage/writeCoordinator';
import { createWriteFence, hashWriteSignature, type WriteFenceBackend } from '../src/storage/writeFence';

const noBrowserLock: PreferenceLock = operation => operation();
const envelope = (language: unknown = null, welcomeCompleted: unknown = false, version: unknown = 1) =>
  JSON.stringify({ version, language, welcomeCompleted });

function memory(initial: string | null = null) {
  let saved = initial;
  const storage = {
    getItem: vi.fn(async (_key: string) => saved),
    setItem: vi.fn(async (_key: string, value: string) => { saved = value; }),
  };
  return { storage, read: () => saved, store: createPreferencesStore(storage, noBrowserLock) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('window', undefined);
});
afterEach(() => vi.unstubAllGlobals());

describe('validated, independent language preferences', () => {
  it('starts from the device policy without writing to any storage', async () => {
    const { store, storage } = memory();
    await expect(store.load()).resolves.toEqual(emptyPreferences());
    expect(storage.getItem).toHaveBeenCalledExactlyOnceWith(PREFERENCES_STORAGE_KEY);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each(['es', 'en', 'de', 'fr'] as const)('saves and reloads a manual %s preference', async language => {
    const { store, read } = memory();
    await expect(store.setLanguage(language)).resolves.toEqual({ version: 1, language, welcomeCompleted: false });
    expect(read()).toBe(envelope(language));
    await expect(store.load()).resolves.toEqual({ version: 1, language, welcomeCompleted: false });
    await store.completeWelcome();
    await expect(store.load()).resolves.toEqual({ version: 1, language, welcomeCompleted: true });
  });

  it('returns to device policy without erasing the completed welcome', async () => {
    const { store, read } = memory(envelope('de', true));
    await store.setLanguage(null);
    expect(read()).toBe(envelope(null, true));
  });

  it('reads current preferences inside serialised writes from separate instances', async () => {
    const { store, storage, read } = memory();
    const other = createPreferencesStore(storage, noBrowserLock);
    await Promise.all([store.completeWelcome(), other.setLanguage('fr')]);
    expect(read()).toBe(envelope('fr', true));
    await Promise.all([other.setLanguage('en'), store.completeWelcome()]);
    expect(read()).toBe(envelope('en', true));
  });

  it('takes an exclusive lock for every preference mutation', async () => {
    const { storage } = memory();
    const lockCalls = vi.fn();
    const lock: PreferenceLock = operation => { lockCalls(); return operation(); };
    const store = createPreferencesStore(storage, lock);
    await store.setLanguage('en');
    await store.completeWelcome();
    expect(lockCalls).toHaveBeenCalledTimes(2);
  });

  it('touches only its own key and serialises only the declared preference fields', async () => {
    const { store, storage } = memory(JSON.stringify({ version: 1, language: 'es', welcomeCompleted: false, unrelatedText: 'Do not save' }));
    await store.setLanguage('de');
    expect(storage.getItem.mock.calls.every(([key]) => key === PREFERENCES_STORAGE_KEY)).toBe(true);
    expect(storage.setItem.mock.calls.every(([key]) => key === PREFERENCES_STORAGE_KEY)).toBe(true);
    expect(JSON.parse(storage.setItem.mock.calls[0][1])).toEqual({ version: 1, language: 'de', welcomeCompleted: false });
  });

  it('does not accept an arbitrary language as a storage or locale selector', async () => {
    const { store, storage } = memory();
    await expect(store.setLanguage('__proto__' as never)).rejects.toThrow('common.preferencesInvalidLanguage');
    expect(storage.getItem).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});

describe('failed and incompatible preference storage', () => {
  it.each([
    '{bad', 'null', '[]', '{}', envelope('it'), envelope('__proto__'), envelope(null, 'true'),
    envelope(null, false, '1'), '{"version":1,"language":"es"}', 'x'.repeat(2049),
  ])('preserves invalid data %s without overwriting it', async serialized => {
    const { store, storage, read } = memory(serialized);
    await expect(store.load()).rejects.toBeInstanceOf(PreferenceError);
    await expect(store.setLanguage('fr')).rejects.toBeInstanceOf(PreferenceError);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(read()).toBe(serialized);
  });

  it.each([0, 2, 999])('does not migrate version %s implicitly', async version => {
    const serialized = envelope('es', true, version);
    const { store, storage } = memory(serialized);
    await expect(store.load()).rejects.toThrow('common.preferencesVersion');
    await expect(store.completeWelcome()).rejects.toThrow('common.preferencesVersion');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('preserves the previous choice when reading or writing fails', async () => {
    const previous = envelope('fr', true);
    const { store, storage, read } = memory(previous);
    storage.getItem.mockRejectedValueOnce(new Error('Storage unavailable'));
    await expect(store.load()).rejects.toThrow('common.preferencesLoadError');
    storage.setItem.mockRejectedValueOnce(new Error('Quota exceeded'));
    await expect(store.setLanguage('en')).rejects.toThrow('common.preferencesWriteError');
    expect(read()).toBe(previous);
    await expect(store.load()).resolves.toEqual({ version: 1, language: 'fr', welcomeCompleted: true });
    await store.setLanguage('de');
    expect(read()).toBe(envelope('de', true));
  });

  it('parses calendar-independent settings without storing runtime user objects', () => {
    const malicious: LanguagePreferences & { token?: string } = { version: 1, language: 'es', welcomeCompleted: true, token: 'not retained' };
    expect(parsePreferences(JSON.stringify(malicious))).toEqual({ version: 1, language: 'es', welcomeCompleted: true });
  });
});

function browserPreferences(initial: string | null = null) {
  vi.stubGlobal('window', { document: {} });
  const { storage, read } = memory(initial);
  const records = new Map<string, unknown>();
  let failRecord: 'pending' | 'committed' | null = null;
  const backend: WriteFenceBackend = {
    async transact(key, update) {
      const next = update(records.get(key));
      if (Object.prototype.hasOwnProperty.call(next, 'record')) {
        const record = next.record as { status: string };
        if (record.status === failRecord) {
          failRecord = null;
          throw new Error('Injected fence transaction failure before commit');
        }
        records.set(key, JSON.parse(JSON.stringify(next.record)) as unknown);
      }
      return next.result;
    },
  };
  const newStore = () => createPreferencesStore(storage, noBrowserLock, { fence: createWriteFence(backend) });
  return {
    storage, read, records, backend, newStore, store: newStore(),
    failNextRecord: (status: 'pending' | 'committed') => { failRecord = status; },
  };
}

const preferencesHash = (serialized: string | null) => hashWriteSignature(storageSignature(parsePreferences(serialized)));

describe('browser preference fences and ambiguous writes', () => {
  it('reserves hash-only metadata before writing and commits the canonical saved preferences', async () => {
    const initial = envelope('es', false);
    const fixture = browserPreferences(initial);
    const originalWrite = fixture.storage.setItem.getMockImplementation()!;
    fixture.storage.setItem.mockImplementation(async (key, value) => {
      expect(fixture.records.get(key)).toEqual({
        version: 1, status: 'pending', claim: expect.stringMatching(/^[a-f0-9]{32}$/),
        previous: await preferencesHash(initial), proposed: await preferencesHash(value),
      });
      await originalWrite(key, value);
    });

    await expect(fixture.store.setLanguage('en')).resolves.toEqual(parsePreferences(envelope('en')));
    expect(fixture.records.get(PREFERENCES_STORAGE_KEY)).toEqual({
      version: 1, status: 'committed', signature: await preferencesHash(envelope('en')),
    });
    expect([...fixture.records.keys()]).toEqual([PREFERENCES_STORAGE_KEY]);
    expect(fixture.storage.setItem).toHaveBeenCalledExactlyOnceWith(PREFERENCES_STORAGE_KEY, envelope('en'));
  });

  it('rejects a stale welcome=false cache and preserves completed welcome on an explicit retry', async () => {
    const initial = envelope('es', false);
    const fixture = browserPreferences(initial);
    const other = fixture.newStore();
    await expect(fixture.store.completeWelcome()).resolves.toEqual(parsePreferences(envelope('es', true)));
    fixture.storage.getItem.mockResolvedValueOnce(initial);

    await expect(other.setLanguage('fr')).rejects.toMatchObject({ key: 'common.preferencesConflict' });
    expect(fixture.read()).toBe(envelope('es', true));
    expect(fixture.storage.setItem).toHaveBeenCalledTimes(1);
    await expect(other.setLanguage('fr')).resolves.toEqual(parsePreferences(envelope('fr', true)));
    expect(fixture.read()).toBe(envelope('fr', true));
  });

  it('rolls back only an unchanged failed write and permits retry without erasing welcome', async () => {
    const initial = envelope('fr', true);
    const fixture = browserPreferences(initial);
    fixture.storage.setItem.mockRejectedValueOnce(new Error('Quota exceeded'));

    await expect(fixture.store.setLanguage('en')).rejects.toMatchObject({ key: 'common.preferencesWriteError' });
    expect(fixture.read()).toBe(initial);
    expect(fixture.records.get(PREFERENCES_STORAGE_KEY)).toEqual({
      version: 1, status: 'committed', signature: await preferencesHash(initial),
    });
    await expect(fixture.store.setLanguage('en')).resolves.toEqual(parsePreferences(envelope('en', true)));
    expect(fixture.read()).toBe(envelope('en', true));
  });

  it('blocks a pending claim before reading business storage, including in a new store', async () => {
    const initial = envelope('es', true);
    const fixture = browserPreferences(initial);
    await createWriteFence(fixture.backend).claim(PREFERENCES_STORAGE_KEY,
      await preferencesHash(initial), await preferencesHash(envelope('en', true)));
    const pending = structuredClone(fixture.records.get(PREFERENCES_STORAGE_KEY));

    await expect(fixture.store.setLanguage('en')).rejects.toMatchObject({ key: 'common.preferencesUncertain' });
    await expect(fixture.newStore().completeWelcome()).rejects.toMatchObject({ key: 'common.preferencesUncertain' });
    expect(fixture.storage.getItem).not.toHaveBeenCalled();
    expect(fixture.storage.setItem).not.toHaveBeenCalled();
    expect(fixture.records.get(PREFERENCES_STORAGE_KEY)).toEqual(pending);
    expect(fixture.read()).toBe(initial);
  });

  it.each(['readback', 'commit'] as const)('keeps a saved change uncertain when its %s fails', async failure => {
    const initial = envelope('es', true);
    const fixture = browserPreferences(initial);
    if (failure === 'readback') {
      fixture.storage.getItem.mockResolvedValueOnce(initial).mockRejectedValueOnce(new Error('Readback failed'));
    } else fixture.failNextRecord('committed');

    await expect(fixture.store.setLanguage('en')).rejects.toMatchObject({ key: 'common.preferencesUncertain' });
    expect(fixture.read()).toBe(envelope('en', true));
    expect(fixture.records.get(PREFERENCES_STORAGE_KEY)).toMatchObject({
      status: 'pending', previous: await preferencesHash(initial), proposed: await preferencesHash(envelope('en', true)),
    });
    const other = fixture.newStore();
    await expect(other.load()).resolves.toEqual(parsePreferences(envelope('en', true)));
    await expect(other.setLanguage('fr')).rejects.toMatchObject({ key: 'common.preferencesUncertain' });
    expect(fixture.storage.setItem).toHaveBeenCalledTimes(1);
  });

  it('keeps the claim pending when storage mutates and then rejects instead of promising the old choice', async () => {
    const initial = envelope('es', true);
    const fixture = browserPreferences(initial);
    const originalWrite = fixture.storage.setItem.getMockImplementation()!;
    fixture.storage.setItem.mockImplementationOnce(async (key, value) => {
      await originalWrite(key, value);
      throw new Error('Failure after storage mutation');
    });

    await expect(fixture.store.setLanguage('en')).rejects.toMatchObject({ key: 'common.preferencesUncertain' });
    expect(fixture.read()).toBe(envelope('en', true));
    expect(fixture.records.get(PREFERENCES_STORAGE_KEY)).toMatchObject({ status: 'pending' });
    await expect(fixture.newStore().setLanguage('fr')).rejects.toMatchObject({ key: 'common.preferencesUncertain' });
    expect(fixture.storage.setItem).toHaveBeenCalledTimes(1);
  });

  it('does not call storage.setItem when the durable reservation cannot commit', async () => {
    const initial = envelope('de', true);
    const fixture = browserPreferences(initial);
    fixture.failNextRecord('pending');

    await expect(fixture.store.setLanguage('fr')).rejects.toMatchObject({ key: 'common.preferencesCoordinationUnavailable' });
    expect(fixture.storage.setItem).not.toHaveBeenCalled();
    expect(fixture.read()).toBe(initial);
    expect(fixture.records.size).toBe(0);
  });

  it('returns the validated readback and fences that canonical state', async () => {
    const initial = envelope('es', false);
    const fixture = browserPreferences(initial);
    const originalWrite = fixture.storage.setItem.getMockImplementation()!;
    fixture.storage.setItem.mockImplementationOnce(async (key, value) => {
      const next = parsePreferences(value);
      await originalWrite(key, envelope(next.language, true));
    });

    await expect(fixture.store.setLanguage('en')).resolves.toEqual(parsePreferences(envelope('en', true)));
    expect(fixture.records.get(PREFERENCES_STORAGE_KEY)).toEqual({
      version: 1, status: 'committed', signature: await preferencesHash(envelope('en', true)),
    });
  });
});
