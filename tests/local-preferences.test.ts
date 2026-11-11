import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => ({ documents: new Map<string, string>(), getItem: vi.fn(), setItem: vi.fn() }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }));

import {
  deriveLocalNotices, emptyLocalPreferences, STORE_IDS, validateLocalPreferences, type LocalPreferences,
} from '../src/domain/localPreferences';
import type { ShoppingList } from '../src/domain/shopping';
import { loadLocalPreferences, saveLocalPreferences, STORAGE_KEY } from '../src/storage/localPreferences';
import { createWriteCoordinator } from '../src/storage/writeCoordinator';
import { localSettingsMessages } from '../src/i18n/catalogs/localSettings';
import { PILOT_STORE_IDS, selectAllPilotStores } from '../src/domain/stores';

beforeEach(() => {
  storage.documents.clear();
  vi.resetAllMocks();
  storage.getItem.mockImplementation(async (key: string) => storage.documents.get(key) ?? null);
  storage.setItem.mockImplementation(async (key: string, value: string) => { storage.documents.set(key, value); });
});

describe('local preference validation', () => {
  it('accepts the expanded stores and returns a detached allowlisted value', () => {
    const input = { favoriteStores: [...STORE_IDS], inAppReminders: true, password: 'never persist this' };
    const validated = validateLocalPreferences(input);
    expect(validated).toEqual({ favoriteStores: [...STORE_IDS], inAppReminders: true });
    input.favoriteStores.pop();
    expect(validated.favoriteStores).toHaveLength(STORE_IDS.length);
    expect(validated).not.toHaveProperty('password');
  });

  it.each([
    null, [], {}, { favoriteStores: [] }, { inAppReminders: false },
    { favoriteStores: 'hiperdino', inAppReminders: false },
    { favoriteStores: ['HiperDino'], inAppReminders: false },
    { favoriteStores: ['__proto__'], inAppReminders: false },
    { favoriteStores: new Array(1), inAppReminders: false },
    { favoriteStores: ['mercadona', 'mercadona'], inAppReminders: false },
    { favoriteStores: [...STORE_IDS, 'other'], inAppReminders: false },
    { favoriteStores: [], inAppReminders: 'false' },
    Object.create({ favoriteStores: [], inAppReminders: true }) as unknown,
  ])('rejects malformed preferences without coercing them (%j)', value => {
    expect(() => validateLocalPreferences(value)).toThrow('localSettings.error.invalid');
  });

  it('returns independent defaults with reminders disabled', () => {
    const first = emptyLocalPreferences();
    first.favoriteStores.push('other');
    expect(emptyLocalPreferences()).toEqual({ favoriteStores: [], inAppReminders: false });
  });
});

describe('independent local preference storage', () => {
  it('upgrades the original four-store selection without losing favourites or reminders', async () => {
    storage.documents.set(STORAGE_KEY, JSON.stringify({ version: 1, preferences: {
      favoriteStores: ['hiperdino', 'carrefour', 'mercadona', 'other'], inAppReminders: true,
    } }));
    const previous = await loadLocalPreferences();
    await saveLocalPreferences({ ...previous, favoriteStores: selectAllPilotStores(previous.favoriteStores) });
    const saved = await loadLocalPreferences();
    expect(saved.inAppReminders).toBe(true);
    expect(saved.favoriteStores).toEqual(expect.arrayContaining([...PILOT_STORE_IDS, 'carrefour', 'other']));
    expect(new Set(saved.favoriteStores).size).toBe(8);
  });

  it('loads missing preferences without writing defaults or touching another key', async () => {
    await expect(loadLocalPreferences()).resolves.toEqual(emptyLocalPreferences());
    expect(storage.getItem).toHaveBeenCalledExactlyOnceWith('jjcompraintelwgiemt.local-settings.v1');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('round-trips favourites and reminders without persisting extra fields', async () => {
    const existingList = '{"version":1,"lists":["private"]}';
    storage.documents.set('jjcompraintelwgiemt.shopping.v1', existingList);
    const input = { favoriteStores: ['hiperdino'], inAppReminders: true, secret: 'ignored' };
    await saveLocalPreferences(input as LocalPreferences);
    input.favoriteStores.push('other');
    await expect(loadLocalPreferences()).resolves.toEqual({ favoriteStores: ['hiperdino'], inAppReminders: true });
    expect(JSON.parse(storage.documents.get(STORAGE_KEY)!)).toEqual({
      version: 1, preferences: { favoriteStores: ['hiperdino'], inAppReminders: true },
    });
    expect(storage.documents.get('jjcompraintelwgiemt.shopping.v1')).toBe(existingList);
    expect(storage.setItem.mock.calls.every(([key]) => key === STORAGE_KEY)).toBe(true);
  });

  it.each([
    ['{invalid JSON', 'localSettings.error.unreadable'],
    ['null', 'localSettings.error.unreadable'],
    ['[]', 'localSettings.error.unreadable'],
    ['{"version":"1","preferences":{"favoriteStores":[],"inAppReminders":false}}', 'localSettings.error.unreadable'],
    ['{"version":1,"preferences":{"favoriteStores":["unknown"],"inAppReminders":true}}', 'localSettings.error.unreadable'],
    ['{"version":1,"preferences":{"favoriteStores":["other","other"],"inAppReminders":false}}', 'localSettings.error.unreadable'],
    ['{"version":2,"preferences":{"favoriteStores":[],"inAppReminders":true}}', 'localSettings.error.version'],
    ['{"version":0,"preferences":{"favoriteStores":[],"inAppReminders":false}}', 'localSettings.error.version'],
    [' '.repeat(4097), 'localSettings.error.unreadable'],
  ])('preserves an unreadable or unsupported stored document', async (raw, errorKey) => {
    storage.documents.set(STORAGE_KEY, raw);
    await expect(loadLocalPreferences()).rejects.toThrow(errorKey);
    expect(storage.documents.get(STORAGE_KEY)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('fails closed when reading storage fails rather than returning overwritable defaults', async () => {
    storage.getItem.mockRejectedValueOnce(new Error('device read failed'));
    await expect(loadLocalPreferences()).rejects.toThrow('localSettings.error.load');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('validates before writing and preserves an existing document after a write failure', async () => {
    await expect(saveLocalPreferences({ favoriteStores: ['bad'], inAppReminders: true } as unknown as LocalPreferences))
      .rejects.toThrow('localSettings.error.invalid');
    expect(storage.setItem).not.toHaveBeenCalled();
    const raw = JSON.stringify({ version: 1, preferences: emptyLocalPreferences() });
    storage.documents.set(STORAGE_KEY, raw);
    storage.setItem.mockRejectedValueOnce(new Error('device full'));
    await expect(saveLocalPreferences({ favoriteStores: ['carrefour'], inAppReminders: true }))
      .rejects.toThrow('localSettings.error.save');
    expect(storage.documents.get(STORAGE_KEY)).toBe(raw);
  });

  it('refuses a stale preference change instead of losing another saved favourite', async () => {
    const write = createWriteCoordinator();
    const expected = await loadLocalPreferences();
    await saveLocalPreferences({ favoriteStores: ['mercadona'], inAppReminders: false });
    storage.setItem.mockClear();
    await expect(write({ key: STORAGE_KEY, expected, next: { favoriteStores: [], inAppReminders: true },
      read: loadLocalPreferences, write: saveLocalPreferences })).rejects.toThrow();
    expect(storage.setItem).not.toHaveBeenCalled();
    await expect(loadLocalPreferences()).resolves.toEqual({ favoriteStores: ['mercadona'], inAppReminders: false });
  });

  it('does not overwrite a document that became unreadable since the UI loaded it', async () => {
    const write = createWriteCoordinator();
    const expected = await loadLocalPreferences();
    storage.documents.set(STORAGE_KEY, 'preserve damaged original');
    await expect(write({ key: STORAGE_KEY, expected, next: { favoriteStores: ['other'], inAppReminders: false },
      read: loadLocalPreferences, write: saveLocalPreferences })).rejects.toThrow('localSettings.error.unreadable');
    expect(storage.documents.get(STORAGE_KEY)).toBe('preserve damaged original');
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});

describe('honest in-app notices', () => {
  const lists = [
    { id: 'a', name: 'My actual list', items: [{ checked: false }, { checked: true }, { checked: false }] },
    { id: 'b', name: 'Completed', items: [{ checked: true }] },
    { id: 'c', name: 'Empty', items: [] },
  ] as ShoppingList[];
  const plan = { recipeIds: ['one', 'two', 'three', 'four', 'five'], servings: 2 };

  it('shows no notices before optional activation, even if there is real saved data', () => {
    expect(deriveLocalNotices(emptyLocalPreferences(), lists, plan)).toEqual([]);
  });

  it('shows only saved lists with pending items and the actual saved plan', () => {
    expect(deriveLocalNotices({ favoriteStores: [], inAppReminders: true }, lists, plan)).toEqual([
      { kind: 'list', id: 'a', listName: 'My actual list', pendingCount: 2 },
      { kind: 'recipes', id: 'meal-plan', recipeCount: 5, servings: 2 },
    ]);
  });

  it('has an authentic empty state without lists or a saved plan', () => {
    expect(deriveLocalNotices({ favoriteStores: ['other'], inAppReminders: true }, [], null)).toEqual([]);
    expect(deriveLocalNotices({ favoriteStores: [], inAppReminders: true }, lists).map(notice => notice.kind)).toEqual(['list']);
  });
});

describe('four-language local settings catalog', () => {
  it('contains the same keys and substitutions in every language', () => {
    const reference = localSettingsMessages.es;
    for (const catalog of Object.values(localSettingsMessages)) {
      expect(Object.keys(catalog).sort()).toEqual(Object.keys(reference).sort());
      for (const [key, value] of Object.entries(catalog)) {
        expect(value.trim()).not.toBe('');
        expect([...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()).toEqual(
          [...reference[key as keyof typeof reference].matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort());
      }
    }
  });
});
