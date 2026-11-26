import { describe, expect, it, vi } from 'vitest';
import { storeEstablishmentRegistry } from '../src/data/storeEstablishments';
import { PILOT_STORE_IDS, type PilotStoreId } from '../src/domain/stores';
import {
  DEFAULT_STORE_RADIUS_KM, MAX_STORE_RADIUS_KM, STORE_RADIUS_PRESETS,
  findNearbyEstablishments, isGeographicPoint, isSupportedTenerifePoint,
  parseStoreRadiusKm, straightLineDistanceKm, type GeoPoint,
} from '../src/domain/storeGeography';
import type { StoreEstablishment } from '../src/domain/storeEstablishments';

const AS_OF = '2026-11-26';
const origin = { latitude: 28, longitude: -16.5 };
const urls: Readonly<Record<PilotStoreId, string>> = {
  lidl: 'https://www.lidl.es/qa-location/', aldi: 'https://www.aldi.es/qa-location/',
  hiperdino: 'https://www.hiperdino.es/qa-location/', superdino: 'https://www.hiperdino.es/qa-location/',
  'hiperdino-express': 'https://www.hiperdino.es/qa-location/', mercadona: 'https://www.mercadona.es/qa-location/',
};

// Synthetic test records are independent of the runtime six-location directory.
function entry(id = 'lidl-qa', formatId: PilotStoreId = 'lidl', point: GeoPoint | null = origin,
  channel: StoreEstablishment['channel'] = 'physical') {
  return {
    id, formatId, name: 'Establecimiento ficticio QA', channel,
    address: { street: 'Calle de prueba 1', postalCode: '38683', locality: null,
      municipality: 'Municipio QA', country: 'ES' as const, island: 'tenerife' as const },
    source: { url: urls[formatId], checkedOn: AS_OF, rights: 'FACTUAL_REFERENCE_ONLY' as const },
    location: point ? { status: 'published' as const, ...point, sourceUrl: urls[formatId],
      checkedOn: AS_OF, method: 'official-jsonld' as const }
      : { status: 'pending' as const, reason: 'not-checked' as const },
    priceCoverage: 'NO_VERIFICADA' as const,
  };
}
function registry(records = [entry()]) {
  return { version: 1 as const, checkedOn: AS_OF, coverage: 'partial' as const, records };
}
function search(value: unknown = registry(), point: unknown = origin, radius: unknown = 10,
  formats?: readonly PilotStoreId[]) {
  return findNearbyEstablishments(value, point, radius, formats, AS_OF);
}
function success(value: ReturnType<typeof search>) {
  if (value.status !== 'ok') throw new Error(`Expected successful search, received ${value.status}.`);
  return value;
}

describe('bounded coordinate and radius input', () => {
  it('preserves the agreed presets and bounded default', () => {
    expect(STORE_RADIUS_PRESETS).toEqual([5, 10, 20]);
    expect(Object.isFrozen(STORE_RADIUS_PRESETS)).toBe(true);
    expect(DEFAULT_STORE_RADIUS_KM).toBe(10);
    expect(MAX_STORE_RADIUS_KM).toBe(100);
  });

  it.each([[0, 0], [-90, -180], [90, 180], [28.24, -16.84]])('accepts own finite numeric coordinates %j/%j', (latitude, longitude) => {
    expect(isGeographicPoint({ latitude, longitude })).toBe(true);
    expect(isGeographicPoint(Object.assign(Object.create(null), { latitude, longitude }))).toBe(true);
    expect(isGeographicPoint(Object.freeze({ latitude, longitude }))).toBe(true);
  });

  it.each([
    null, undefined, 1, true, '28,-16', [28, -16], {}, { latitude: 28 },
    { latitude: '28', longitude: -16 }, { latitude: 28, longitude: null },
    { latitude: NaN, longitude: -16 }, { latitude: Infinity, longitude: -16 },
    { latitude: 28, longitude: -Infinity }, { latitude: -90.0001, longitude: 0 },
    { latitude: 90.0001, longitude: 0 }, { latitude: 0, longitude: -180.0001 },
    { latitude: 0, longitude: 180.0001 }, { ...origin, accuracy: 1 },
  ])('rejects unsafe coordinate input %j', value => {
    expect(isGeographicPoint(value)).toBe(false);
    expect(straightLineDistanceKm(value, origin)).toBeNull();
    expect(straightLineDistanceKm(origin, value)).toBeNull();
  });

  it('rejects inherited, accessor, symbol and revoked coordinates without executing getters', () => {
    let accessed = 0;
    const getter = { get latitude() { accessed++; return 28; }, longitude: -16.5 };
    const revoked = Proxy.revocable({ ...origin }, {}); revoked.revoke();
    for (const value of [Object.create(origin), getter, { ...origin, [Symbol('hidden')]: 1 }, revoked.proxy,
      Object.defineProperty({ longitude: -16.5 }, 'latitude', { value: 28 })]) {
      expect(isGeographicPoint(value)).toBe(false);
      expect(straightLineDistanceKm(value, origin)).toBeNull();
    }
    expect(accessed).toBe(0);
  });

  it('uses captured data descriptors rather than later Proxy get results', () => {
    let propertyReads = 0;
    const proxy = new Proxy({ ...origin }, { get() { propertyReads++; throw new Error('Unexpected property read.'); } });
    expect(straightLineDistanceKm(proxy, origin)).toBe(0);
    expect(propertyReads).toBe(0);
  });

  it.each([1, 5, 10, 20, 100, '1', '05', '010', '100', ' 10 '])('accepts bounded integer radius %j', value => {
    expect(parseStoreRadiusKm(value)).toBe(Number(String(value).trim()));
  });

  it.each([0, -0, -1, 101, 1.1, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER, null,
    undefined, true, {}, [], '0', '101', '-5', '1.0', '1,0', '1e1', '0xA', '1 0', '1,000',
    '', ' ', '0000', '  10     ', '\t10', '10\n', '\u00a010', '١٠', '１０', '10\u200b'])('rejects invalid radius %j', value => {
    expect(parseStoreRadiusKm(value)).toBeNull();
  });

  it('treats the Tenerife box as an inclusive coherence scope, without identifying other islands by postal digits', () => {
    expect(isSupportedTenerifePoint({ latitude: 27.98, longitude: -16.95 })).toBe(true);
    expect(isSupportedTenerifePoint({ latitude: 28.65, longitude: -16.07 })).toBe(true);
    for (const point of [{ latitude: 27.9799, longitude: -16.5 }, { latitude: 28.6501, longitude: -16.5 },
      { latitude: 28.2, longitude: -16.9501 }, { latitude: 28.2, longitude: -16.0699 },
      { latitude: 28.1, longitude: -15.4 }, { latitude: 28.1, longitude: -17.1 },
      { latitude: 28.68, longitude: -17.76 }, { latitude: 0, longitude: 0 }]) {
      expect(isGeographicPoint(point)).toBe(true);
      expect(isSupportedTenerifePoint(point)).toBe(false);
    }
  });
});

describe('straight-line spherical distance', () => {
  // These expected values were checked independently with unit vectors and
  // atan2(norm(cross), dot), not by calling the Haversine implementation.
  it.each([
    [{ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 }, 111.1950802335329],
    [{ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 }, 111.1950802335329],
    [{ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 180 }, 20015.114442035923],
    [{ latitude: 0, longitude: 179.5 }, { latitude: 0, longitude: -179.5 }, 111.1950802335329],
    [{ latitude: 28.23913, longitude: -16.8391 }, { latitude: 28.2465, longitude: -16.8423 }, 0.8774122446596906],
    [{ latitude: 28.23913, longitude: -16.8391 }, { latitude: 28.2409, longitude: -16.8392 }, 0.1970589266303929],
    [{ latitude: 28.4217, longitude: -16.31916 }, { latitude: 28.4892, longitude: -16.33 }, 7.5801111504767045],
    [{ latitude: 28.23913, longitude: -16.8391 }, { latitude: 28.4217, longitude: -16.31916 }, 54.78972422300535],
  ])('matches an independent oracle for %j → %j', (first, second, expected) => {
    expect(straightLineDistanceKm(first, second)).toBeCloseTo(expected, 8);
    expect(straightLineDistanceKm(second, first)).toBeCloseTo(expected, 8);
  });

  it('has zero distance for an identical point and remains finite near antipodes/poles', () => {
    expect(straightLineDistanceKm(origin, { ...origin })).toBe(0);
    for (const [first, second] of [[{ latitude: 90, longitude: 0 }, { latitude: 90, longitude: 180 }],
      [{ latitude: 89.999999, longitude: 0 }, { latitude: -89.999999, longitude: 179.999999 }]]) {
      const distance = straightLineDistanceKm(first, second);
      expect(distance).not.toBeNull(); expect(Number.isFinite(distance)).toBe(true);
      expect(distance!).toBeGreaterThanOrEqual(0); expect(distance!).toBeLessThanOrEqual(20015.114442035925);
    }
  });
});

describe('partial establishment search', () => {
  it('calculates only physical published points, keeping pending physical records separate', () => {
    const value = registry([
      entry('near', 'lidl', origin), entry('far', 'aldi', { latitude: 28.2, longitude: -16.5 }),
      entry('pending', 'superdino', null), entry('online-pending', 'mercadona', null, 'online'),
      entry('fulfilment-pending', 'hiperdino', null, 'fulfilment'),
      entry('fulfilment-published', 'hiperdino', origin, 'fulfilment'),
    ]);
    const result = success(search(value));
    expect(result.coverage).toBe('partial');
    expect(result.within.map(item => item.establishment.id)).toEqual(['near']);
    expect(result.within[0].distanceKm).toBe(0);
    expect(result.outside.map(item => item.establishment.id)).toEqual(['far']);
    expect(result.pending.map(item => item.id)).toEqual(['pending']);
    expect(result.pending[0].location).toEqual({ status: 'pending', reason: 'not-checked' });
    expect(result.pending[0]).not.toHaveProperty('distanceKm');
  });

  it('keeps the real CP conflict outside results even when its source observation is nearby', () => {
    const result = success(search(storeEstablishmentRegistry, { latitude: 28.23913, longitude: -16.8391 }, 1));
    expect(result.within.map(item => item.establishment.id)).toEqual([
      'lidl-santiago-quinto-centenario', 'dinosol-166', 'dinosol-11',
    ]);
    expect(result.outside.map(item => item.establishment.id)).toEqual(['lidl-santa-cruz-general-sur', 'dinosol-231']);
    expect(result.pending.map(item => item.id)).toEqual(['dinosol-162']);
    expect(result.pending[0].address.postalCode).toBe('38436');
    expect(result.pending[0].location).not.toHaveProperty('latitude');
  });

  it('distinguishes an omitted format filter from an explicitly empty selection', () => {
    const value = registry(PILOT_STORE_IDS.map((format, index) => entry(`qa-${index}`, format)));
    expect(success(search(value)).within).toHaveLength(6);
    const none = success(search(value, origin, 10, []));
    expect(none.within).toEqual([]); expect(none.outside).toEqual([]); expect(none.pending).toEqual([]);
    expect(success(search(value, origin, 10, ['superdino', 'hiperdino-express'])).within.map(item => item.establishment.formatId))
      .toEqual(['superdino', 'hiperdino-express']);
  });

  it('uses ordinal IDs to break exact ties without sorting the source array', () => {
    const value = registry([entry('z-last'), entry('a-first'), entry('m-middle')]);
    const before = JSON.stringify(value);
    expect(success(search(value)).within.map(item => item.establishment.id)).toEqual(['a-first', 'm-middle', 'z-last']);
    expect(JSON.stringify(value)).toBe(before);
  });

  it('compares full precision at an inclusive boundary without widening the radius by display rounding', () => {
    const value = registry([
      entry('exact-boundary', 'lidl', { latitude: 28.089932036372453, longitude: -16.5 }),
      entry('one-mm-inside', 'lidl', { latitude: 28.089932027379252, longitude: -16.5 }),
      entry('one-mm-outside', 'lidl', { latitude: 28.089932045365657, longitude: -16.5 }),
    ]);
    const result = success(search(value));
    expect(result.within.map(item => item.establishment.id)).toEqual(['one-mm-inside', 'exact-boundary']);
    expect(result.outside.map(item => item.establishment.id)).toEqual(['one-mm-outside']);
    expect(result.outside[0].distanceKm.toFixed(1)).toBe('10.0');
  });

  it('returns deeply frozen snapshots and derived records without freezing or modifying caller data', () => {
    const value = registry([entry(), entry('pending', 'aldi', null)]);
    const before = JSON.stringify(value);
    const result = success(search(value));
    expect(JSON.stringify(value)).toBe(before);
    expect(Object.isFrozen(value)).toBe(false);
    expect(Object.isFrozen(value.records[0])).toBe(false);
    expect(result.within[0].establishment).not.toBe(value.records[0]);
    for (const object of [result, result.within, result.outside, result.pending, result.within[0],
      result.within[0].establishment, result.within[0].establishment.address, result.within[0].establishment.source,
      result.within[0].establishment.location, result.pending[0]]) expect(Object.isFrozen(object)).toBe(true);
    value.records[0].name = 'Changed after search';
    expect(result.within[0].establishment.name).toBe('Establecimiento ficticio QA');
  });

  it.each([null, undefined, {}, { ...registry(), version: 2 }, { ...registry(), records: new Array(1) },
    { ...registry(), records: [entry(), entry()] }])('reports unavailable catalogue rather than zero matches for %j', value => {
    expect(findNearbyEstablishments(value, origin, 10, undefined, AS_OF)).toEqual({ status: 'catalog-unavailable' });
  });

  it('rejects cyclic/oversized/nonplain data and hostile accessors without invoking getters', () => {
    let reads = 0;
    const getter = { ...registry(), get records() { reads++; return [entry()]; } };
    const cyclic = registry(); (cyclic as unknown as Record<string, unknown>).extra = cyclic;
    const many = registry(Array.from({ length: 501 }, (_, index) => entry(`qa-${index}`)));
    const revoked = Proxy.revocable(registry(), {}); revoked.revoke();
    for (const value of [getter, cyclic, many, Object.create(registry()), revoked.proxy,
      { ...registry(), [Symbol('hidden')]: 1 }]) expect(search(value)).toEqual({ status: 'catalog-unavailable' });
    expect(reads).toBe(0);
  });

  it('snapshots inert descriptors before the existing gate and does not read Proxy get traps', () => {
    let reads = 0;
    const proxy = new Proxy(registry(), { get() { reads++; throw new Error('Unexpected property read.'); } });
    expect(success(search(proxy)).within).toHaveLength(1);
    expect(reads).toBe(0);
  });

  it('accepts the existing maximum catalogue size without losing rows', () => {
    const value = registry(Array.from({ length: 500 }, (_, index) => entry(`qa-${index}`)));
    expect(success(search(value)).within).toHaveLength(500);
  });

  it.each([null, {}, { ...origin, accuracy: 10 }, { latitude: NaN, longitude: -16.5 }])('does not report a malformed origin as an empty result %j', value => {
    expect(search(registry(), value)).toEqual({ status: 'invalid-origin' });
  });

  it.each([{ latitude: 28.1, longitude: -15.4 }, { latitude: 28.68, longitude: -17.76 },
    { latitude: 28.1, longitude: -17.1 }, { latitude: 0, longitude: 0 }])('identifies an outside-scope reference %j', point => {
    expect(search(registry(), point)).toEqual({ status: 'outside-scope' });
  });

  it.each([0, 101, 10.1, '1e1', '10,0'])('does not turn malformed radius %j into the default', radius => {
    expect(search(registry(), origin, radius)).toEqual({ status: 'invalid-radius' });
  });

  it.each([['lidl', 'lidl'], ['carrefour'], ['other'], ['unknown'], [...PILOT_STORE_IDS, 'lidl'],
    new Array(1), Object.assign(['lidl'], { extra: true }), Object.create(['lidl']),
    Object.assign(['lidl'], { [Symbol('hidden')]: 1 }), 'lidl', null])('rejects malformed format selection %j', formats => {
    expect(search(registry(), origin, 10, formats as unknown as readonly PilotStoreId[])).toEqual({ status: 'invalid-formats' });
  });

  it('rejects format getters/revoked arrays without touching them', () => {
    let reads = 0;
    const getter: PilotStoreId[] = [];
    Object.defineProperty(getter, '0', { get() { reads++; return 'lidl'; }, enumerable: true });
    const revoked = Proxy.revocable(['lidl'], {}); revoked.revoke();
    for (const formats of [getter, revoked.proxy]) expect(search(registry(), origin, 10, formats as readonly PilotStoreId[]))
      .toEqual({ status: 'invalid-formats' });
    expect(reads).toBe(0);
  });

  it('uses the existing explicit/default UTC source gate without publishing a future catalogue', () => {
    expect(findNearbyEstablishments(registry(), origin, 10, undefined, '2026-11-25')).toEqual({ status: 'catalog-unavailable' });
    expect(findNearbyEstablishments(registry(), origin, 10, undefined, 'invalid')).toEqual({ status: 'catalog-unavailable' });
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-11-25T23:59:59Z'));
      expect(findNearbyEstablishments(registry(), origin, 10)).toEqual({ status: 'catalog-unavailable' });
      vi.setSystemTime(new Date('2026-11-26T00:00:00Z'));
      expect(findNearbyEstablishments(registry(), origin, 10).status).toBe('ok');
    } finally { vi.useRealTimers(); }
  });
});
