import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBrowserWriteFence, createWriteFence, hashWriteSignature, WriteFenceError,
  WRITE_FENCE_DATABASE, WRITE_FENCE_STORE, type WriteFenceBackend, type WriteFenceMutation } from '../src/storage/writeFence';

const key = 'jjcompraintelwgiemt.shopping.v1';
const previous = 'a'.repeat(64);
const proposed = 'b'.repeat(64);
const actual = 'c'.repeat(64);
const clone = <T,>(value: T): T => value === undefined ? value : JSON.parse(JSON.stringify(value)) as T;

class MemoryBackend implements WriteFenceBackend {
  readonly records = new Map<string, unknown>();
  calls = 0;
  failNext: 'before' | 'after' | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  transact<T>(storageKey: string, update: (stored: unknown) => WriteFenceMutation<T>): Promise<T> {
    const run = async () => {
      this.calls++;
      const failure = this.failNext;
      this.failNext = null;
      if (failure === 'before') throw new WriteFenceError('unavailable');
      const next = update(clone(this.records.get(storageKey)));
      if (Object.prototype.hasOwnProperty.call(next, 'record')) this.records.set(storageKey, clone(next.record));
      // Simulates loss of the acknowledgement after a durable transaction.
      if (failure === 'after') throw new WriteFenceError('unavailable');
      return next.result;
    };
    const pending = this.queue.then(run, run);
    this.queue = pending.then(() => undefined, () => undefined);
    return pending;
  }
}

afterEach(() => { vi.unstubAllGlobals(); });

describe('durable write fences', () => {
  it.each(['jjcompraintelwgiemt.expenses.v1', 'jjcompraintelwgiemt.local-settings.v1'])('protects the new local store %s through its full durable cycle', async storageKey => {
    const backend = new MemoryBackend();
    const fence = createWriteFence(backend);
    await fence.check(storageKey, previous);
    const claim = await fence.claim(storageKey, previous, proposed);
    await fence.commit(claim, proposed);
    await expect(fence.check(storageKey, proposed)).resolves.toBeUndefined();
    await expect(fence.claim(storageKey, previous, actual)).rejects.toMatchObject({ kind: 'conflict' });
    expect(backend.records.get(storageKey)).toEqual({ version: 1, status: 'committed', signature: proposed });
  });

  it('hashes canonical strings with SHA-256 rather than retaining business payloads', async () => {
    expect(await hashWriteSignature('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(await hashWriteSignature('œufs €')).toMatch(/^[a-f0-9]{64}$/);
    expect(await hashWriteSignature('œufs €')).not.toBe(await hashWriteSignature('oeufs EUR'));
  });

  it('fails before reserving anything when hashing or secure randomness is unavailable', async () => {
    vi.stubGlobal('crypto', undefined);
    const backend = new MemoryBackend();
    await expect(hashWriteSignature('business data')).rejects.toMatchObject({ kind: 'unavailable' });
    await expect(createWriteFence(backend).claim(key, previous, proposed)).rejects.toMatchObject({ kind: 'unavailable' });
    expect(backend.calls).toBe(0);
  });

  it('checks an absent record without writing an empty record or a reservation', async () => {
    const backend = new MemoryBackend();
    const fence = createWriteFence(backend);
    await fence.check(key);
    await fence.check(key, previous);
    expect(backend.records.size).toBe(0);
  });

  it('persists a pending claim containing only fixed metadata and hashes', async () => {
    const backend = new MemoryBackend();
    const claim = await createWriteFence(backend).claim(key, previous, proposed);
    expect(Object.isFrozen(claim)).toBe(true);
    expect(claim).toMatchObject({ key, previous, proposed, claim: expect.stringMatching(/^[a-f0-9]{32}$/) });
    expect(backend.records.get(key)).toEqual({ version: 1, status: 'pending', claim: claim.claim, previous, proposed });
  });

  it('blocks another tab while a claim is pending, including after a new instance starts', async () => {
    const backend = new MemoryBackend();
    await createWriteFence(backend).claim(key, previous, proposed);
    const restarted = createWriteFence(backend);
    await expect(restarted.check(key)).rejects.toMatchObject({ kind: 'uncertain' });
    await expect(restarted.check(key, previous)).rejects.toMatchObject({ kind: 'uncertain' });
    await expect(restarted.claim(key, previous, actual)).rejects.toMatchObject({ kind: 'uncertain' });
  });

  it('commits the actual normalized signature and rejects a stale renderer snapshot', async () => {
    const backend = new MemoryBackend();
    const first = createWriteFence(backend);
    const second = createWriteFence(backend);
    const claim = await first.claim(key, previous, proposed);
    await first.commit(claim, actual);
    expect(backend.records.get(key)).toEqual({ version: 1, status: 'committed', signature: actual });
    await second.check(key);
    await second.check(key, actual);
    await expect(second.check(key, previous)).rejects.toMatchObject({ kind: 'conflict' });
    await expect(second.claim(key, previous, proposed)).rejects.toMatchObject({ kind: 'conflict' });
    await expect(second.claim(key, actual, proposed)).resolves.toMatchObject({ previous: actual });
  });

  it('restores the prior signature after a confirmed business-write failure and permits retry', async () => {
    const backend = new MemoryBackend();
    const fence = createWriteFence(backend);
    const claim = await fence.claim(key, previous, proposed);
    await fence.rollback(claim);
    expect(backend.records.get(key)).toEqual({ version: 1, status: 'committed', signature: previous });
    const retry = await fence.claim(key, previous, proposed);
    expect(retry.claim).not.toBe(claim.claim);
    await expect(fence.commit(claim, proposed)).rejects.toMatchObject({ kind: 'uncertain' });
    await expect(fence.rollback(claim)).rejects.toMatchObject({ kind: 'uncertain' });
    expect(backend.records.get(key)).toMatchObject({ status: 'pending', claim: retry.claim });
  });

  it('does not let a mismatched claim alter the previous signature or clear another claim', async () => {
    const backend = new MemoryBackend();
    const fence = createWriteFence(backend);
    const claim = await fence.claim(key, previous, proposed);
    const before = clone(backend.records.get(key));
    await expect(fence.rollback({ ...claim, previous: actual })).rejects.toMatchObject({ kind: 'uncertain' });
    await expect(fence.commit({ ...claim, claim: '0'.repeat(32) }, actual)).rejects.toMatchObject({ kind: 'uncertain' });
    expect(backend.records.get(key)).toEqual(before);
  });

  it('serializes claims from independent instances without relying on renderer memory', async () => {
    const backend = new MemoryBackend();
    const results = await Promise.allSettled([
      createWriteFence(backend).claim(key, previous, proposed),
      createWriteFence(backend).claim(key, previous, actual),
    ]);
    expect(results.map(result => result.status)).toEqual(['fulfilled', 'rejected']);
    expect(results[1]).toMatchObject({ reason: { kind: 'uncertain' } });
  });

  it.each([
    null, [], {}, { version: 2, status: 'committed', signature: previous },
    { version: 1, status: 'committed', signature: 'invalid' },
    { version: 1, status: 'committed', signature: previous, payload: 'unexpected' },
    { version: 1, status: 'pending', claim: 'invalid', previous, proposed },
    { version: 1, status: 'pending', claim: '0'.repeat(32), previous },
  ])('preserves malformed or future records without reconciling them: %j', async record => {
    const backend = new MemoryBackend();
    backend.records.set(key, clone(record));
    const fence = createWriteFence(backend);
    await expect(fence.check(key)).rejects.toMatchObject({ kind: 'uncertain' });
    await expect(fence.claim(key, previous, proposed)).rejects.toMatchObject({ kind: 'uncertain' });
    expect(backend.records.get(key)).toEqual(record);
  });

  it.each(['arbitrary-user-input', '__proto__', 'jjcompraintelwgiemt.shopping.v2'])('rejects non-app storage key %s before backend access', async storageKey => {
    const backend = new MemoryBackend();
    const fence = createWriteFence(backend);
    await expect(fence.check(storageKey)).rejects.toMatchObject({ kind: 'unavailable' });
    await expect(fence.claim(storageKey, previous, proposed)).rejects.toMatchObject({ kind: 'unavailable' });
    expect(backend.calls).toBe(0);
  });

  it.each(['', 'a'.repeat(63), 'a'.repeat(65), 'A'.repeat(64), 'z'.repeat(64)])('rejects invalid hash %s before backend access', async hash => {
    const backend = new MemoryBackend();
    const fence = createWriteFence(backend);
    await expect(fence.check(key, hash)).rejects.toMatchObject({ kind: 'unavailable' });
    await expect(fence.claim(key, previous, hash)).rejects.toMatchObject({ kind: 'unavailable' });
    expect(backend.calls).toBe(0);
  });

  it('does not reserve a claim when the durable transaction fails before commit', async () => {
    const backend = new MemoryBackend();
    backend.failNext = 'before';
    const fence = createWriteFence(backend);
    await expect(fence.claim(key, previous, proposed)).rejects.toMatchObject({ kind: 'unavailable' });
    expect(backend.records.size).toBe(0);
    await expect(fence.claim(key, previous, proposed)).resolves.toMatchObject({ key });
  });

  it('blocks after losing the claim acknowledgement instead of assuming no claim was persisted', async () => {
    const backend = new MemoryBackend();
    backend.failNext = 'after';
    const fence = createWriteFence(backend);
    await expect(fence.claim(key, previous, proposed)).rejects.toMatchObject({ kind: 'unavailable' });
    await expect(createWriteFence(backend).check(key)).rejects.toMatchObject({ kind: 'uncertain' });
  });

  it.each(['commit', 'rollback'] as const)('keeps a pending fence when %s cannot commit, blocking all later attempts', async operation => {
    const backend = new MemoryBackend();
    const fence = createWriteFence(backend);
    const claim = await fence.claim(key, previous, proposed);
    backend.failNext = 'before';
    await expect(operation === 'commit' ? fence.commit(claim, proposed) : fence.rollback(claim))
      .rejects.toMatchObject({ kind: 'uncertain' });
    expect(backend.records.get(key)).toMatchObject({ status: 'pending', claim: claim.claim });
    await expect(createWriteFence(backend).check(key, previous)).rejects.toMatchObject({ kind: 'uncertain' });
  });
});

function browserFixture(durability: 'strict' | 'relaxed' | null = 'strict') {
  const transactions: ReturnType<typeof makeTransaction>[] = [];
  function makeTransaction() {
    const read = { result: undefined as unknown, onsuccess: null as (() => void) | null, onerror: null as (() => void) | null };
    const store = { get: vi.fn(() => read), put: vi.fn() };
    return {
      durability: durability ?? undefined,
      read, store, objectStore: vi.fn(() => store), abort: vi.fn(),
      oncomplete: null as (() => void) | null, onabort: null as (() => void) | null, onerror: null as (() => void) | null,
    };
  }
  const database = {
    objectStoreNames: { contains: vi.fn(() => true) }, createObjectStore: vi.fn(), close: vi.fn(),
    transaction: vi.fn(() => { const transaction = makeTransaction(); transactions.push(transaction); return transaction; }),
    onversionchange: null as (() => void) | null, onclose: null as (() => void) | null, onerror: null as (() => void) | null,
  };
  const request = {
    result: database, transaction: { abort: vi.fn() },
    onsuccess: null as (() => void) | null, onerror: null as (() => void) | null,
    onblocked: null as (() => void) | null, onupgradeneeded: null as (() => void) | null,
  };
  const open = vi.fn(() => request);
  vi.stubGlobal('indexedDB', { open });
  return { database, request, open, transactions };
}

describe('browser fence transaction lifecycle', () => {
  it.each(['relaxed', null] as const)('rejects unsupported durability %s before reading or reserving a record', async durability => {
    const fixture = browserFixture(durability);
    const saving = createBrowserWriteFence().claim(key, previous, proposed);
    fixture.request.onsuccess!();
    await expect(saving).rejects.toMatchObject({ kind: 'unavailable' });
    expect(fixture.transactions[0].store.get).not.toHaveBeenCalled();
    expect(fixture.transactions[0].store.put).not.toHaveBeenCalled();
    expect(fixture.transactions[0].abort).toHaveBeenCalledOnce();
  });

  it('resolves a claim only after the IDB transaction completes', async () => {
    const fixture = browserFixture();
    let resolved = false;
    const saving = createBrowserWriteFence().claim(key, previous, proposed).then(claim => { resolved = true; return claim; });
    expect(fixture.open).toHaveBeenCalledWith(WRITE_FENCE_DATABASE, 1);
    fixture.request.onupgradeneeded!();
    expect(fixture.database.createObjectStore).toHaveBeenCalledWith(WRITE_FENCE_STORE);
    fixture.request.onsuccess!();
    await Promise.resolve();
    const transaction = fixture.transactions[0];
    transaction.read.onsuccess!();
    expect(fixture.database.transaction).toHaveBeenCalledWith(WRITE_FENCE_STORE, 'readwrite', { durability: 'strict' });
    expect(transaction.store.put).toHaveBeenCalledOnce();
    await Promise.resolve();
    expect(resolved).toBe(false);
    transaction.oncomplete!();
    await expect(saving).resolves.toMatchObject({ key });
    expect(resolved).toBe(true);
  });

  it('rejects an abort even after the put request was queued', async () => {
    const fixture = browserFixture();
    const saving = createBrowserWriteFence().claim(key, previous, proposed);
    fixture.request.onsuccess!();
    await Promise.resolve();
    const transaction = fixture.transactions[0];
    transaction.read.onsuccess!();
    transaction.onabort!();
    await expect(saving).rejects.toMatchObject({ kind: 'unavailable' });
  });

  it.each(['onblocked', 'onerror'] as const)('rejects an IDB open %s and closes an unexpectedly late connection', async event => {
    const fixture = browserFixture();
    const saving = createBrowserWriteFence().claim(key, previous, proposed);
    fixture.request[event]!();
    await expect(saving).rejects.toMatchObject({ kind: 'unavailable' });
    fixture.request.onsuccess!();
    expect(fixture.database.close).toHaveBeenCalledOnce();
    expect(fixture.transactions).toHaveLength(0);
  });

  it.each(['onversionchange', 'onclose'] as const)('fails safely when an open connection receives %s', async event => {
    const fixture = browserFixture();
    const fence = createBrowserWriteFence();
    const saving = fence.claim(key, previous, proposed);
    fixture.request.onsuccess!();
    await Promise.resolve();
    const transaction = fixture.transactions[0];
    transaction.read.onsuccess!();
    fixture.database[event]!();
    await expect(saving).rejects.toMatchObject({ kind: 'unavailable' });
    expect(transaction.abort).toHaveBeenCalledOnce();
    transaction.oncomplete!();
    await expect(fence.claim(key, previous, proposed)).rejects.toMatchObject({ kind: 'unavailable' });
    expect(fixture.open).toHaveBeenCalledOnce();
  });

  it('fails before any business access when IndexedDB is unavailable', async () => {
    vi.stubGlobal('indexedDB', undefined);
    await expect(createBrowserWriteFence().claim(key, previous, proposed)).rejects.toMatchObject({ kind: 'unavailable' });
  });
});
