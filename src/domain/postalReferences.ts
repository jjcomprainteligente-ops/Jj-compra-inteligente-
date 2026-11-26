import { isSupportedTenerifePoint } from './storeGeography';

export interface PostalReference {
  readonly id: string;
  readonly postalCode: string;
  readonly locality: string;
  readonly municipality: string;
  readonly municipalityCode: string;
  readonly country: 'ES';
  readonly island: 'tenerife';
  readonly latitude: number;
  readonly longitude: number;
  /** Both methods identify an approximate reference, never an address centroid. */
  readonly method: 'postal-geonameid' | 'reviewed-gazetteer';
  readonly sourceId: string;
  readonly sourceUrl: string;
}

export interface PostalReferenceCatalog {
  readonly version: 1;
  readonly checkedOn: string;
  readonly coverage: 'partial';
  readonly attribution: {
    readonly name: 'GeoNames';
    readonly url: 'https://www.geonames.org/';
    readonly license: 'CC-BY-4.0';
    readonly licenseUrl: 'https://creativecommons.org/licenses/by/4.0/';
    readonly adapted: true;
  };
  readonly records: readonly PostalReference[];
}

export type PostalReferenceLookupResult = {
  readonly status: 'choices';
  readonly references: readonly PostalReference[];
  readonly truncated: boolean;
} | { readonly status: 'unavailable' | 'invalid-input' | 'outside-scope' | 'no-reference' };

const CATALOG_KEYS = ['version', 'checkedOn', 'coverage', 'attribution', 'records'] as const;
const REFERENCE_KEYS = ['id', 'postalCode', 'locality', 'municipality', 'municipalityCode',
  'country', 'island', 'latitude', 'longitude', 'method', 'sourceId', 'sourceUrl'] as const;
const ATTRIBUTION_KEYS = ['name', 'url', 'license', 'licenseUrl', 'adapted'] as const;
const MAX_REFERENCES = 1000;
const MAX_CHOICES = 30;
const POSTAL_SOURCE = 'https://download.geonames.org/export/zip/ES.zip';
const GAZETTEER_SOURCE = 'https://download.geonames.org/export/dump/ES.zip';
const MUNICIPALITIES = new Set([
  '38001', '38004', '38005', '38006', '38010', '38011', '38012', '38015', '38017', '38018',
  '38019', '38020', '38022', '38023', '38025', '38026', '38028', '38031', '38032', '38034',
  '38035', '38038', '38039', '38040', '38041', '38042', '38043', '38044', '38046', '38051', '38052',
]);
const forbiddenText = /[<>\p{C}\u2028\u2029]|&(?:[a-z][a-z\d]{1,31}|#(?:x[\da-f]+|\d+));/iu;

function ownData(value: unknown, expected: readonly string[]): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return null;
  const keys = Reflect.ownKeys(value);
  if (keys.length !== expected.length || keys.some(key => typeof key !== 'string' || !expected.includes(key))) return null;
  const result: Record<string, unknown> = Object.create(null);
  for (const key of expected) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !('value' in descriptor)) return null;
    Object.defineProperty(result, key, { value: descriptor.value, enumerable: true });
  }
  return result;
}

function denseValues(value: unknown): readonly unknown[] | null {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) return null;
  const length = Object.getOwnPropertyDescriptor(value, 'length');
  if (!length || !('value' in length) || !Number.isSafeInteger(length.value)
    || length.value < 0 || length.value > MAX_REFERENCES || Reflect.ownKeys(value).length !== length.value + 1) return null;
  const values: unknown[] = [];
  for (let index = 0; index < length.value; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor?.enumerable || !('value' in descriptor)) return null;
    values.push(descriptor.value);
  }
  return values;
}

function calendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function plainName(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum
    && value.trim() === value && !forbiddenText.test(value) && /\p{L}/u.test(value);
}

function captureReference(value: unknown): PostalReference | null {
  const fields = ownData(value, REFERENCE_KEYS);
  if (!fields || typeof fields.id !== 'string' || fields.id.length > 80
    || typeof fields.postalCode !== 'string' || !/^38[0-6]\d{2}$/.test(fields.postalCode)
    || !plainName(fields.locality, 180) || !plainName(fields.municipality, 120)
    || typeof fields.municipalityCode !== 'string' || !MUNICIPALITIES.has(fields.municipalityCode)
    || fields.country !== 'ES' || fields.island !== 'tenerife'
    || typeof fields.latitude !== 'number' || typeof fields.longitude !== 'number'
    || !isSupportedTenerifePoint({ latitude: fields.latitude, longitude: fields.longitude })
    || typeof fields.sourceId !== 'string') return null;
  if (fields.method === 'postal-geonameid') {
    if (!/^[a-f\d]{64}$/.test(fields.sourceId) || fields.sourceUrl !== POSTAL_SOURCE
      || fields.id !== `postal-${fields.postalCode}-${fields.sourceId.slice(0, 16)}`) return null;
  } else if (fields.method === 'reviewed-gazetteer') {
    if (!/^[1-9]\d{0,9}$/.test(fields.sourceId) || fields.sourceUrl !== GAZETTEER_SOURCE
      || fields.id !== `place-${fields.sourceId}-${fields.postalCode}`) return null;
  } else return null;
  return Object.freeze({ id: fields.id, postalCode: fields.postalCode, locality: fields.locality,
    municipality: fields.municipality, municipalityCode: fields.municipalityCode, country: fields.country,
    island: fields.island, latitude: fields.latitude, longitude: fields.longitude, method: fields.method,
    sourceId: fields.sourceId, sourceUrl: fields.sourceUrl as string });
}

function captureCatalog(value: unknown, asOf?: string): PostalReferenceCatalog | null {
  try {
    const today = asOf === undefined ? new Date().toISOString().slice(0, 10) : asOf;
    const fields = ownData(value, CATALOG_KEYS);
    if (!calendarDate(today) || !fields || fields.version !== 1 || fields.coverage !== 'partial'
      || !calendarDate(fields.checkedOn) || fields.checkedOn > today) return null;
    const attribution = ownData(fields.attribution, ATTRIBUTION_KEYS);
    if (!attribution || attribution.name !== 'GeoNames' || attribution.url !== 'https://www.geonames.org/'
      || attribution.license !== 'CC-BY-4.0' || attribution.licenseUrl !== 'https://creativecommons.org/licenses/by/4.0/'
      || attribution.adapted !== true) return null;
    const candidates = denseValues(fields.records);
    if (!candidates) return null;
    const ids = new Set<string>(), postalSources = new Set<string>(), records: PostalReference[] = [];
    for (const candidate of candidates) {
      const reference = captureReference(candidate);
      if (!reference || ids.has(reference.id)
        || reference.method === 'postal-geonameid' && postalSources.has(reference.sourceId)) return null;
      ids.add(reference.id);
      if (reference.method === 'postal-geonameid') postalSources.add(reference.sourceId);
      records.push(reference);
    }
    return Object.freeze({ version: 1, checkedOn: fields.checkedOn, coverage: 'partial',
      attribution: Object.freeze({ name: 'GeoNames', url: 'https://www.geonames.org/', license: 'CC-BY-4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', adapted: true }), records: Object.freeze(records) });
  } catch { return null; }
}

/** Validate current own values; lookups use captured snapshots rather than later Proxy reads. */
export function validatePostalReferenceCatalog(value: unknown, asOf?: string): value is PostalReferenceCatalog {
  return captureCatalog(value, asOf) !== null;
}

/** The caller has already applied the catalogue's version/date gate. No fallback ID is selected. */
export function postalReferenceById(catalog: PostalReferenceCatalog, id: unknown): PostalReference | null {
  if (typeof id !== 'string' || id.length > 80
    || !/^(?:postal-38[0-6]\d{2}-[a-f\d]{16}|place-[1-9]\d{0,9}-38[0-6]\d{2})$/.test(id)) return null;
  try {
    const fields = ownData(catalog, CATALOG_KEYS);
    if (!fields || !calendarDate(fields.checkedOn)) return null;
    const snapshot = captureCatalog(catalog, fields.checkedOn);
    return snapshot?.records.find(reference => reference.id === id) ?? null;
  } catch { return null; }
}

function normalizedWords(value: string): readonly string[] {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/ +/).filter(Boolean);
}

function containsWordPrefixes(query: readonly string[], source: string): boolean {
  const sourceWords = normalizedWords(source);
  return query.every(word => sourceWords.some(candidate => candidate.startsWith(word)));
}

function order(first: PostalReference, second: PostalReference): number {
  const a = normalizedWords(first.locality).join(' '), b = normalizedWords(second.locality).join(' ');
  return a < b ? -1 : a > b ? 1 : first.postalCode < second.postalCode ? -1 : first.postalCode > second.postalCode ? 1
    : first.id < second.id ? -1 : first.id > second.id ? 1 : 0;
}

/** Country is explicitly Spain; references are approximate choices, never inferred positions. */
export function findPostalReferences(
  catalog: unknown, input: unknown, mode: 'postal' | 'locality', asOf?: string,
): PostalReferenceLookupResult {
  const snapshot = captureCatalog(catalog, asOf);
  if (!snapshot) return Object.freeze({ status: 'unavailable' });
  if (typeof input !== 'string' || mode !== 'postal' && mode !== 'locality') return Object.freeze({ status: 'invalid-input' });
  let matches: PostalReference[];
  if (mode === 'postal') {
    if (input.length > 16 || /[^\x20-\x7e]/u.test(input)) return Object.freeze({ status: 'invalid-input' });
    const postalCode = input.trim();
    if (!/^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/.test(postalCode)) return Object.freeze({ status: 'invalid-input' });
    // This is a supported postal range, not a claim that every syntactically
    // valid code exists or belongs to a verified address or administrative area.
    if (!/^38[0-6]\d{2}$/.test(postalCode)) return Object.freeze({ status: 'outside-scope' });
    matches = snapshot.records.filter(reference => reference.postalCode === postalCode);
  } else {
    if (input.length > 80 || forbiddenText.test(input) || !/^[\p{L}\p{M}\p{P}\p{Zs}]+$/u.test(input)) {
      return Object.freeze({ status: 'invalid-input' });
    }
    const trimmed = input.trim(), words = normalizedWords(trimmed);
    if (trimmed.length < 2 || words.join('').length < 2 || words.length === 0) return Object.freeze({ status: 'invalid-input' });
    matches = snapshot.records.filter(reference => containsWordPrefixes(words, reference.locality)
      || containsWordPrefixes(words, reference.municipality));
  }
  if (matches.length === 0) return Object.freeze({ status: 'no-reference' });
  matches.sort(order);
  return Object.freeze({ status: 'choices', references: Object.freeze(matches.slice(0, MAX_CHOICES)),
    truncated: matches.length > MAX_CHOICES });
}
