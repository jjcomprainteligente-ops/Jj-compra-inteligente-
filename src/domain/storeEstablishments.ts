import { PILOT_STORE_IDS, type PilotStoreId, type StoreId } from './stores';

export interface StoreEstablishmentAddress {
  readonly street: string;
  readonly postalCode: string | null;
  readonly locality: string | null;
  readonly municipality: string;
  readonly country: 'ES';
  readonly island: 'tenerife';
}

export interface StoreEstablishmentSource {
  readonly url: string;
  readonly checkedOn: string;
  /** Describes this factual reference's scope; it does not assert a data licence. */
  readonly rights: 'FACTUAL_REFERENCE_ONLY';
}

export type StoreEstablishmentLocation = {
  readonly status: 'published';
  readonly latitude: number;
  readonly longitude: number;
  readonly sourceUrl: string;
  readonly checkedOn: string;
  readonly method: 'official-directions-link' | 'official-jsonld' | 'official-embedded-map';
} | {
  readonly status: 'pending';
  readonly reason: 'not-published' | 'conflicting-source' | 'not-checked';
};

export interface StoreEstablishment {
  readonly id: string;
  readonly formatId: PilotStoreId;
  readonly name: string;
  readonly channel: 'physical' | 'online' | 'fulfilment';
  readonly address: StoreEstablishmentAddress;
  readonly source: StoreEstablishmentSource;
  readonly location: StoreEstablishmentLocation;
  readonly priceCoverage: 'NO_VERIFICADA';
}

export interface StoreEstablishmentRegistry {
  readonly version: 1;
  readonly checkedOn: string;
  readonly coverage: 'partial';
  readonly records: readonly StoreEstablishment[];
}

const MAX_ESTABLISHMENTS = 500;
const officialHosts: Readonly<Record<PilotStoreId, readonly string[]>> = {
  lidl: ['lidl.es', 'www.lidl.es'],
  aldi: ['aldi.es', 'www.aldi.es'],
  hiperdino: ['hiperdino.es', 'www.hiperdino.es'],
  superdino: ['hiperdino.es', 'www.hiperdino.es'],
  'hiperdino-express': ['hiperdino.es', 'www.hiperdino.es', 'hiperdinoexpress.com', 'www.hiperdinoexpress.com'],
  mercadona: ['mercadona.es', 'www.mercadona.es', 'info.mercadona.es'],
};
const noEstablishments: readonly StoreEstablishment[] = Object.freeze([]);
const forbiddenText = /[<>\p{C}\u2028\u2029]|&(?:[a-z][a-z\d]{1,31}|#(?:x[\da-f]+|\d+));/iu;

/** Accept only inert, own data fields, never accessors or inherited schema fields. */
function exactRecord(input: unknown, keys: readonly string[]): input is Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return false;
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return false;
  const ownKeys = Reflect.ownKeys(input);
  if (ownKeys.length !== keys.length || ownKeys.some(key => typeof key !== 'string' || !keys.includes(key))) return false;
  return keys.every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    return !!descriptor && descriptor.enumerable === true && 'value' in descriptor;
  });
}

function plainText(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum
    && value.trim() === value && !forbiddenText.test(value);
}

function calendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function pilotFormat(value: unknown): value is PilotStoreId {
  return typeof value === 'string' && (PILOT_STORE_IDS as readonly string[]).includes(value);
}

/** A reference is restricted to its format's official host, not an arbitrary URL. */
function officialSourceUrl(value: unknown, format: PilotStoreId): value is string {
  if (!plainText(value, 1000) || /[\s\\]/u.test(value)) return false;
  const components = /^https:\/\/([a-z\d.-]+)(\/[^?#]*)?$/.exec(value);
  if (!components || !officialHosts[format].includes(components[1])) return false;
  const decodedPath = decodeURIComponent(components[2] ?? '/');
  if (forbiddenText.test(decodedPath) || /[\\]/u.test(decodedPath)
    || decodedPath.split('/').some(part => part === '.' || part === '..')) return false;
  const parsed = new URL(value);
  return parsed.protocol === 'https:' && parsed.hostname === components[1] && !parsed.port
    && !parsed.username && !parsed.password && !parsed.search && !parsed.hash;
}

function denseRecords(value: unknown): value is unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > MAX_ESTABLISHMENTS) return false;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== value.length + 1) return false;
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) return false;
  }
  return true;
}

function establishment(input: unknown, registryDate: string): input is StoreEstablishment {
  if (!exactRecord(input, ['id', 'formatId', 'name', 'channel', 'address', 'source', 'location', 'priceCoverage'])
    || !plainText(input.id, 80) || !/^[a-z][a-z\d]*(?:-[a-z\d]+)*$/.test(input.id)
    || !pilotFormat(input.formatId) || !plainText(input.name, 160)
    || !['physical', 'online', 'fulfilment'].includes(input.channel as string)
    || input.priceCoverage !== 'NO_VERIFICADA') return false;
  const address = input.address;
  if (!exactRecord(address, ['street', 'postalCode', 'locality', 'municipality', 'country', 'island'])
    || !plainText(address.street, 240) || !plainText(address.municipality, 120)
    || (address.locality !== null && !plainText(address.locality, 120))
    || (address.postalCode !== null && (typeof address.postalCode !== 'string' || !/^38[0-6]\d{2}$/.test(address.postalCode)))
    || address.country !== 'ES' || address.island !== 'tenerife') return false;
  const source = input.source;
  if (!exactRecord(source, ['url', 'checkedOn', 'rights']) || !officialSourceUrl(source.url, input.formatId)
    || !calendarDate(source.checkedOn) || source.checkedOn > registryDate
    || source.rights !== 'FACTUAL_REFERENCE_ONLY') return false;
  const location = input.location;
  if (exactRecord(location, ['status', 'reason'])) {
    return location.status === 'pending' && ['not-published', 'conflicting-source', 'not-checked'].includes(location.reason as string);
  }
  if (!exactRecord(location, ['status', 'latitude', 'longitude', 'sourceUrl', 'checkedOn', 'method'])
    || location.status !== 'published' || input.channel === 'online'
    || typeof location.latitude !== 'number' || !Number.isFinite(location.latitude)
    || typeof location.longitude !== 'number' || !Number.isFinite(location.longitude)
    // Coherence bounds only. The source review must independently establish Tenerife.
    || location.latitude < 27.98 || location.latitude > 28.65
    || location.longitude < -16.95 || location.longitude > -16.07
    || location.sourceUrl !== source.url
    || !calendarDate(location.checkedOn) || location.checkedOn > source.checkedOn
    || !['official-directions-link', 'official-jsonld', 'official-embedded-map'].includes(location.method as string)) return false;
  return true;
}

/** Strict static-data gate; it performs no network, storage or geographic inference. */
export function validateStoreEstablishmentRegistry(value: unknown, asOf?: string): value is StoreEstablishmentRegistry {
  try {
    const today = asOf === undefined ? new Date().toISOString().slice(0, 10) : asOf;
    if (!calendarDate(today) || !exactRecord(value, ['version', 'checkedOn', 'coverage', 'records'])
      || value.version !== 1 || value.coverage !== 'partial' || !calendarDate(value.checkedOn)
      || value.checkedOn > today || !denseRecords(value.records)) return false;
    const seen = new Set<string>();
    for (const entry of value.records) {
      if (!establishment(entry, value.checkedOn) || seen.has(entry.id)) return false;
      seen.add(entry.id);
    }
    return true;
  } catch {
    // Malformed escapes, revoked proxies and hostile accessors cannot open this gate.
    return false;
  }
}

/** Filter a validated registry by its explicit format without changing order or data. */
export function establishmentsForFormat(
  registry: StoreEstablishmentRegistry, formatId: StoreId,
): readonly StoreEstablishment[] {
  if (!pilotFormat(formatId)) return noEstablishments;
  return Object.freeze(registry.records.filter(entry => entry.formatId === formatId));
}
