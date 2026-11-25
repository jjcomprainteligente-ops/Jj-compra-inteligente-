import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RECIPES } from '../src/data/recipes';
import { createMealPlan } from '../src/domain/menus';
import { createMealPlanDraft } from '../src/domain/mealPlanDraft';
import { createSavedMealPlan, type SavedMealPlan, type VariableMealPlan } from '../src/domain/savedMealPlan';
import { PRIVACY_STORAGE_KEYS, privacyBackupKeys } from '../src/domain/dataPrivacy';

const storage = vi.hoisted(() => ({ documents: new Map<string, string>(), getItem: vi.fn(), setItem: vi.fn() }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }));
import { loadMealPlan, saveMealPlan, STORAGE_KEY } from '../src/storage/menus';
import { createWriteCoordinator, storageSignature } from '../src/storage/writeCoordinator';
import { deletePrepared, loadPrivacyInventory, prepareDeletion, readLocalBackup } from '../src/storage/dataPrivacy';

const ids = RECIPES.map(recipe => recipe.id);
const variable = (count: number): VariableMealPlan => ({ kind: 'variable', servings: 3, meals: ids.slice(0, count) });
const envelope = (plan: unknown, version: number) => JSON.stringify({ version, plan });
const retainedKeys = privacyBackupKeys().filter(key => key !== STORAGE_KEY);

beforeEach(() => {
  vi.resetAllMocks();
  storage.documents.clear();
  storage.getItem.mockImplementation(async (key: string) => storage.documents.get(key) ?? null);
  storage.setItem.mockImplementation(async (key: string, value: string) => { storage.documents.set(key, value); });
  vi.stubGlobal('window', undefined);
});
afterEach(() => { vi.unstubAllGlobals(); });

function retainOtherDocuments() {
  for (const key of retainedKeys) storage.documents.set(key, 'original bytes for ' + key);
  return retainedKeys.map(key => [key, storage.documents.get(key)]);
}

describe('one unchanged menu key with explicit v1/v2 representations', () => {
  it('reads old v1 bytes without rewriting or changing their durable logical signature', async () => {
    const plan = createMealPlan(3);
    const original = JSON.stringify({ version: 1, plan }, null, 2);
    storage.documents.set(STORAGE_KEY, original);
    const others = retainOtherDocuments();
    const restored = await loadMealPlan();
    expect(restored).toEqual(plan);
    expect(restored && 'kind' in restored).toBe(false);
    expect(storageSignature(restored)).toBe(storageSignature(plan));
    expect(storage.documents.get(STORAGE_KEY)).toBe(original);
    expect(retainedKeys.map(key => [key, storage.documents.get(key)])).toEqual(others);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each([1, 5, 14])('round-trips an explicit variable plan of %i meals without converting it or touching other keys', async count => {
    const plan = variable(count);
    const original = envelope(plan, 2);
    storage.documents.set(STORAGE_KEY, original);
    const others = retainOtherDocuments();
    const restored = await loadMealPlan();
    expect(restored).toEqual(plan);
    expect(storage.documents.get(STORAGE_KEY)).toBe(original);
    expect(storage.setItem).not.toHaveBeenCalled();
    await saveMealPlan(restored);
    expect(storage.setItem).toHaveBeenCalledExactlyOnceWith(STORAGE_KEY, original);
    const reopened = await loadMealPlan();
    expect(reopened).toEqual(plan);
    expect(reopened).not.toBe(restored);
    expect(retainedKeys.map(key => [key, storage.documents.get(key)])).toEqual(others);
    expect(storage.getItem.mock.calls.every(([key]) => key === STORAGE_KEY)).toBe(true);
    if (!restored || !('kind' in restored)) throw new Error('Expected v2 variable plan.');
    restored.meals.reverse();
    expect(await loadMealPlan()).toEqual(plan);
  });

  it('keeps ordinary five-meal writes and explicit clearing in v1', async () => {
    const plan = createSavedMealPlan(2, 5);
    await saveMealPlan(plan);
    expect(storage.documents.get(STORAGE_KEY)).toBe(envelope(createMealPlan(2), 1));
    await saveMealPlan(variable(14));
    expect(JSON.parse(storage.documents.get(STORAGE_KEY)!)).toEqual({ version: 2, plan: variable(14) });
    await saveMealPlan(null);
    expect(storage.documents.get(STORAGE_KEY)).toBe(envelope(null, 1));
    expect(await loadMealPlan()).toBeNull();
  });

  it('distinguishes a variable five-meal state from a legacy five-meal state for coordination', () => {
    const legacy = createMealPlan(3);
    expect(storageSignature(variable(5))).not.toBe(storageSignature(legacy));
    expect(variable(5).meals).toEqual(legacy.recipeIds);
  });

  it.each([1, 5, 14])('cannot save a raw %i-meal draft or turn its cast into v2', async count => {
    const original = envelope(createMealPlan(3), 1);
    storage.documents.set(STORAGE_KEY, original);
    const others = retainOtherDocuments();
    const draft = createMealPlanDraft(2, count);
    for (const input of [draft, { ...draft, recipeIds: ids.slice(0, 5) }, { ...draft, kind: 'variable' }]) {
      await expect(saveMealPlan(input as unknown as SavedMealPlan)).rejects.toThrow();
    }
    expect(storage.documents.get(STORAGE_KEY)).toBe(original);
    expect(retainedKeys.map(key => [key, storage.documents.get(key)])).toEqual(others);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each([
    { version: 2, plan: null },
    { version: 2, plan: createMealPlan(2) },
    { version: 2, plan: { ...variable(1), kind: 'draft' } },
    { version: 2, plan: { ...variable(1), filters: {} } },
    { version: 2, plan: variable(1), recovery: { previous: 'hidden data' } },
    { version: 2, plan: { ...variable(1), meals: [] } },
    { version: 2, plan: { ...variable(1), meals: ids.slice(0, 15) } },
    { version: 2, plan: { ...variable(1), meals: ['unknown'] } },
    { version: 2, plan: { ...variable(1), meals: [ids[0], ids[0]] } },
    { version: 2, plan: { ...variable(1), meals: [null] } },
    { version: 1, plan: variable(5) },
    { version: 1, plan: { ...createMealPlan(2), kind: 'draft' } },
    { version: 2 }, { plan: variable(1) },
  ])('retains an invalid or ambiguous envelope without fallback, conversion or writes: %j', value => {
    return (async () => {
      const raw = JSON.stringify(value);
      storage.documents.set(STORAGE_KEY, raw);
      await expect(loadMealPlan()).rejects.toMatchObject({ code: 'errors.menuUnreadable' });
      expect(storage.documents.get(STORAGE_KEY)).toBe(raw);
      expect(storage.setItem).not.toHaveBeenCalled();
    })();
  });

  it.each([0, 3, 999])('retains an unsupported version %i for explicit recovery/export', async version => {
    const raw = envelope(variable(14), version);
    storage.documents.set(STORAGE_KEY, raw);
    await expect(loadMealPlan()).rejects.toMatchObject({ code: 'errors.menuVersion' });
    expect(storage.documents.get(STORAGE_KEY)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('keeps the previous bytes and caller data when a v2 write fails', async () => {
    const raw = envelope(createMealPlan(3), 1);
    storage.documents.set(STORAGE_KEY, raw);
    const plan = variable(14), before = JSON.stringify(plan);
    storage.setItem.mockRejectedValueOnce(new Error('QA write failure'));
    await expect(saveMealPlan(plan)).rejects.toMatchObject({ code: 'errors.menuSaveFull' });
    expect(storage.documents.get(STORAGE_KEY)).toBe(raw);
    expect(JSON.stringify(plan)).toBe(before);
    expect(await loadMealPlan()).toEqual(createMealPlan(3));
  });

  it('coordinates an explicit v1-to-v2 save and refuses a stale writer after another plan change', async () => {
    storage.documents.set(STORAGE_KEY, envelope(createMealPlan(3), 1));
    const others = retainOtherDocuments();
    const writer = createWriteCoordinator();
    const expected = await loadMealPlan();
    const saved = await writer({ key: STORAGE_KEY, expected, next: variable(14), read: loadMealPlan, write: saveMealPlan });
    expect(saved).toEqual(variable(14));
    expect(JSON.parse(storage.documents.get(STORAGE_KEY)!)).toEqual({ version: 2, plan: variable(14) });
    const before = storage.documents.get(STORAGE_KEY);
    storage.setItem.mockClear();
    await expect(writer({ key: STORAGE_KEY, expected, next: variable(2), read: loadMealPlan, write: saveMealPlan }))
      .rejects.toMatchObject({ code: 'errors.storageConflict' });
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.documents.get(STORAGE_KEY)).toBe(before);
    expect(retainedKeys.map(key => [key, storage.documents.get(key)])).toEqual(others);
  });
});

describe('existing privacy export, inventory and confirmed deletion also cover v2', () => {
  it.each([1, 5, 14])('exports exact v2 bytes, counts one plan and clears only after confirmation: %i meals', async count => {
    const raw = JSON.stringify({ version: 2, plan: variable(count) }, null, 2);
    storage.documents.set(STORAGE_KEY, raw);
    const others = retainOtherDocuments();
    const backup = JSON.parse((await readLocalBackup()).content);
    expect(backup.documents).toHaveLength(7);
    expect(backup.documents.find((entry: { key: string }) => entry.key === STORAGE_KEY)).toEqual({ key: STORAGE_KEY, raw });
    expect(storage.documents.get(STORAGE_KEY)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
    const entry = (await loadPrivacyInventory()).find(value => value.scope === 'menus');
    expect(entry).toMatchObject({ valid: true, count: 1, error: null });
    const prepared = await prepareDeletion('menus');
    await expect(deletePrepared(prepared, { confirmed: false })).rejects.toThrow();
    expect(storage.documents.get(STORAGE_KEY)).toBe(raw);
    expect(storage.setItem).not.toHaveBeenCalled();
    await deletePrepared(prepared, { confirmed: true });
    expect(storage.documents.get(STORAGE_KEY)).toBe(envelope(null, 1));
    expect(retainedKeys.map(key => [key, storage.documents.get(key)])).toEqual(others);
  });

  it.each(['{corrupt', envelope(variable(14), 3), envelope({ ...variable(14), meals: ['unknown'] }, 2)])(
    'preserves corrupt, unsupported or invalid menus for export and blocks deletion: %s', async raw => {
      storage.documents.set(STORAGE_KEY, raw);
      const backup = JSON.parse((await readLocalBackup('menus')).content);
      expect(backup.documents).toEqual([{ key: PRIVACY_STORAGE_KEYS.menus, raw }]);
      expect((await loadPrivacyInventory()).find(value => value.scope === 'menus')).toMatchObject({ valid: false, count: null });
      await expect(prepareDeletion('menus')).rejects.toThrow();
      expect(storage.documents.get(STORAGE_KEY)).toBe(raw);
      expect(storage.setItem).not.toHaveBeenCalled();
    },
  );

  it('refuses a stale deletion after a concurrent v2 plan change', async () => {
    storage.documents.set(STORAGE_KEY, envelope(variable(14), 2));
    const prepared = await prepareDeletion('menus');
    const concurrent = envelope(variable(2), 2);
    storage.documents.set(STORAGE_KEY, concurrent);
    storage.setItem.mockClear();
    await expect(deletePrepared(prepared, { confirmed: true })).rejects.toThrow();
    expect(storage.documents.get(STORAGE_KEY)).toBe(concurrent);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
