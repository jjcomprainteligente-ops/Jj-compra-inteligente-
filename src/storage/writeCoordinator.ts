import { appError } from '../i18n/errors';
import { createBrowserWriteFence, hashWriteSignature, WriteFenceError, type WriteFence } from './writeFence';

interface LockManagerLike {
  request<T>(name: string, callback: () => Promise<T>): Promise<T>;
}

export interface CoordinatedWrite<T> {
  /** An existing storage key, never a translated label or user-provided identifier. */
  key: string;
  /** Last successfully loaded/saved state belonging to this UI instance. */
  expected: T;
  next: T;
  /** Must validate the latest persisted document and reject invalid/future versions. */
  read: () => Promise<T>;
  /** Existing atomic storage write, with no nested call to this coordinator. */
  write: (next: T) => Promise<void>;
}

/** Copy the JSON-compatible value that can actually be persisted, without caller aliases. */
export function storageSnapshot<T>(value: T): T {
  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw new Error();
    return JSON.parse(serialized) as T;
  } catch {
    throw appError('errors.storageSnapshotInvalid');
  }
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === 'object') {
    // Null-prototype records keep even a literal __proto__ property inert.
    const result = Object.create(null) as Record<string, unknown>;
    for (const key of Object.keys(value).sort()) {
      result[key] = canonical((value as Record<string, unknown>)[key]);
    }
    return result;
  }
  return value;
}

export function storageSignature(value: unknown): string {
  try {
    return JSON.stringify(canonical(storageSnapshot(value)));
  } catch {
    throw appError('errors.storageSnapshotInvalid');
  }
}

export function isBrowserStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

async function originLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  // A native JS runtime has no DOM and uses the per-key process queue below.
  // Web storage is shared by tabs, so its critical section requires an origin lock.
  const web = isBrowserStorage();
  if (!web) return operation();
  const locks = typeof navigator !== 'undefined'
    ? (navigator as Navigator & { locks?: LockManagerLike }).locks
    : undefined;
  if (!locks || typeof locks.request !== 'function') {
    // A read/check/write fallback cannot prevent simultaneous writes in other tabs.
    // Fail before reading or writing rather than silently claiming that guarantee.
    throw appError('errors.storageLocksUnavailable');
  }
  return locks.request(`jjcompra:storage:${key}`, operation);
}

/**
 * One factory represents one JS context. Web Locks coordinate separate contexts;
 * the local queue also serializes native/React instances sharing this singleton.
 */
export interface WriteCoordinationOptions {
  fence?: WriteFence;
  hash?: (signature: string) => Promise<string>;
}

/** Domain copy distinguishes rejected writes from a write whose result is uncertain. */
export function coordinationError(error: unknown): unknown {
  if (!(error instanceof WriteFenceError)) return error;
  return appError(error.kind === 'conflict' ? 'errors.storageConflict' :
    error.kind === 'uncertain' ? 'errors.storageWriteUncertain' : 'errors.storageCoordinationUnavailable');
}

export function createWriteCoordinator(options: WriteCoordinationOptions = {}) {
  const queues = new Map<string, Promise<void>>();
  const fence = options.fence ?? createBrowserWriteFence();
  const hash = options.hash ?? hashWriteSignature;

  return async function coordinatedWrite<T>({ key, expected, next, read, write }: CoordinatedWrite<T>): Promise<T> {
    // Snapshot synchronously before waiting for another writer. A caller cannot
    // change what is compared or saved while this request is queued.
    const expectedSignature = storageSignature(expected);
    const nextSnapshot = storageSnapshot(next);
    const previous = queues.get(key) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const tail = previous.then(() => gate);
    queues.set(key, tail);

    await previous;
    try {
      return await originLock(key, async () => {
        const web = isBrowserStorage();
        const expectedHash = web ? await hash(expectedSignature) : '';
        // A pending durable claim must win over a potentially stale localStorage
        // read, including when an earlier write succeeded but its confirmation failed.
        if (web) await fence.check(key, expectedHash);
        const latest = await read();
        if (storageSignature(latest) !== expectedSignature) throw appError('errors.storageConflict');
        const claim = web ? await fence.claim(key, expectedHash, await hash(storageSignature(nextSnapshot))) : null;
        try {
          await write(nextSnapshot);
        } catch (error) {
          if (claim) {
            let unchanged = false;
            try { unchanged = storageSignature(await read()) === expectedSignature; } catch { /* An ambiguous result keeps the fence. */ }
            if (!unchanged) throw appError('errors.storageWriteUncertain');
            try { await fence.rollback(claim); }
            catch { throw appError('errors.storageWriteUncertain'); }
          }
          throw error;
        }
        // Persisted validators may normalize a URL or text. The verified readback,
        // rather than the input object, is the canonical state and final fence hash.
        let saved: T;
        try {
          saved = await read();
          if (claim) await fence.commit(claim, await hash(storageSignature(saved)));
        } catch (error) {
          if (claim) throw appError('errors.storageWriteUncertain');
          throw error;
        }
        return storageSnapshot(saved);
      });
    } catch (error) {
      throw coordinationError(error);
    } finally {
      release();
      if (queues.get(key) === tail) queues.delete(key);
    }
  };
}

/** App-wide singleton: use the same API for shopping, menus, observations and legacy. */
export const saveIfUnchanged = createWriteCoordinator();
