import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => ({
  documents: new Map<string, string>(), getItem: vi.fn(), setItem: vi.fn(), clear: vi.fn(), removeItem: vi.fn(), getAllKeys: vi.fn(),
}));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }));
import {
  buildLocalBackup, DELETION_REVIEW_LIFETIME_MS, MAX_PRIVACY_BACKUP_BYTES, MAX_PRIVACY_DOCUMENT_BYTES,
  PRIVACY_LANGUAGE_KEY, PRIVACY_SCOPES, PRIVACY_STORAGE_KEYS, privacyBackupKeys, privacyUtf8Bytes,
  type LocalBackupDocument, type PrivacyScope,
} from '../src/domain/dataPrivacy';
import { deletePrepared, loadPrivacyInventory, prepareDeletion, readLocalBackup } from '../src/storage/dataPrivacy';
import { createMealPlan } from '../src/domain/menus';
import { appError } from '../src/i18n/errors';

const timestamp = new Date('2026-11-08T12:34:56.789Z');
const shopping = () => ({ version: 1, state: { activeListId: 'list-1', lists: [{ id: 'list-1', name: 'Semana', budgetCents: 5000, items: [] }] } });
const expense = () => ({ version: 1, data: { expenses: [{ id: 'expense-1', amountCents: 1234, date: '2026-01-01',
  store: 'Mercado', note: 'Dato privado de la prueba', listId: 'list-1', listName: 'Semana', source: 'user-confirmed' }] } });
const fixtures = () => ({
  shopping: shopping(), menus: { version: 1, plan: createMealPlan(2) },
  comparisons: { version: 1, comparisons: [{ id: 'comparison-1', name: 'Producto', offers: [] }] },
  observations: { version: 1, observations: [] }, expenses: expense(),
  settings: { version: 1, preferences: { favoriteStores: ['hiperdino'], inAppReminders: true } },
});
function seed() {
  for (const scope of PRIVACY_SCOPES) storage.documents.set(PRIVACY_STORAGE_KEYS[scope], JSON.stringify(fixtures()[scope]));
  storage.documents.set(PRIVACY_LANGUAGE_KEY, JSON.stringify({ version: 1, language: 'de', welcomeCompleted: true }));
}
function documents(): LocalBackupDocument[] { return privacyBackupKeys().map(key => ({ key, raw: storage.documents.get(key) ?? null })); }

beforeEach(() => {
  vi.resetAllMocks(); storage.documents.clear();
  storage.getItem.mockImplementation(async (key: string) => storage.documents.get(key) ?? null);
  storage.setItem.mockImplementation(async (key: string, value: string) => { storage.documents.set(key, value); });
  vi.stubGlobal('window', undefined);
  vi.useFakeTimers(); vi.setSystemTime(timestamp);
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('bounded, private JSON backup', () => {
  it('exports exactly the seven fixed documents and preserves strings, cents and manual language', async () => {
    seed();
    storage.documents.set('auth.session', 'SECRET-NEVER-READ');
    storage.documents.set('jjcompraintelwgiemt.write-fences.v1', 'PRIVATE-FENCE');
    const file = await readLocalBackup();
    const parsed = JSON.parse(file.content);
    expect(parsed).toMatchObject({ format: 'jj-local-backup', version: 1, currency: 'EUR', createdAt: timestamp.toISOString() });
    expect(parsed.documents).toEqual(documents());
    expect(file.content).not.toMatch(/SECRET-NEVER-READ|PRIVATE-FENCE|auth\.session/);
    expect(file.filename).toBe('jj-local-backup-todos-2026-11-08T12-34-56-789Z.json');
    expect(storage.getAllKeys).not.toHaveBeenCalled();
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.clear).not.toHaveBeenCalled(); expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it.each(['{corrupt', '{"version":999,"private":"réservé"}', '<script>private text</script>', '\u0000😀'])('retains unreadable/future/raw text without interpreting it (%j)', async raw => {
    storage.documents.set(PRIVACY_STORAGE_KEYS.shopping, raw);
    const original = new Map(storage.documents);
    const file = await readLocalBackup('shopping');
    expect(JSON.parse(file.content).documents).toEqual([{ key: PRIVACY_STORAGE_KEYS.shopping, raw }]);
    expect(storage.documents).toEqual(original);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('exports missing data as null without creating default records', async () => {
    const parsed = JSON.parse((await readLocalBackup()).content);
    expect(parsed.documents).toHaveLength(7);
    expect(parsed.documents.every((entry: LocalBackupDocument) => entry.raw === null)).toBe(true);
    expect(storage.documents.size).toBe(0); expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('limits a scoped backup to its selected document, even if another category is huge', async () => {
    storage.documents.set(PRIVACY_STORAGE_KEYS.shopping, 'x'.repeat(MAX_PRIVACY_DOCUMENT_BYTES + 1));
    storage.documents.set(PRIVACY_STORAGE_KEYS.expenses, JSON.stringify(expense()));
    const file = await readLocalBackup('expenses');
    expect(JSON.parse(file.content).documents).toEqual([{ key: PRIVACY_STORAGE_KEYS.expenses, raw: JSON.stringify(expense()) }]);
    expect(storage.getItem.mock.calls.every(([key]) => key === PRIVACY_STORAGE_KEYS.expenses)).toBe(true);
  });

  it('refuses a backup that changes between reads and never returns mixed documents', async () => {
    seed(); let calls = 0;
    storage.getItem.mockImplementation(async (key: string) => {
      if (++calls === 8) storage.documents.set(PRIVACY_STORAGE_KEYS.shopping, JSON.stringify({ version: 1, state: { lists: [], activeListId: null } }));
      return storage.documents.get(key) ?? null;
    });
    await expect(readLocalBackup()).rejects.toThrow('privacy.error.changed');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('does not conceal read failures with an empty or partial backup', async () => {
    seed(); storage.getItem.mockRejectedValueOnce(new Error('Private operating-system detail'));
    await expect(readLocalBackup()).rejects.toThrow('privacy.error.load');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('enforces UTF-8 document and final JSON limits, including escaping overhead', () => {
    expect(privacyUtf8Bytes('Aé€😀\ud800')).toBe(new TextEncoder().encode('Aé€😀\ud800').byteLength);
    const key = PRIVACY_STORAGE_KEYS.shopping;
    expect(() => buildLocalBackup([{ key, raw: 'é'.repeat(MAX_PRIVACY_DOCUMENT_BYTES / 2 + 1) }], 'shopping', timestamp))
      .toThrow('privacy.error.tooLarge');
    expect(() => buildLocalBackup([{ key, raw: '\u0000'.repeat(MAX_PRIVACY_DOCUMENT_BYTES / 3) }], 'shopping', timestamp))
      .toThrow('privacy.error.tooLarge');
    const all = privacyBackupKeys().map(key => ({ key, raw: 'x'.repeat(MAX_PRIVACY_BACKUP_BYTES / 5) }));
    expect(() => buildLocalBackup(all, undefined, timestamp)).toThrow('privacy.error.tooLarge');
  });

  it.each([[], [{ key: 'auth.session', raw: 'secret' }], [{ key: PRIVACY_STORAGE_KEYS.shopping, raw: 12 }],
    [{ key: PRIVACY_STORAGE_KEYS.shopping, raw: null }, { key: PRIVACY_STORAGE_KEYS.shopping, raw: null }], new Array(1)])
  ('rejects foreign keys, invalid payloads, duplicate or missing documents (%j)', value => {
    expect(() => buildLocalBackup(value as LocalBackupDocument[], 'shopping', timestamp)).toThrow('privacy.error.invalidBackup');
  });

  it('strips additional fields and exports raw HTML only inside an inert JSON string', () => {
    const file = buildLocalBackup([{ key: PRIVACY_STORAGE_KEYS.shopping, raw: '<img onerror=alert(1)>', secret: 'not app data' } as LocalBackupDocument], 'shopping', timestamp);
    expect(JSON.parse(file.content).documents).toEqual([{ key: PRIVACY_STORAGE_KEYS.shopping, raw: '<img onerror=alert(1)>' }]);
    expect(file.content).not.toContain('not app data');
  });

  it('rejects an invalid export timestamp', () => {
    expect(() => buildLocalBackup(privacyBackupKeys().map(key => ({ key, raw: null })), undefined, new Date('invalid')))
      .toThrow('privacy.error.invalidDate');
  });
});

describe('inventory and explicit per-category deletion', () => {
  it('loads all six category summaries read-only, with no raw personal content in UI records', async () => {
    seed();
    const inventory = await loadPrivacyInventory();
    expect(inventory).toEqual([
      { scope: 'shopping', count: 1, valid: true, error: null }, { scope: 'menus', count: 1, valid: true, error: null },
      { scope: 'comparisons', count: 1, valid: true, error: null }, { scope: 'observations', count: 0, valid: true, error: null },
      { scope: 'expenses', count: 1, valid: true, error: null }, { scope: 'settings', count: 2, valid: true, error: null },
    ]);
    expect(JSON.stringify(inventory)).not.toContain('Dato privado'); expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each(PRIVACY_SCOPES)('deletes only confirmed %s through its existing store and preserves other raw documents', async scope => {
    seed();
    const before = new Map(storage.documents);
    const review = await prepareDeletion(scope);
    expect(Object.isFrozen(review)).toBe(true);
    expect(Object.keys(review).sort()).toEqual(['count', 'preparedAt', 'scope']);
    expect(storage.setItem).not.toHaveBeenCalled();
    const result = await deletePrepared(review, { confirmed: true });
    expect(result).toEqual({ scope, count: review.count });
    for (const [key, raw] of before) if (key !== PRIVACY_STORAGE_KEYS[scope]) expect(storage.documents.get(key)).toBe(raw);
    const summary = (await loadPrivacyInventory()).find(entry => entry.scope === scope)!;
    expect(summary).toMatchObject({ count: 0, valid: true, error: null });
    expect(storage.setItem.mock.calls.every(([key]) => key === PRIVACY_STORAGE_KEYS[scope])).toBe(true);
    expect(storage.clear).not.toHaveBeenCalled(); expect(storage.removeItem).not.toHaveBeenCalled();
  });

  it.each(['shopping', 'expenses', 'settings'] as const)('keeps %s corruption/future bytes, blocks deletion and still offers export', async scope => {
    seed(); const key = PRIVACY_STORAGE_KEYS[scope]; const raw = '{"version":999,"private":"preserve this"}';
    storage.documents.set(key, raw);
    const inventory = await loadPrivacyInventory();
    expect(inventory.find(entry => entry.scope === scope)).toMatchObject({ count: null, valid: false, error: 'privacy.error.unreadable' });
    await expect(prepareDeletion(scope)).rejects.toThrow('privacy.error.unreadable');
    expect(JSON.parse((await readLocalBackup(scope)).content).documents).toEqual([{ key, raw }]);
    expect(storage.documents.get(key)).toBe(raw); expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('an invalid category does not block summaries or deletion of a healthy independent category', async () => {
    seed(); storage.documents.set(PRIVACY_STORAGE_KEYS.shopping, '{bad');
    const review = await prepareDeletion('expenses');
    await deletePrepared(review, { confirmed: true });
    expect(storage.documents.get(PRIVACY_STORAGE_KEYS.shopping)).toBe('{bad');
    expect((await loadPrivacyInventory()).find(entry => entry.scope === 'expenses')).toMatchObject({ count: 0, valid: true });
  });

  it('requires a deliberate confirmation and a service-issued, unmodified review object', async () => {
    seed(); const review = await prepareDeletion('expenses');
    await expect(deletePrepared(review, { confirmed: false })).rejects.toThrow('privacy.error.confirm');
    await expect(deletePrepared({ ...review }, { confirmed: true })).rejects.toThrow('privacy.error.preparation');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each(['auth.session', '__proto__', 'preferences', 'shopping.v2', null, 42])('rejects unknown scope %j before any storage access', async scope => {
    await expect(readLocalBackup(scope as PrivacyScope)).rejects.toThrow('privacy.error.invalidScope');
    await expect(prepareDeletion(scope as PrivacyScope)).rejects.toThrow('privacy.error.invalidScope');
    expect(storage.getItem).not.toHaveBeenCalled(); expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('does not erase data after the reviewed snapshot becomes stale', async () => {
    seed(); const review = await prepareDeletion('shopping');
    const newer = shopping(); newer.state.lists[0].name = 'Nueva lista';
    const raw = JSON.stringify(newer); storage.documents.set(PRIVACY_STORAGE_KEYS.shopping, raw);
    await expect(deletePrepared(review, { confirmed: true })).rejects.toThrow(appError('errors.storageConflict').message);
    expect(storage.documents.get(PRIVACY_STORAGE_KEYS.shopping)).toBe(raw); expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('rejects the second of two concurrent stale deletion reviews', async () => {
    seed(); const first = await prepareDeletion('expenses'); const second = await prepareDeletion('expenses');
    const outcomes = await Promise.allSettled([deletePrepared(first, { confirmed: true }), deletePrepared(second, { confirmed: true })]);
    expect(outcomes.map(result => result.status)).toEqual(['fulfilled', 'rejected']);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it('prevents double submission of a single review, then prevents reuse after success', async () => {
    seed(); const review = await prepareDeletion('expenses');
    let release!: () => void;
    storage.setItem.mockImplementationOnce(async (key: string, value: string) => {
      await new Promise<void>(resolve => { release = resolve; }); storage.documents.set(key, value);
    });
    const first = deletePrepared(review, { confirmed: true });
    await expect(deletePrepared(review, { confirmed: true })).rejects.toThrow('privacy.error.busy');
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    release(); await first;
    await expect(deletePrepared(review, { confirmed: true })).rejects.toThrow('privacy.error.used');
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it.each([DELETION_REVIEW_LIFETIME_MS + 1, -1])('requires a fresh review after expiry or clock reversal (%s ms)', async elapsed => {
    seed(); const review = await prepareDeletion('expenses');
    vi.setSystemTime(new Date(timestamp.getTime() + elapsed));
    await expect(deletePrepared(review, { confirmed: true })).rejects.toThrow('privacy.error.expired');
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('preserves failed writes and lets the user retry the same reviewed data', async () => {
    seed(); const before = storage.documents.get(PRIVACY_STORAGE_KEYS.expenses);
    const review = await prepareDeletion('expenses');
    storage.setItem.mockRejectedValueOnce(new Error('Device detail never shown directly'));
    await expect(deletePrepared(review, { confirmed: true })).rejects.toThrow();
    expect(storage.documents.get(PRIVACY_STORAGE_KEYS.expenses)).toBe(before);
    await expect(deletePrepared(review, { confirmed: true })).resolves.toEqual({ scope: 'expenses', count: 1 });
  });

  it('does not report successful erasure if verified readback contains a different document', async () => {
    seed(); const review = await prepareDeletion('expenses');
    const replacement = expense(); replacement.data.expenses[0].amountCents = 9876;
    const replacementRaw = JSON.stringify(replacement);
    storage.setItem.mockImplementationOnce(async (key: string) => { storage.documents.set(key, replacementRaw); });
    await expect(deletePrepared(review, { confirmed: true })).rejects.toThrow('privacy.error.delete');
    expect(storage.documents.get(PRIVACY_STORAGE_KEYS.expenses)).toBe(replacementRaw);
  });

  it('blocks deletion before writing when browser cross-tab locks are unavailable', async () => {
    seed(); const review = await prepareDeletion('expenses');
    vi.stubGlobal('window', { document: {} }); vi.stubGlobal('navigator', {});
    const before = new Map(storage.documents);
    await expect(deletePrepared(review, { confirmed: true })).rejects.toThrow(appError('errors.storageLocksUnavailable').message);
    expect(storage.documents).toEqual(before); expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('rejects a document changed while its deletion summary is being prepared', async () => {
    seed(); let reads = 0;
    storage.getItem.mockImplementation(async (key: string) => {
      if (key === PRIVACY_STORAGE_KEYS.expenses && ++reads === 3) storage.documents.set(key, JSON.stringify({ version: 1, data: { expenses: [] } }));
      return storage.documents.get(key) ?? null;
    });
    await expect(prepareDeletion('expenses')).rejects.toThrow('privacy.error.changed');
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
