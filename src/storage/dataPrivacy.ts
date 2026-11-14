import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  assertPrivacyScope, buildLocalBackup, checkPrivacyDocumentSize, DELETION_REVIEW_LIFETIME_MS,
  MAX_PRIVACY_BACKUP_BYTES, PRIVACY_SCOPES, PRIVACY_STORAGE_KEYS, privacyBackupKeys, PrivacyError,
  type LocalBackupDocument, type LocalBackupFile, type PreparedDeletion, type PrivacyDeletionResult,
  type PrivacyInventoryEntry, type PrivacyScope,
} from '../domain/dataPrivacy';
import { emptyExpensesState } from '../domain/expenses';
import { emptyLocalPreferences } from '../domain/localPreferences';
import { loadComparisons, saveComparisons, STORAGE_KEY as comparisonsKey } from './comparisons';
import { loadExpenses, saveExpenses, STORAGE_KEY as expensesKey } from './expenses';
import { loadLocalPreferences, saveLocalPreferences, STORAGE_KEY as settingsKey } from './localPreferences';
import { loadMealPlan, saveMealPlan, STORAGE_KEY as menusKey } from './menus';
import { loadPriceObservations, savePriceObservations, STORAGE_KEY as observationsKey } from './priceObservations';
import { emptyShoppingState, loadShopping, saveShopping, STORAGE_KEY as shoppingKey } from './shopping';
import { saveIfUnchanged, storageSignature, storageSnapshot } from './writeCoordinator';

interface PrivateReview {
  createdAt: number;
  status: 'prepared' | 'deleting' | 'used';
  erase(): Promise<void>;
}
interface PrivacyDriver {
  key: string;
  readReview(): Promise<{ count: number; erase(): Promise<void> }>;
}

function driver<T>(key: string, read: () => Promise<T>, write: (value: T) => Promise<void>, empty: () => T,
  count: (value: T) => number): PrivacyDriver {
  return { key, async readReview() {
    const value = storageSnapshot(await read());
    const size = count(value);
    if (!Number.isSafeInteger(size) || size < 0) throw new PrivacyError('privacy.error.unreadable');
    return { count: size, async erase() {
      const next = empty();
      const saved = await saveIfUnchanged({ key, expected: value, next, read, write });
      if (storageSignature(saved) !== storageSignature(next)) throw new PrivacyError('privacy.error.delete');
    } };
  } };
}

const drivers: Readonly<Record<PrivacyScope, PrivacyDriver>> = {
  shopping: driver(shoppingKey, loadShopping, saveShopping, emptyShoppingState, value => value.lists.length),
  menus: driver(menusKey, loadMealPlan, saveMealPlan, () => null, value => value === null ? 0 : 1),
  comparisons: driver(comparisonsKey, loadComparisons, saveComparisons, () => [], value => value.length),
  observations: driver(observationsKey, loadPriceObservations, savePriceObservations, () => [], value => value.length),
  expenses: driver(expensesKey, loadExpenses, saveExpenses, emptyExpensesState, value => value.expenses.length),
  settings: driver(settingsKey, loadLocalPreferences, saveLocalPreferences, emptyLocalPreferences,
    value => value.favoriteStores.length + Number(value.inAppReminders)),
};
const reviews = new WeakMap<PreparedDeletion, PrivateReview>();

function selectedDriver(scope: PrivacyScope): PrivacyDriver {
  assertPrivacyScope(scope);
  const selected = drivers[scope];
  // Keep a future storage rename from silently changing the export/delete scope.
  if (selected.key !== PRIVACY_STORAGE_KEYS[scope]) throw new PrivacyError('privacy.error.invalidScope');
  return selected;
}

async function readRaw(key: string): Promise<string | null> {
  let raw: string | null;
  try { raw = await AsyncStorage.getItem(key); }
  catch { throw new PrivacyError('privacy.error.load'); }
  if (raw !== null && typeof raw !== 'string') throw new PrivacyError('privacy.error.load');
  checkPrivacyDocumentSize(raw);
  return raw;
}

/** Only explicitly allowlisted app documents enter a backup; no key enumeration. */
export async function readLocalBackup(scope?: PrivacyScope): Promise<LocalBackupFile> {
  const keys = privacyBackupKeys(scope);
  const capture = async (): Promise<LocalBackupDocument[]> => {
    const documents: LocalBackupDocument[] = [];
    let total = 0;
    for (const key of keys) {
      const raw = await readRaw(key);
      total += checkPrivacyDocumentSize(raw);
      if (total > MAX_PRIVACY_BACKUP_BYTES) throw new PrivacyError('privacy.error.tooLarge');
      documents.push({ key, raw });
    }
    return documents;
  };
  const first = await capture();
  const second = await capture();
  if (first.some((document, index) => document.raw !== second[index].raw)) throw new PrivacyError('privacy.error.changed');
  // This is a stable two-read backup, not an atomic multi-document transaction.
  return buildLocalBackup(second, scope);
}

async function captureReview(scope: PrivacyScope) {
  const selected = selectedDriver(scope);
  const before = await readRaw(selected.key);
  let prepared: { count: number; erase(): Promise<void> };
  try { prepared = await selected.readReview(); }
  catch { throw new PrivacyError('privacy.error.unreadable'); }
  const after = await readRaw(selected.key);
  if (before !== after) throw new PrivacyError('privacy.error.changed');
  return prepared;
}

/** Loading this view performs reads only; invalid data is retained and stays exportable. */
export async function loadPrivacyInventory(): Promise<PrivacyInventoryEntry[]> {
  return Promise.all(PRIVACY_SCOPES.map(async scope => {
    try {
      const prepared = await captureReview(scope);
      return { scope, count: prepared.count, valid: true, error: null };
    } catch (error) {
      return { scope, count: null, valid: false,
        error: error instanceof PrivacyError ? error.key : 'privacy.error.load' };
    }
  }));
}

/** The UI receives no raw data, deletion callback, or mutable expected snapshot. */
export async function prepareDeletion(scope: PrivacyScope): Promise<PreparedDeletion> {
  assertPrivacyScope(scope);
  const captured = await captureReview(scope);
  const createdAt = Date.now();
  const descriptor: PreparedDeletion = Object.freeze({ scope, count: captured.count, preparedAt: new Date(createdAt).toISOString() });
  reviews.set(descriptor, { createdAt, status: 'prepared', erase: captured.erase });
  return descriptor;
}

/** One confirmed category, protected by the app's existing per-key CAS and durable fence. */
export async function deletePrepared(prepared: PreparedDeletion, options: { confirmed: boolean }): Promise<PrivacyDeletionResult> {
  if (!options || options.confirmed !== true) throw new PrivacyError('privacy.error.confirm');
  if (!prepared || typeof prepared !== 'object') throw new PrivacyError('privacy.error.preparation');
  assertPrivacyScope(prepared.scope);
  const review = reviews.get(prepared);
  if (!review) throw new PrivacyError('privacy.error.preparation');
  if (review.status === 'deleting') throw new PrivacyError('privacy.error.busy');
  if (review.status === 'used') throw new PrivacyError('privacy.error.used');
  const age = Date.now() - review.createdAt;
  if (age < 0 || age > DELETION_REVIEW_LIFETIME_MS) throw new PrivacyError('privacy.error.expired');
  review.status = 'deleting';
  try {
    await review.erase();
    review.status = 'used';
    return { scope: prepared.scope, count: prepared.count };
  } catch (error) {
    review.status = 'prepared';
    throw error;
  }
}
