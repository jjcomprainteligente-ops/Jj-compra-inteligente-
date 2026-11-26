import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createDeviceLocationRequester, DEVICE_LOCATION_TIMEOUT_MS, MAX_DEVICE_LOCATION_AGE_MS,
  MAX_DEVICE_LOCATION_FUTURE_MS, type NativeLocationAdapter,
} from '../src/services/deviceLocation';

const NOW = Date.parse('2026-11-26T12:00:00Z');
function fix(overrides: Record<string, unknown> = {}) {
  return { coords: { latitude: 28.24, longitude: -16.84, accuracy: 25 }, timestamp: NOW, ...overrides };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(finish => { resolve = finish; });
  return { promise, resolve };
}
function browser(secure = true) {
  let success!: PositionCallback, error!: PositionErrorCallback;
  const getCurrentPosition = vi.fn((onSuccess: PositionCallback, onError?: PositionErrorCallback | null) => {
    success = onSuccess; error = onError!;
  });
  const webEnvironment = vi.fn(() => ({ secure, geolocation: { getCurrentPosition } }));
  const loadNative = vi.fn();
  const request = createDeviceLocationRequester('web', { now: () => NOW, webEnvironment, loadNative });
  return { request, getCurrentPosition, webEnvironment, loadNative,
    succeed: (value: unknown) => success(value as GeolocationPosition),
    fail: (value: unknown) => error(value as GeolocationPositionError) };
}
function native(overrides: Partial<NativeLocationAdapter> = {}) {
  const adapter = { requestForegroundPermission: vi.fn(async () => true),
    getHighAccuracyPosition: vi.fn(async () => fix()), ...overrides };
  const loadNative = vi.fn(async () => adapter);
  const webEnvironment = vi.fn();
  const request = createDeviceLocationRequester('native', { now: () => NOW, loadNative, webEnvironment });
  return { request, adapter, loadNative, webEnvironment };
}

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('explicit one-shot web location', () => {
  it('does no work until requested, and uses fresh high accuracy only once', async () => {
    const web = browser();
    expect(web.webEnvironment).not.toHaveBeenCalled();
    expect(web.loadNative).not.toHaveBeenCalled();
    const result = web.request(() => false);
    expect(web.getCurrentPosition).toHaveBeenCalledExactlyOnceWith(expect.any(Function), expect.any(Function), {
      enableHighAccuracy: true, maximumAge: 0, timeout: 15_000,
    });
    web.succeed(fix());
    const captured = await result;
    expect(captured).toEqual({ status: 'ok', point: { latitude: 28.24, longitude: -16.84 }, accuracyMeters: 25, capturedAt: NOW });
    expect(Object.isFrozen(captured)).toBe(true);
    if (captured.status === 'ok') expect(Object.isFrozen(captured.point)).toBe(true);
    expect(web.loadNative).not.toHaveBeenCalled();
  });

  it('refuses insecure or missing web APIs without asking for permission', async () => {
    const insecure = browser(false);
    expect(await insecure.request(() => false)).toEqual({ status: 'unavailable' });
    expect(insecure.getCurrentPosition).not.toHaveBeenCalled();
    const absent = createDeviceLocationRequester('web', {
      webEnvironment: () => ({ secure: true, geolocation: null }),
    });
    expect(await absent(() => false)).toEqual({ status: 'unavailable' });
  });

  it('does not inspect the browser or native module when already cancelled', async () => {
    const web = browser();
    expect(await web.request(() => true)).toEqual({ status: 'cancelled' });
    expect(web.webEnvironment).not.toHaveBeenCalled();
    expect(web.loadNative).not.toHaveBeenCalled();
  });

  it('checks cancellation before reading late coordinate or error getters', async () => {
    const web = browser();
    let cancelled = false;
    const read = vi.fn(() => { throw new Error('Sensitive platform data.'); });
    const result = web.request(() => cancelled);
    cancelled = true;
    web.succeed({ get coords() { return read(); }, get timestamp() { return read(); } });
    expect(await result).toEqual({ status: 'cancelled' });
    web.fail({ get code() { return read(); } });
    expect(read).not.toHaveBeenCalled();
  });

  it.each([[1, 'denied'], [2, 'unavailable'], [3, 'timeout'], [9, 'unavailable']])(
    'sanitizes browser error code %s as %s', async (code, status) => {
      const web = browser();
      const result = web.request(() => false);
      web.fail({ code, message: 'Private raw message and location.' });
      expect(await result).toEqual({ status });
    },
  );

  it.each([
    { coords: null }, { coords: {} }, { coords: { latitude: '28', longitude: -16, accuracy: 20 } },
    { coords: { latitude: NaN, longitude: -16, accuracy: 20 } },
    { coords: { latitude: 91, longitude: -16, accuracy: 20 } },
    { coords: { latitude: 28, longitude: -181, accuracy: 20 } },
    { coords: { latitude: 28, longitude: -16.5, accuracy: null } },
    { coords: { latitude: 28, longitude: -16.5, accuracy: -1 } },
    { coords: { latitude: 28, longitude: -16.5, accuracy: Infinity } },
    { coords: { latitude: 28, longitude: -16.5, accuracy: 10_000.1 } },
    { timestamp: undefined }, { timestamp: '2026-11-26' }, { timestamp: NaN }, { timestamp: -1 },
    { timestamp: NOW - MAX_DEVICE_LOCATION_AGE_MS - 1 },
    { timestamp: NOW + MAX_DEVICE_LOCATION_FUTURE_MS + 1 },
  ])('rejects invalid or stale platform fixes %j', async overrides => {
    const web = browser();
    const result = web.request(() => false);
    web.succeed(fix(overrides));
    expect(await result).toEqual({ status: 'invalid' });
  });

  it.each([
    [0, NOW - MAX_DEVICE_LOCATION_AGE_MS], [10_000, NOW + MAX_DEVICE_LOCATION_FUTURE_MS],
  ])('accepts inclusive accuracy and age bounds %s/%s', async (accuracy, timestamp) => {
    const web = browser();
    const result = web.request(() => false);
    web.succeed(fix({ coords: { latitude: 28.2, longitude: -16.5, accuracy }, timestamp }));
    expect(await result).toMatchObject({ status: 'ok', accuracyMeters: accuracy, capturedAt: timestamp });
  });

  it('reports finite valid positions outside Tenerife as outside-scope', async () => {
    const web = browser();
    const result = web.request(() => false);
    web.succeed(fix({ coords: { latitude: 28.1, longitude: -15.4, accuracy: 20 } }));
    expect(await result).toEqual({ status: 'outside-scope' });
  });

  it('ignores subsequent callbacks before extracting more coordinates', async () => {
    const web = browser();
    const result = web.request(() => false);
    web.succeed(fix());
    expect(await result).toMatchObject({ status: 'ok' });
    const read = vi.fn();
    web.succeed({ get coords() { return read(); } });
    expect(read).not.toHaveBeenCalled();
  });

  it('times out absent browser callbacks and ignores coordinates arriving afterwards', async () => {
    vi.useFakeTimers();
    const web = browser(), read = vi.fn();
    const result = web.request(() => false);
    await vi.advanceTimersByTimeAsync(DEVICE_LOCATION_TIMEOUT_MS);
    expect(await result).toEqual({ status: 'timeout' });
    web.succeed({ get coords() { return read(); }, get timestamp() { return read(); } });
    expect(read).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('foreground native request boundaries', () => {
  it('loads native only on request, asks foreground permission then obtains one fix', async () => {
    const location = native();
    expect(location.loadNative).not.toHaveBeenCalled();
    expect(await location.request(() => false)).toMatchObject({ status: 'ok' });
    expect(location.loadNative).toHaveBeenCalledTimes(1);
    expect(location.adapter.requestForegroundPermission).toHaveBeenCalledTimes(1);
    expect(location.adapter.getHighAccuracyPosition).toHaveBeenCalledTimes(1);
    expect(location.webEnvironment).not.toHaveBeenCalled();
  });

  it('does not load native if cancelled before the explicit operation', async () => {
    const location = native();
    expect(await location.request(() => true)).toEqual({ status: 'cancelled' });
    expect(location.loadNative).not.toHaveBeenCalled();
  });

  it('checks cancellation after module loading before permission', async () => {
    const imported = deferred<NativeLocationAdapter>();
    const adapter = native().adapter;
    let cancelled = false;
    const request = createDeviceLocationRequester('native', { loadNative: () => imported.promise });
    const result = request(() => cancelled);
    cancelled = true; imported.resolve(adapter);
    expect(await result).toEqual({ status: 'cancelled' });
    expect(adapter.requestForegroundPermission).not.toHaveBeenCalled();
    expect(adapter.getHighAccuracyPosition).not.toHaveBeenCalled();
  });

  it('checks cancellation after permission before obtaining a position', async () => {
    const permission = deferred<boolean>();
    const position = vi.fn(async () => fix());
    let cancelled = false;
    const location = native({ requestForegroundPermission: () => permission.promise, getHighAccuracyPosition: position });
    const result = location.request(() => cancelled);
    await Promise.resolve();
    cancelled = true; permission.resolve(true);
    expect(await result).toEqual({ status: 'cancelled' });
    expect(position).not.toHaveBeenCalled();
  });

  it('never obtains a position after denial', async () => {
    const location = native({ requestForegroundPermission: async () => false });
    expect(await location.request(() => false)).toEqual({ status: 'denied' });
    expect(location.adapter.getHighAccuracyPosition).not.toHaveBeenCalled();
  });

  it('ignores late native fixes before extracting any coordinate', async () => {
    const position = deferred<unknown>();
    const read = vi.fn();
    let cancelled = false;
    const location = native({ getHighAccuracyPosition: () => position.promise });
    const result = location.request(() => cancelled);
    await Promise.resolve(); await Promise.resolve();
    cancelled = true;
    position.resolve({ get coords() { return read(); }, get timestamp() { return read(); } });
    expect(await result).toEqual({ status: 'cancelled' });
    expect(read).not.toHaveBeenCalled();
  });

  it('bounds native position waiting and ignores a fix arriving after timeout', async () => {
    vi.useFakeTimers();
    const position = deferred<unknown>();
    const location = native({ getHighAccuracyPosition: () => position.promise });
    const result = location.request(() => false);
    await vi.advanceTimersByTimeAsync(DEVICE_LOCATION_TIMEOUT_MS);
    expect(await result).toEqual({ status: 'timeout' });
    const read = vi.fn();
    position.resolve({ get coords() { return read(); } });
    await Promise.resolve();
    expect(read).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('times out a pending import and never requests permission after it finishes', async () => {
    vi.useFakeTimers();
    const imported = deferred<NativeLocationAdapter>(), adapter = native().adapter;
    const request = createDeviceLocationRequester('native', { loadNative: () => imported.promise });
    const result = request(() => false);
    await vi.advanceTimersByTimeAsync(DEVICE_LOCATION_TIMEOUT_MS);
    expect(await result).toEqual({ status: 'timeout' });
    imported.resolve(adapter); await Promise.resolve();
    expect(adapter.requestForegroundPermission).not.toHaveBeenCalled();
    expect(adapter.getHighAccuracyPosition).not.toHaveBeenCalled();
  });

  it('times out a permission prompt and never obtains a fix after a late grant', async () => {
    vi.useFakeTimers();
    const permission = deferred<boolean>();
    const location = native({ requestForegroundPermission: () => permission.promise });
    const result = location.request(() => false);
    await vi.advanceTimersByTimeAsync(DEVICE_LOCATION_TIMEOUT_MS);
    expect(await result).toEqual({ status: 'timeout' });
    permission.resolve(true); await Promise.resolve();
    expect(location.adapter.getHighAccuracyPosition).not.toHaveBeenCalled();
  });

  it('keeps native errors coded without retaining their raw text', async () => {
    const location = native({ getHighAccuracyPosition: async () => { throw { code: 'E_LOCATION_UNAUTHORIZED', message: 'Private.' }; } });
    expect(await location.request(() => false)).toEqual({ status: 'denied' });
  });

  it('calls the Expo foreground APIs with High accuracy through the default lazy adapter', async () => {
    const permission = vi.fn(async () => ({ granted: true }));
    const position = vi.fn(async () => fix());
    vi.doMock('expo-location', () => ({ Accuracy: { High: 4 },
      requestForegroundPermissionsAsync: permission, getCurrentPositionAsync: position }));
    const request = createDeviceLocationRequester('native', { now: () => NOW });
    expect(permission).not.toHaveBeenCalled();
    expect(position).not.toHaveBeenCalled();
    expect(await request(() => false)).toMatchObject({ status: 'ok' });
    expect(permission).toHaveBeenCalledTimes(1);
    expect(position).toHaveBeenCalledExactlyOnceWith({ accuracy: 4, mayShowUserSettingsDialog: false });
    vi.doUnmock('expo-location');
  });
});
