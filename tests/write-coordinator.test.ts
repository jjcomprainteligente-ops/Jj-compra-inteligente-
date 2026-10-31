import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createWriteCoordinator, storageSignature, storageSnapshot } from '../src/storage/writeCoordinator';
import { createWriteFence, hashWriteSignature, WriteFenceError, type WriteFenceBackend } from '../src/storage/writeFence';

type Value = { lists: string[]; selected: string | null };
const empty = (): Value => ({ lists: [], selected: null });
const named = (name: string): Value => ({ lists: [name], selected: name });
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const shoppingKey = 'jjcompraintelwgiemt.shopping.v1';
function memoryFence() {
  const records = new Map<string, unknown>();
  const backend: WriteFenceBackend = { async transact(key, update) {
    const next = update(records.get(key));
    if (Object.hasOwn(next, 'record')) records.set(key, clone(next.record));
    return next.result;
  } };
  return { fence: createWriteFence(backend), records };
}
function browser() {
  const locks = fakeOriginLocks();
  vi.stubGlobal('window', { document: {} });
  vi.stubGlobal('navigator', { locks });
  return locks;
}

function fakeOriginLocks() {
  const pending = new Map<string, Promise<void>>();
  const request = vi.fn(async <T,>(key: string, action: () => Promise<T>): Promise<T> => {
    const before = pending.get(key) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const next = before.then(() => gate);
    pending.set(key, next);
    await before;
    try { return await action(); }
    finally {
      release();
      if (pending.get(key) === next) pending.delete(key);
    }
  });
  return { request };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

beforeEach(() => {
  // Native-like Node runtime: no DOM or cross-tab storage.
  vi.stubGlobal('window', undefined);
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('coordinated storage writes', () => {
  it('saves an initial empty state and returns a detached snapshot', async () => {
    const coordinate = createWriteCoordinator();
    let stored = empty();
    const next = named('First');
    const result = await coordinate({
      key: 'shopping', expected: empty(), next,
      read: async () => clone(stored), write: async value => { stored = value; },
    });
    expect(result).toEqual(next);
    expect(result).not.toBe(next);
    expect(result).not.toBe(stored);
    result.lists.push('UI-only mutation');
    expect(stored).toEqual(named('First'));
  });

  it('rejects a stale UI snapshot without writing or merging it', async () => {
    const coordinate = createWriteCoordinator();
    const stored = named('From another tab');
    const write = vi.fn();
    await expect(coordinate({ key: 'shopping', expected: empty(), next: named('Old draft'), read: async () => stored, write }))
      .rejects.toMatchObject({ code: 'errors.storageConflict' });
    expect(write).not.toHaveBeenCalled();
    expect(stored).toEqual(named('From another tab'));
  });

  it('serializes simultaneous writes sharing a native JS context', async () => {
    const coordinate = createWriteCoordinator();
    let stored = empty();
    const write = vi.fn(async (value: Value) => { await Promise.resolve(); stored = clone(value); });
    const read = async () => clone(stored);
    const results = await Promise.allSettled([
      coordinate({ key: 'shopping', expected: empty(), next: named('A'), read, write }),
      coordinate({ key: 'shopping', expected: empty(), next: named('B'), read, write }),
    ]);
    expect(results.map(result => result.status)).toEqual(['fulfilled', 'rejected']);
    expect(results[1]).toMatchObject({ status: 'rejected', reason: { code: 'errors.storageConflict' } });
    expect(stored).toEqual(named('A'));
    expect(write).toHaveBeenCalledTimes(1);
  });

  it('uses the same origin-wide lock across independent browser contexts', async () => {
    const locks = browser();
    const { fence } = memoryFence();
    const tabA = createWriteCoordinator({ fence });
    const tabB = createWriteCoordinator({ fence });
    let stored = empty();
    const read = async () => clone(stored);
    const write = vi.fn(async (value: Value) => { await Promise.resolve(); stored = clone(value); });
    const results = await Promise.allSettled([
      tabA({ key: shoppingKey, expected: empty(), next: named('A'), read, write }),
      tabB({ key: shoppingKey, expected: empty(), next: named('B'), read, write }),
    ]);
    expect(results.map(result => result.status)).toEqual(['fulfilled', 'rejected']);
    expect(stored).toEqual(named('A'));
    expect(write).toHaveBeenCalledTimes(1);
    expect(locks.request.mock.calls.map(([key]) => key)).toEqual([`jjcompra:storage:${shoppingKey}`, `jjcompra:storage:${shoppingKey}`]);
  });

  it('blocks web writes before reading when cross-tab locking is unavailable', async () => {
    vi.stubGlobal('window', { document: {} });
    vi.stubGlobal('navigator', {});
    const coordinate = createWriteCoordinator();
    const read = vi.fn(async () => empty());
    const write = vi.fn();
    await expect(coordinate({ key: 'shopping', expected: empty(), next: named('A'), read, write }))
      .rejects.toMatchObject({ code: 'errors.storageLocksUnavailable' });
    expect(read).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it('preserves malformed latest data and does not call the writer', async () => {
    const coordinate = createWriteCoordinator();
    const failure = new Error('Unreadable stored document');
    const write = vi.fn();
    await expect(coordinate({ key: 'shopping', expected: empty(), next: named('A'), read: async () => { throw failure; }, write }))
      .rejects.toBe(failure);
    expect(write).not.toHaveBeenCalled();
  });

  it('releases the queue after a failed read so a later retry can save', async () => {
    const coordinate = createWriteCoordinator();
    const write = vi.fn(async () => {});
    await expect(coordinate({ key: 'menus', expected: null, next: null, read: async () => { throw new Error('Read failed'); }, write }))
      .rejects.toThrow('Read failed');
    await expect(coordinate({ key: 'menus', expected: null, next: null, read: async () => null, write })).resolves.toBeNull();
    expect(write).toHaveBeenCalledOnce();
  });

  it('releases both web and local locks after a rejected storage write', async () => {
    browser();
    const { fence } = memoryFence();
    const coordinate = createWriteCoordinator({ fence });
    let stored = empty();
    const write = vi.fn().mockRejectedValueOnce(new Error('Quota exceeded'))
      .mockImplementationOnce(async (value: Value) => { stored = clone(value); });
    const options = { key: shoppingKey, expected: empty(), next: named('A'), read: async () => clone(stored), write };
    await expect(coordinate(options)).rejects.toThrow('Quota exceeded');
    await expect(coordinate(options)).resolves.toEqual(named('A'));
    expect(write).toHaveBeenCalledTimes(2);
  });

  it('detects stale undo snapshots without removing newer persisted changes', async () => {
    const coordinate = createWriteCoordinator();
    const current = named('A');
    let stored = named('A');
    const read = async () => clone(stored);
    const write = vi.fn(async (value: Value) => { stored = clone(value); });
    await coordinate({ key: 'shopping', expected: current, next: named('B'), read, write });
    const obsoleteCurrent = named('B');
    stored = named('Newer change from tab C');
    await expect(coordinate({ key: 'shopping', expected: obsoleteCurrent, next: current, read, write }))
      .rejects.toMatchObject({ code: 'errors.storageConflict' });
    expect(stored).toEqual(named('Newer change from tab C'));
    expect(write).toHaveBeenCalledTimes(1);
  });

  it('ignores record property order while preserving array order', async () => {
    const coordinate = createWriteCoordinator();
    let stored = { selected: null, lists: ['A', 'B'] } as Value;
    const write = vi.fn(async (value: Value) => { stored = clone(value); });
    await expect(coordinate({
      key: 'shopping', expected: { lists: ['A', 'B'], selected: null }, next: empty(),
      read: async () => clone(stored), write,
    })).resolves.toEqual(empty());
    await expect(coordinate({
      key: 'shopping', expected: { lists: ['A', 'B'], selected: null }, next: empty(),
      read: async () => ({ selected: null, lists: ['B', 'A'] }), write,
    })).rejects.toMatchObject({ code: 'errors.storageConflict' });
  });

  it('captures expected and next before waiting and never mutates caller snapshots', async () => {
    const coordinate = createWriteCoordinator();
    const reading = deferred<Value>();
    const expected = empty();
    const next = named('A');
    let stored = empty();
    let firstRead = true;
    const write = vi.fn(async (value: Value) => { stored = clone(value); });
    const saving = coordinate({ key: 'shopping', expected, next, read: () => {
      if (firstRead) { firstRead = false; return reading.promise; }
      return Promise.resolve(clone(stored));
    }, write });
    expected.lists.push('Caller mutation');
    next.lists.push('Caller mutation');
    reading.resolve(empty());
    await expect(saving).resolves.toEqual(named('A'));
    expect(write).toHaveBeenCalledWith(named('A'));
    expect(expected.lists).toEqual(['Caller mutation']);
    expect(next.lists).toEqual(['A', 'Caller mutation']);
  });

  it('allows independent storage keys to proceed without blocking each other', async () => {
    const coordinate = createWriteCoordinator();
    const firstRead = deferred<Value>();
    let firstStored = empty(); let secondStored = empty(); let readingFirst = true;
    const first = coordinate({ key: 'shopping', expected: empty(), next: named('A'), read: () => {
      if (readingFirst) { readingFirst = false; return firstRead.promise; }
      return Promise.resolve(firstStored);
    }, write: async value => { firstStored = clone(value); } });
    await expect(coordinate({ key: 'prices', expected: empty(), next: named('B'), read: async () => secondStored,
      write: async value => { secondStored = clone(value); } }))
      .resolves.toEqual(named('B'));
    firstRead.resolve(empty());
    await expect(first).resolves.toEqual(named('A'));
  });

  it('rejects a stale renderer cache using the durable fence before trusting its read', async () => {
    browser();
    const { fence } = memoryFence();
    let stored = empty();
    const write = vi.fn(async (value: Value) => { stored = clone(value); });
    await createWriteCoordinator({ fence })({ key: shoppingKey, expected: empty(), next: named('A'), read: async () => stored, write });
    const staleRead = vi.fn(async () => empty());
    await expect(createWriteCoordinator({ fence })({ key: shoppingKey, expected: empty(), next: named('B'), read: staleRead, write }))
      .rejects.toMatchObject({ code: 'errors.storageConflict' });
    expect(staleRead).not.toHaveBeenCalled();
    expect(stored).toEqual(named('A'));
    expect(write).toHaveBeenCalledOnce();
  });

  it('does not write a business key when the durable reservation aborts', async () => {
    browser();
    const { fence } = memoryFence();
    vi.spyOn(fence, 'claim').mockRejectedValueOnce(new WriteFenceError('unavailable'));
    const write = vi.fn();
    await expect(createWriteCoordinator({ fence })({ key: shoppingKey, expected: empty(), next: named('A'), read: async () => empty(), write }))
      .rejects.toMatchObject({ code: 'errors.storageCoordinationUnavailable' });
    expect(write).not.toHaveBeenCalled();
  });

  it('keeps a post-write confirmation failure pending and blocks a subsequent UI and a restarted context', async () => {
    browser();
    const { fence } = memoryFence();
    vi.spyOn(fence, 'commit').mockRejectedValueOnce(new WriteFenceError('uncertain'));
    let stored = empty();
    const write = vi.fn(async (value: Value) => { stored = clone(value); });
    const options = { key: shoppingKey, expected: empty(), next: named('A'), read: async () => stored, write };
    const coordinate = createWriteCoordinator({ fence });
    await expect(coordinate(options)).rejects.toMatchObject({ code: 'errors.storageWriteUncertain' });
    expect(stored).toEqual(named('A'));
    await expect(coordinate(options)).rejects.toMatchObject({ code: 'errors.storageWriteUncertain' });
    await expect(createWriteCoordinator({ fence })({ ...options, expected: stored, next: named('B') }))
      .rejects.toMatchObject({ code: 'errors.storageWriteUncertain' });
    expect(write).toHaveBeenCalledOnce();
  });

  it('returns and confirms the validated readback when a writer normalizes its input', async () => {
    browser();
    const { fence, records } = memoryFence();
    const coordinate = createWriteCoordinator({ fence });
    let stored = empty();
    const write = async (value: Value) => { stored = { lists: value.lists.map(name => name.trim()), selected: value.selected?.trim() ?? null }; };
    await expect(coordinate({ key: shoppingKey, expected: empty(), next: named(' A '), read: async () => stored, write }))
      .resolves.toEqual(named('A'));
    expect(records.get(shoppingKey)).toEqual({ version: 1, status: 'committed', signature: await hashWriteSignature(storageSignature(named('A'))) });
    await expect(coordinate({ key: shoppingKey, expected: named('A'), next: named('B'), read: async () => stored, write })).resolves.toEqual(named('B'));
  });

  it('keeps an ambiguous writer failure fenced instead of claiming that old data is intact', async () => {
    browser();
    const { fence } = memoryFence();
    let stored = empty();
    const write = vi.fn(async (value: Value) => { stored = clone(value); throw new Error('Failure after mutation'); });
    const coordinate = createWriteCoordinator({ fence });
    const options = { key: shoppingKey, expected: empty(), next: named('A'), read: async () => stored, write };
    await expect(coordinate(options)).rejects.toMatchObject({ code: 'errors.storageWriteUncertain' });
    await expect(coordinate(options)).rejects.toMatchObject({ code: 'errors.storageWriteUncertain' });
    expect(stored).toEqual(named('A'));
    expect(write).toHaveBeenCalledOnce();
  });

  it('rejects cyclic snapshots before reading or writing', async () => {
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    const read = vi.fn(async () => cyclic);
    const write = vi.fn();
    await expect(createWriteCoordinator()({ key: 'shopping', expected: cyclic, next: {}, read, write }))
      .rejects.toMatchObject({ code: 'errors.storageSnapshotInvalid' });
    expect(read).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  it('treats missing optional JSON fields consistently and keeps prototype keys inert', () => {
    const value = JSON.parse('{"__proto__":{"polluted":true},"name":"A"}') as Record<string, unknown>;
    const snapshot = storageSnapshot(value);
    expect(Object.hasOwn(snapshot, '__proto__')).toBe(true);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(storageSnapshot({ name: 'A', optional: undefined })).toEqual({ name: 'A' });
  });
});
