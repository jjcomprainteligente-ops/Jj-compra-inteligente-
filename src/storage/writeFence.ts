/**
 * A durable fence supplements Web Locks: localStorage reads in another renderer
 * can lag behind a completed write. Only hashes and fixed storage keys live here.
 * Business documents remain in their existing AsyncStorage/localStorage keys.
 */
export const WRITE_FENCE_DATABASE = 'jjcompraintelwgiemt.write-fences.v1';
export const WRITE_FENCE_STORE = 'fences';

const storageKeys = new Set([
  'jjcompraintelwgiemt.shopping.v1',
  'jjcompraintelwgiemt.menus.v1',
  'jjcompraintelwgiemt.comparisons.v1',
  'jjcompraintelwgiemt.price-observations.v1',
  'jjcompraintelwgiemt.preferences.v1',
]);
const hashPattern = /^[a-f0-9]{64}$/;
const claimPattern = /^[a-f0-9]{32}$/;
type FenceErrorKind = 'unavailable' | 'conflict' | 'uncertain';

export class WriteFenceError extends Error {
  constructor(readonly kind: FenceErrorKind) {
    super(`Write fence ${kind}.`);
    this.name = 'WriteFenceError';
  }
}

export interface WriteFenceClaim {
  readonly key: string;
  readonly claim: string;
  readonly previous: string;
  readonly proposed: string;
}
export interface WriteFence {
  check(key: string, previous?: string): Promise<void>;
  claim(key: string, previous: string, proposed: string): Promise<WriteFenceClaim>;
  commit(claim: WriteFenceClaim, actual: string): Promise<void>;
  rollback(claim: WriteFenceClaim): Promise<void>;
}

interface CommittedFence { version: 1; status: 'committed'; signature: string }
interface PendingFence { version: 1; status: 'pending'; claim: string; previous: string; proposed: string }
type FenceRecord = CommittedFence | PendingFence;
export interface WriteFenceMutation<T> { result: T; record?: unknown }
/** Backend implementations must atomically read/update and resolve only on commit. */
export interface WriteFenceBackend {
  transact<T>(key: string, update: (stored: unknown) => WriteFenceMutation<T>): Promise<T>;
}

function validHash(value: unknown): value is string {
  return typeof value === 'string' && hashPattern.test(value);
}
function validateKeyHash(key: string, ...hashes: string[]): void {
  if (!storageKeys.has(key) || !hashes.every(validHash)) throw new WriteFenceError('unavailable');
}
function exactFields(value: Record<string, unknown>, fields: string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === fields.length && fields.every(key => Object.prototype.hasOwnProperty.call(value, key));
}
function parseRecord(value: unknown): FenceRecord | undefined {
  if (value === undefined) return undefined;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new WriteFenceError('uncertain');
  const record = value as Record<string, unknown>;
  if (record.version === 1 && record.status === 'committed' &&
      exactFields(record, ['version', 'status', 'signature']) && validHash(record.signature)) {
    return { version: 1, status: 'committed', signature: record.signature };
  }
  if (record.version === 1 && record.status === 'pending' &&
      exactFields(record, ['version', 'status', 'claim', 'previous', 'proposed']) &&
      typeof record.claim === 'string' && claimPattern.test(record.claim) &&
      validHash(record.previous) && validHash(record.proposed)) {
    return { version: 1, status: 'pending', claim: record.claim, previous: record.previous, proposed: record.proposed };
  }
  // Corrupt and future records are preserved. Never infer their state from a
  // localStorage read, which could itself be the stale read this fence prevents.
  throw new WriteFenceError('uncertain');
}
function assertPrevious(record: FenceRecord | undefined, previous?: string): void {
  if (record?.status === 'pending') throw new WriteFenceError('uncertain');
  if (record && previous !== undefined && record.signature !== previous) throw new WriteFenceError('conflict');
}
function validateClaim(claim: WriteFenceClaim): void {
  if (!claim || typeof claim !== 'object') throw new WriteFenceError('uncertain');
  validateKeyHash(claim.key, claim.previous, claim.proposed);
  if (typeof claim.claim !== 'string' || !claimPattern.test(claim.claim)) throw new WriteFenceError('uncertain');
}
function assertClaim(record: FenceRecord | undefined, claim: WriteFenceClaim): void {
  if (!record || record.status !== 'pending' || record.claim !== claim.claim ||
      record.previous !== claim.previous || record.proposed !== claim.proposed) throw new WriteFenceError('uncertain');
}
function nonce(): string {
  try {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
    return [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
  } catch { throw new WriteFenceError('unavailable'); }
}

export async function hashWriteSignature(canonical: string): Promise<string> {
  try {
    if (typeof canonical !== 'string') throw new Error();
    const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
    if (digest.byteLength !== 32) throw new Error();
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  } catch { throw new WriteFenceError('unavailable'); }
}

/** Injectable storage keeps persistence failures testable without a fake DOM. */
export function createWriteFence(backend: WriteFenceBackend): WriteFence {
  async function transact<T>(key: string, update: (stored: unknown) => WriteFenceMutation<T>, kind: FenceErrorKind): Promise<T> {
    try { return await backend.transact(key, update); }
    catch (error) {
      throw error instanceof WriteFenceError && error.kind !== 'unavailable' ? error : new WriteFenceError(kind);
    }
  }
  return {
    async check(key, previous) {
      validateKeyHash(key, ...(previous === undefined ? [] : [previous]));
      await transact(key, stored => { assertPrevious(parseRecord(stored), previous); return { result: undefined }; }, 'unavailable');
    },
    async claim(key, previous, proposed) {
      validateKeyHash(key, previous, proposed);
      const claim = Object.freeze({ key, claim: nonce(), previous, proposed });
      return transact(key, stored => {
        assertPrevious(parseRecord(stored), previous);
        return { result: claim, record: { version: 1, status: 'pending', claim: claim.claim, previous, proposed } satisfies PendingFence };
      }, 'unavailable');
    },
    async commit(claim, actual) {
      validateClaim(claim);
      validateKeyHash(claim.key, actual);
      await transact(claim.key, stored => {
        assertClaim(parseRecord(stored), claim);
        return { result: undefined, record: { version: 1, status: 'committed', signature: actual } satisfies CommittedFence };
      }, 'uncertain');
    },
    async rollback(claim) {
      validateClaim(claim);
      await transact(claim.key, stored => {
        assertClaim(parseRecord(stored), claim);
        return { result: undefined, record: { version: 1, status: 'committed', signature: claim.previous } satisfies CommittedFence };
      }, 'uncertain');
    },
  };
}

function browserBackend(): WriteFenceBackend {
  let connection: Promise<IDBDatabase> | undefined;
  let unavailable = false;
  const active = new Set<() => void>();
  function invalidate(database?: IDBDatabase): void {
    if (unavailable) return;
    unavailable = true;
    for (const fail of [...active]) fail();
    try { database?.close(); } catch { /* Already closed. All callers fail safely. */ }
  }
  function database(): Promise<IDBDatabase> {
    if (unavailable) return Promise.reject(new WriteFenceError('unavailable'));
    if (connection) return connection;
    connection = new Promise((resolve, reject) => {
      try {
        const request = globalThis.indexedDB.open(WRITE_FENCE_DATABASE, 1);
        const failed = () => { invalidate(); reject(new WriteFenceError('unavailable')); };
        request.onerror = failed;
        request.onblocked = failed;
        request.onupgradeneeded = () => {
          try { request.result.createObjectStore(WRITE_FENCE_STORE); }
          catch {
            try { request.transaction?.abort(); } catch { /* The failed upgrade may already be aborted. */ }
            failed();
          }
        };
        request.onsuccess = () => {
          const opened = request.result;
          if (unavailable || !opened.objectStoreNames.contains(WRITE_FENCE_STORE)) {
            opened.close(); failed(); return;
          }
          opened.onversionchange = () => invalidate(opened);
          opened.onclose = () => invalidate(opened);
          opened.onerror = () => invalidate(opened);
          resolve(opened);
        };
      } catch { invalidate(); reject(new WriteFenceError('unavailable')); }
    });
    return connection;
  }
  return {
    async transact<T>(key: string, update: (stored: unknown) => WriteFenceMutation<T>): Promise<T> {
      const opened = await database();
      if (unavailable) throw new WriteFenceError('unavailable');
      return new Promise<T>((resolve, reject) => {
        let transaction: IDBTransaction | undefined;
        let settled = false;
        let result: T;
        let updated = false;
        const fail = (error: unknown = new WriteFenceError('unavailable')) => {
          if (settled) return;
          settled = true; active.delete(interrupted);
          try { transaction?.abort(); } catch { /* It may already have aborted. */ }
          reject(error);
        };
        const interrupted = () => fail();
        active.add(interrupted);
        try {
          transaction = opened.transaction(WRITE_FENCE_STORE, 'readwrite', { durability: 'strict' });
          // A completed relaxed transaction can still be buffered by the browser.
          // Do not write a business document unless its preceding fence requested
          // strict persistence and the browser confirms that transaction mode.
          if (transaction.durability !== 'strict') { fail(); return; }
          transaction.onerror = () => fail();
          transaction.onabort = () => fail();
          transaction.oncomplete = () => {
            if (settled) return;
            if (unavailable || !updated) { fail(); return; }
            settled = true; active.delete(interrupted); resolve(result);
          };
          const store = transaction.objectStore(WRITE_FENCE_STORE);
          const read = store.get(key);
          read.onerror = () => fail();
          read.onsuccess = () => {
            if (settled || unavailable) { fail(); return; }
            try {
              const next = update(read.result);
              if (Object.prototype.hasOwnProperty.call(next, 'record')) store.put(next.record, key);
              result = next.result; updated = true;
            } catch (error) { fail(error); }
          };
        } catch (error) { fail(error); }
      });
    },
  };
}

/** Only web callers use this fence; native runtimes retain their existing queue. */
export function createBrowserWriteFence(): WriteFence {
  return createWriteFence(browserBackend());
}
