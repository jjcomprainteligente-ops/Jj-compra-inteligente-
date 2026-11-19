/** Privacy actions address fixed app documents, never arbitrary browser storage. */
export const PRIVACY_SCOPES = Object.freeze(['shopping', 'menus', 'comparisons', 'observations', 'expenses', 'settings'] as const);
export type PrivacyScope = typeof PRIVACY_SCOPES[number];

export const PRIVACY_STORAGE_KEYS = Object.freeze({
  shopping: 'jjcompraintelwgiemt.shopping.v1',
  menus: 'jjcompraintelwgiemt.menus.v1',
  comparisons: 'jjcompraintelwgiemt.comparisons.v1',
  observations: 'jjcompraintelwgiemt.price-observations.v1',
  expenses: 'jjcompraintelwgiemt.expenses.v1',
  settings: 'jjcompraintelwgiemt.local-settings.v1',
} as const);
export const PRIVACY_LANGUAGE_KEY = 'jjcompraintelwgiemt.preferences.v1';
export type PrivacyStorageKey = typeof PRIVACY_STORAGE_KEYS[PrivacyScope] | typeof PRIVACY_LANGUAGE_KEY;
export const MAX_PRIVACY_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const MAX_PRIVACY_BACKUP_BYTES = 20 * 1024 * 1024;
export const DELETION_REVIEW_LIFETIME_MS = 5 * 60 * 1000;

export type PrivacyErrorKey =
  | 'privacy.error.invalidScope' | 'privacy.error.load' | 'privacy.error.changed'
  | 'privacy.error.tooLarge' | 'privacy.error.invalidDate' | 'privacy.error.invalidBackup'
  | 'privacy.error.unreadable' | 'privacy.error.confirm' | 'privacy.error.preparation'
  | 'privacy.error.expired' | 'privacy.error.busy' | 'privacy.error.used' | 'privacy.error.delete';

export class PrivacyError extends Error {
  constructor(readonly key: PrivacyErrorKey) { super(key); this.name = 'PrivacyError'; }
}

export interface PrivacyInventoryEntry {
  scope: PrivacyScope;
  count: number | null;
  valid: boolean;
  error: string | null;
}

/** The reviewed payload stays private to the storage service, not in the UI object. */
export interface PreparedDeletion {
  readonly scope: PrivacyScope;
  readonly count: number;
  readonly preparedAt: string;
}
export interface PrivacyDeletionResult { scope: PrivacyScope; count: number }
export interface LocalBackupDocument { key: PrivacyStorageKey; raw: string | null }
export interface LocalBackup {
  format: 'jj-local-backup';
  version: 1;
  createdAt: string;
  currency: 'EUR';
  documents: LocalBackupDocument[];
}
export interface LocalBackupFile { filename: string; content: string }

export function isPrivacyScope(scope: unknown): scope is PrivacyScope {
  return typeof scope === 'string' && (PRIVACY_SCOPES as readonly string[]).includes(scope);
}
export function assertPrivacyScope(scope: unknown): asserts scope is PrivacyScope {
  if (!isPrivacyScope(scope)) throw new PrivacyError('privacy.error.invalidScope');
}

export function privacyBackupKeys(scope?: PrivacyScope): PrivacyStorageKey[] {
  if (scope !== undefined) { assertPrivacyScope(scope); return [PRIVACY_STORAGE_KEYS[scope]]; }
  return [...PRIVACY_SCOPES.map(value => PRIVACY_STORAGE_KEYS[value]), PRIVACY_LANGUAGE_KEY];
}

/** Count UTF-8 bytes without allocating a second full-sized encoded document. */
export function privacyUtf8Bytes(value: string): number {
  let total = 0;
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code <= 0x7f) total++;
    else if (code <= 0x7ff) total += 2;
    else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length
      && value.charCodeAt(index + 1) >= 0xdc00 && value.charCodeAt(index + 1) <= 0xdfff) {
      total += 4; index++;
    } else total += 3;
  }
  return total;
}

export function checkPrivacyDocumentSize(raw: string | null): number {
  const size = raw === null ? 0 : privacyUtf8Bytes(raw);
  if (size > MAX_PRIVACY_DOCUMENT_BYTES) throw new PrivacyError('privacy.error.tooLarge');
  return size;
}

function validDate(now: Date): string {
  let milliseconds: number;
  try { milliseconds = now.getTime(); }
  catch { throw new PrivacyError('privacy.error.invalidDate'); }
  if (!Number.isFinite(milliseconds)) throw new PrivacyError('privacy.error.invalidDate');
  return new Date(milliseconds).toISOString();
}

/** Corrupt or future versions are exported as inert strings, without parsing or rewriting. */
export function buildLocalBackup(documents: readonly LocalBackupDocument[], scope?: PrivacyScope, now = new Date()): LocalBackupFile {
  const expected = privacyBackupKeys(scope);
  if (!Array.isArray(documents) || documents.length !== expected.length) throw new PrivacyError('privacy.error.invalidBackup');
  const selected = new Map<PrivacyStorageKey, string | null>();
  let total = 0;
  for (const entry of documents) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)
      || !Object.prototype.hasOwnProperty.call(entry, 'key') || !Object.prototype.hasOwnProperty.call(entry, 'raw')
      || !expected.includes(entry.key) || selected.has(entry.key)
      || (entry.raw !== null && typeof entry.raw !== 'string')) throw new PrivacyError('privacy.error.invalidBackup');
    total += checkPrivacyDocumentSize(entry.raw);
    if (total > MAX_PRIVACY_BACKUP_BYTES) throw new PrivacyError('privacy.error.tooLarge');
    selected.set(entry.key, entry.raw);
  }
  const createdAt = validDate(now);
  const backup: LocalBackup = { format: 'jj-local-backup', version: 1, createdAt, currency: 'EUR',
    documents: expected.map(key => ({ key, raw: selected.get(key)! })) };
  const content = JSON.stringify(backup, null, 2);
  if (privacyUtf8Bytes(content) > MAX_PRIVACY_BACKUP_BYTES) throw new PrivacyError('privacy.error.tooLarge');
  return { filename: `jj-local-backup-${scope ?? 'todos'}-${createdAt.replace(/[:.]/g, '-')}.json`, content };
}
