import { PILOT_STORE_IDS, type PilotStoreId } from './stores';
import { validateStoreEstablishmentRegistry, type StoreEstablishment } from './storeEstablishments';

export interface GeoPoint {
  readonly latitude: number;
  readonly longitude: number;
}

export const STORE_RADIUS_PRESETS = Object.freeze([5, 10, 20] as const);
export const DEFAULT_STORE_RADIUS_KM = 10;
export const MAX_STORE_RADIUS_KM = 100;

// Mean Earth radius, in kilometres. This spherical calculation is a straight
// line reference, not a route, journey time or claim of geographic precision.
const EARTH_RADIUS_KM = 6371.0088;
// Floating-point arithmetic only: about 1.1e-11 km, far below 1 mm. Source or
// device uncertainty must be described separately; it does not widen a radius.
const RADIUS_ROUNDOFF_KM = 8 * Number.EPSILON * EARTH_RADIUS_KM;

export interface NearbyEstablishment {
  readonly establishment: StoreEstablishment;
  readonly distanceKm: number;
}

export type StoreGeographyErrorStatus = 'catalog-unavailable' | 'invalid-origin' | 'outside-scope'
  | 'invalid-radius' | 'invalid-formats';

export interface NearbyEstablishmentSearchSuccess {
  readonly status: 'ok';
  readonly within: readonly NearbyEstablishment[];
  readonly outside: readonly NearbyEstablishment[];
  readonly pending: readonly StoreEstablishment[];
  readonly coverage: 'partial';
}

export type NearbyEstablishmentSearchResult = NearbyEstablishmentSearchSuccess
  | { readonly status: StoreGeographyErrorStatus };

/** Read inert own values once; validating then reading through a Proxy is unsafe. */
function readPoint(value: unknown): GeoPoint | null {
  try {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const keys = Reflect.ownKeys(value);
    if (keys.length !== 2 || !keys.includes('latitude') || !keys.includes('longitude')) return null;
    const latitude = Object.getOwnPropertyDescriptor(value, 'latitude');
    const longitude = Object.getOwnPropertyDescriptor(value, 'longitude');
    if (!latitude?.enumerable || !longitude?.enumerable || !('value' in latitude) || !('value' in longitude)) return null;
    const lat: unknown = latitude.value, lon: unknown = longitude.value;
    if (typeof lat !== 'number' || typeof lon !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lon)
      || lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return { latitude: lat, longitude: lon };
  } catch { return null; }
}

/** Checks captured descriptors; it does not freeze or identify caller-owned Proxies. */
export function isGeographicPoint(value: unknown): value is GeoPoint {
  return readPoint(value) !== null;
}

/** Coherence bounds shared with B06.1, not independent proof of island/country. */
export function isSupportedTenerifePoint(value: unknown): value is GeoPoint {
  const point = readPoint(value);
  return point !== null && point.latitude >= 27.98 && point.latitude <= 28.65
    && point.longitude >= -16.95 && point.longitude <= -16.07;
}

export function parseStoreRadiusKm(value: unknown): number | null {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 1 && value <= MAX_STORE_RADIUS_KM ? value : null;
  if (typeof value !== 'string' || value.length > 8 || /[^\x20-\x7e]/u.test(value)) return null;
  const trimmed = value.trim();
  if (!/^\d{1,3}$/.test(trimmed)) return null;
  const number = Number(trimmed);
  return number >= 1 && number <= MAX_STORE_RADIUS_KM ? number : null;
}

function distanceBetweenPoints(first: GeoPoint, second: GeoPoint): number {
  if (first.latitude === second.latitude && first.longitude === second.longitude) return 0;
  const radians = Math.PI / 180;
  const latitudeDelta = (second.latitude - first.latitude) * radians;
  const longitudeDelta = (second.longitude - first.longitude) * radians;
  const sinLatitude = Math.sin(latitudeDelta / 2), sinLongitude = Math.sin(longitudeDelta / 2);
  const haversine = sinLatitude * sinLatitude + Math.cos(first.latitude * radians)
    * Math.cos(second.latitude * radians) * sinLongitude * sinLongitude;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(Math.max(0, Math.min(1, haversine))));
}

export function straightLineDistanceKm(first: unknown, second: unknown): number | null {
  const a = readPoint(first), b = readPoint(second);
  return a && b ? distanceBetweenPoints(a, b) : null;
}

/**
 * Snapshot bounded plain data without getters, coercion or prototype setters.
 * A transparent Proxy cannot be detected portably, but no later property read
 * can replace these captured values after the registry gate has accepted them.
 */
function snapshotData(value: unknown, depth: number, budget: { remaining: number }): unknown {
  if (--budget.remaining < 0 || depth > 4) throw new TypeError('Invalid catalogue data.');
  if (value === null || ['string', 'number', 'boolean', 'undefined'].includes(typeof value)) return value;
  if (typeof value !== 'object') throw new TypeError('Invalid catalogue data.');
  const array = Array.isArray(value);
  const prototype = Object.getPrototypeOf(value);
  if (array ? prototype !== Array.prototype : prototype !== Object.prototype && prototype !== null) {
    throw new TypeError('Invalid catalogue data.');
  }
  if (array) {
    const size = Object.getOwnPropertyDescriptor(value, 'length');
    if (!size || !('value' in size) || !Number.isSafeInteger(size.value) || size.value < 0 || size.value > 500) {
      throw new TypeError('Invalid catalogue data.');
    }
    if (Reflect.ownKeys(value).length !== size.value + 1) throw new TypeError('Invalid catalogue data.');
    const result: unknown[] = [];
    for (let index = 0; index < size.value; index++) {
      const field = Object.getOwnPropertyDescriptor(value, String(index));
      if (!field?.enumerable || !('value' in field)) throw new TypeError('Invalid catalogue data.');
      result.push(snapshotData(field.value, depth + 1, budget));
    }
    return Object.freeze(result);
  }
  const keys = Reflect.ownKeys(value);
  if (keys.length > 12 || keys.some(key => typeof key !== 'string')) throw new TypeError('Invalid catalogue data.');
  const result: Record<string, unknown> = Object.create(null);
  for (const key of keys as string[]) {
    const field = Object.getOwnPropertyDescriptor(value, key);
    if (!field?.enumerable || !('value' in field)) throw new TypeError('Invalid catalogue data.');
    Object.defineProperty(result, key, { value: snapshotData(field.value, depth + 1, budget), enumerable: true });
  }
  return Object.freeze(result);
}

function reviewedFormats(value: unknown): readonly PilotStoreId[] | null {
  try {
    if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return null;
    const size = Object.getOwnPropertyDescriptor(value, 'length');
    if (!size || !('value' in size) || !Number.isSafeInteger(size.value) || size.value < 0 || size.value > PILOT_STORE_IDS.length
      || Reflect.ownKeys(value).length !== size.value + 1) return null;
    const result: PilotStoreId[] = [];
    for (let index = 0; index < size.value; index++) {
      const field = Object.getOwnPropertyDescriptor(value, String(index));
      if (!field?.enumerable || !('value' in field) || typeof field.value !== 'string'
        || !(PILOT_STORE_IDS as readonly string[]).includes(field.value) || result.includes(field.value as PilotStoreId)) return null;
      result.push(field.value as PilotStoreId);
    }
    return result;
  } catch { return null; }
}

/** Undefined formats means all; an explicit empty array always means none. */
export function findNearbyEstablishments(
  registry: unknown, origin: unknown, radiusKm: unknown, formatIds?: readonly PilotStoreId[], asOf?: string,
): NearbyEstablishmentSearchResult {
  let snapshot: unknown;
  try { snapshot = snapshotData(registry, 0, { remaining: 32_000 }); }
  catch { return Object.freeze({ status: 'catalog-unavailable' }); }
  if (!validateStoreEstablishmentRegistry(snapshot, asOf)) return Object.freeze({ status: 'catalog-unavailable' });
  const point = readPoint(origin);
  if (!point) return Object.freeze({ status: 'invalid-origin' });
  if (!isSupportedTenerifePoint(point)) return Object.freeze({ status: 'outside-scope' });
  const radius = parseStoreRadiusKm(radiusKm);
  if (radius === null) return Object.freeze({ status: 'invalid-radius' });
  const formats = formatIds === undefined ? PILOT_STORE_IDS : reviewedFormats(formatIds);
  if (!formats) return Object.freeze({ status: 'invalid-formats' });
  const within: NearbyEstablishment[] = [], outside: NearbyEstablishment[] = [], pending: StoreEstablishment[] = [];
  for (const establishment of snapshot.records) {
    if (establishment.channel !== 'physical' || !formats.includes(establishment.formatId)) continue;
    if (establishment.location.status === 'pending') { pending.push(establishment); continue; }
    const distanceKm = distanceBetweenPoints(point, establishment.location);
    const item = Object.freeze({ establishment, distanceKm });
    (distanceKm <= radius + RADIUS_ROUNDOFF_KM ? within : outside).push(item);
  }
  const order = (a: NearbyEstablishment, b: NearbyEstablishment) => a.distanceKm - b.distanceKm
    || (a.establishment.id < b.establishment.id ? -1 : a.establishment.id > b.establishment.id ? 1 : 0);
  within.sort(order); outside.sort(order);
  return Object.freeze({ status: 'ok', coverage: 'partial', within: Object.freeze(within),
    outside: Object.freeze(outside), pending: Object.freeze(pending) });
}
