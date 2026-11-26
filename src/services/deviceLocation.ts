import { isGeographicPoint, isSupportedTenerifePoint, type GeoPoint } from '../domain/storeGeography';
import { loadNativeDeviceLocation } from './loadNativeDeviceLocation';

export type DeviceLocationStatus = 'denied' | 'unavailable' | 'timeout' | 'invalid' | 'outside-scope' | 'cancelled';
export type DeviceLocationResult = {
  readonly status: 'ok';
  readonly point: GeoPoint;
  readonly accuracyMeters: number;
  readonly capturedAt: number;
} | { readonly status: DeviceLocationStatus };

export type DeviceLocationRequester = (isCancelled: () => boolean) => Promise<DeviceLocationResult>;

export interface NativeLocationAdapter {
  requestForegroundPermission(): Promise<boolean>;
  getHighAccuracyPosition(): Promise<unknown>;
}

export interface DeviceLocationDependencies {
  now(): number;
  webEnvironment(): { readonly secure: boolean; readonly geolocation: Pick<Geolocation, 'getCurrentPosition'> | null };
  loadNative(): Promise<NativeLocationAdapter>;
}

export const DEVICE_LOCATION_TIMEOUT_MS = 15_000;
export const MAX_DEVICE_LOCATION_AGE_MS = 5 * 60_000;
export const MAX_DEVICE_LOCATION_FUTURE_MS = 60_000;
export const MAX_DEVICE_LOCATION_ACCURACY_METERS = 10_000;

function failure(status: DeviceLocationStatus): DeviceLocationResult { return Object.freeze({ status }); }

/** Read only the one-shot fix, never speed, heading, altitude or the original error text. */
function capturePosition(value: unknown, now: number): DeviceLocationResult {
  try {
    if (value === null || typeof value !== 'object') return failure('invalid');
    const position = value as { coords?: unknown; timestamp?: unknown };
    const coords = position.coords;
    if (coords === null || typeof coords !== 'object') return failure('invalid');
    const values = coords as { latitude?: unknown; longitude?: unknown; accuracy?: unknown };
    const point = { latitude: values.latitude, longitude: values.longitude };
    const accuracy = values.accuracy, timestamp = position.timestamp;
    if (!isGeographicPoint(point) || typeof accuracy !== 'number' || !Number.isFinite(accuracy)
      || accuracy < 0 || accuracy > MAX_DEVICE_LOCATION_ACCURACY_METERS
      || typeof timestamp !== 'number' || !Number.isFinite(timestamp) || timestamp < 0
      || !Number.isFinite(now) || now - timestamp > MAX_DEVICE_LOCATION_AGE_MS
      || timestamp - now > MAX_DEVICE_LOCATION_FUTURE_MS) return failure('invalid');
    if (!isSupportedTenerifePoint(point)) return failure('outside-scope');
    return Object.freeze({ status: 'ok', point: Object.freeze(point), accuracyMeters: accuracy, capturedAt: timestamp });
  } catch { return failure('invalid'); }
}

function errorStatus(error: unknown): DeviceLocationStatus {
  try {
    const code: unknown = error !== null && typeof error === 'object' ? (error as { code?: unknown }).code : undefined;
    if (code === 1 || code === 'E_LOCATION_UNAUTHORIZED' || code === 'E_LOCATION_PERMISSION_DENIED') return 'denied';
    if (code === 3 || code === 'E_LOCATION_TIMEOUT') return 'timeout';
  } catch { /* Error objects and their messages never enter session state. */ }
  return 'unavailable';
}

const defaults: DeviceLocationDependencies = {
  now: () => Date.now(),
  webEnvironment: () => {
    if (typeof globalThis.isSecureContext !== 'boolean' || !globalThis.isSecureContext) {
      return { secure: false, geolocation: null };
    }
    return { secure: true, geolocation: typeof navigator === 'undefined' ? null : navigator.geolocation ?? null };
  },
  loadNative: loadNativeDeviceLocation,
};

/** Constructing a requester does not inspect the device or ask for permission. */
export function createDeviceLocationRequester(
  platform: 'web' | 'native', overrides: Partial<DeviceLocationDependencies> = {},
): DeviceLocationRequester {
  const dependencies = { ...defaults, ...overrides };
  return async isCancelled => {
    if (isCancelled()) return failure('cancelled');
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stopped = () => !active || isCancelled();
    const run = async (): Promise<DeviceLocationResult> => {
      try {
        if (stopped()) return failure('cancelled');
        if (platform === 'web') {
          const environment = dependencies.webEnvironment();
          if (!environment.secure || !environment.geolocation) return failure('unavailable');
          if (stopped()) return failure('cancelled');
          return await new Promise<DeviceLocationResult>(resolve => {
            let settled = false;
            const finish = (result: DeviceLocationResult) => { if (!settled) { settled = true; resolve(result); } };
            environment.geolocation!.getCurrentPosition(position => {
              // Timeout, cancellation and duplicate callbacks are checked
              // before touching coords, including platform getters.
              if (settled || !active) return;
              if (isCancelled()) { finish(failure('cancelled')); return; }
              finish(capturePosition(position, dependencies.now()));
            }, error => {
              if (settled || !active) return;
              if (isCancelled()) { finish(failure('cancelled')); return; }
              finish(failure(errorStatus(error)));
            }, { enableHighAccuracy: true, maximumAge: 0, timeout: DEVICE_LOCATION_TIMEOUT_MS });
          });
        }
        const location = await dependencies.loadNative();
        if (stopped()) return failure('cancelled');
        const granted = await location.requestForegroundPermission();
        if (stopped()) return failure('cancelled');
        if (!granted) return failure('denied');
        const position = await location.getHighAccuracyPosition();
        if (stopped()) return failure('cancelled');
        return capturePosition(position, dependencies.now());
      } catch (error) { return failure(stopped() ? 'cancelled' : errorStatus(error)); }
    };
    try {
      // Browser timeout options exclude time in a permission prompt. This
      // deadline covers the entire operation on both platforms, including a
      // pending native import or permission request.
      const timeout = new Promise<DeviceLocationResult>(resolve => {
        timer = setTimeout(() => {
          active = false;
          resolve(failure(isCancelled() ? 'cancelled' : 'timeout'));
        }, DEVICE_LOCATION_TIMEOUT_MS);
      });
      return await Promise.race([run(), timeout]);
    } finally { active = false; if (timer !== undefined) clearTimeout(timer); }
  };
}
