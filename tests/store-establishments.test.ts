import { describe, expect, it, vi } from 'vitest';
import {
  establishmentsForFormat, validateStoreEstablishmentRegistry,
  type StoreEstablishmentRegistry,
} from '../src/domain/storeEstablishments';
import { PILOT_STORE_IDS, type PilotStoreId } from '../src/domain/stores';

const AS_OF = '2026-11-26';
const urls: Readonly<Record<PilotStoreId, string>> = {
  lidl: 'https://www.lidl.es/qa-location/',
  aldi: 'https://www.aldi.es/qa-location.html',
  hiperdino: 'https://www.hiperdino.es/qa-location/',
  superdino: 'https://www.hiperdino.es/qa-location/',
  'hiperdino-express': 'https://hiperdinoexpress.com/qa-location/',
  mercadona: 'https://info.mercadona.es/qa-location/',
};

// Isolated synthetic records exercise the contract; these are not runtime locations.
function entry(formatId: PilotStoreId = 'lidl') {
  return {
    id: `${formatId}-qa-location`, formatId, name: 'Establecimiento QA', channel: 'physical' as const,
    address: { street: 'Calle de prueba 1', postalCode: '38683', locality: 'Localidad QA',
      municipality: 'Municipio QA', country: 'ES' as const, island: 'tenerife' as const },
    source: { url: urls[formatId], checkedOn: AS_OF, rights: 'FACTUAL_REFERENCE_ONLY' as const },
    location: { status: 'published' as const, latitude: 28.24, longitude: -16.84,
      sourceUrl: urls[formatId], checkedOn: AS_OF, method: 'official-jsonld' as const },
    priceCoverage: 'NO_VERIFICADA' as const,
  };
}
function registry() {
  return { version: 1 as const, checkedOn: AS_OF, coverage: 'partial' as const, records: [entry()] };
}
type Fixture = ReturnType<typeof registry>;
type Mutation = (value: Fixture) => unknown;

describe('strict static establishment registry', () => {
  it('accepts a partial official reference without adding prices, distances or storage fields', () => {
    const original = registry();
    const before = JSON.stringify(original);
    expect(validateStoreEstablishmentRegistry(original, AS_OF)).toBe(true);
    expect(JSON.stringify(original)).toBe(before);
    expect(original.records[0]).not.toHaveProperty('distance');
    expect(original.records[0]).not.toHaveProperty('price');
    expect(validateStoreEstablishmentRegistry({ ...original, records: [] }, AS_OF)).toBe(true);
    expect(validateStoreEstablishmentRegistry(Object.freeze({ ...original,
      records: Object.freeze([Object.freeze(entry())]) }), AS_OF)).toBe(true);
  });

  it.each(PILOT_STORE_IDS)('accepts the explicitly reviewed %s format on its own official host', formatId => {
    expect(validateStoreEstablishmentRegistry({ ...registry(), records: [entry(formatId)] }, AS_OF)).toBe(true);
  });

  it.each(['official-directions-link', 'official-jsonld', 'official-embedded-map'])(
    'accepts published coordinates with the explicit %s evidence method', method => {
      const value = registry();
      expect(validateStoreEstablishmentRegistry({ ...value, records: [{ ...entry(),
        location: { ...entry().location, method } }] }, AS_OF)).toBe(true);
    },
  );

  it('keeps conflicting source facts pending without retaining a usable coordinate or correcting the source CP', () => {
    const pending = { ...entry('superdino'), address: { ...entry().address, postalCode: '38436' },
      location: { status: 'pending' as const, reason: 'conflicting-source' as const } };
    const value = { ...registry(), records: [pending] };
    const before = JSON.stringify(value);
    expect(validateStoreEstablishmentRegistry(value, AS_OF)).toBe(true);
    expect(value.records[0].address.postalCode).toBe('38436');
    expect(value.records[0].location).not.toHaveProperty('latitude');
    expect(value.records[0].location).not.toHaveProperty('distance');
    expect(JSON.stringify(value)).toBe(before);
  });

  it.each(['not-published', 'conflicting-source', 'not-checked'])(
    'preserves %s locations and missing optional address facts explicitly', reason => {
      expect(validateStoreEstablishmentRegistry({ ...registry(), records: [{ ...entry(),
        address: { ...entry().address, postalCode: null, locality: null },
        location: { status: 'pending', reason } }] }, AS_OF)).toBe(true);
    },
  );

  const malformed: readonly [string, Mutation][] = [
    ['future schema', value => ({ ...value, version: 2 })],
    ['coerced schema', value => ({ ...value, version: '1' })],
    ['unverified complete coverage', value => ({ ...value, coverage: 'complete' })],
    ['extra registry field', value => ({ ...value, recovered: true })],
    ['missing registry field', value => ({ checkedOn: value.checkedOn, records: value.records, version: 1 })],
    ['nonarray records', value => ({ ...value, records: {} })],
    ['sparse records', value => ({ ...value, records: new Array(1) })],
    ['inherited registry fields', value => Object.create(value) as unknown],
    ['inherited entry fields', value => ({ ...value, records: [Object.create(entry()) as unknown] })],
    ['extra entry field', value => ({ ...value, records: [{ ...entry(), distanceKm: 1 }] })],
    ['extra address field', value => ({ ...value, records: [{ ...entry(), address: { ...entry().address, preciseUserLocation: true } }] })],
    ['extra source field', value => ({ ...value, records: [{ ...entry(), source: { ...entry().source, token: 'qa-placeholder' } }] })],
    ['duplicate IDs', value => ({ ...value, records: [entry(), entry()] })],
    ['unknown format', value => ({ ...value, records: [{ ...entry(), formatId: 'carrefour' }] })],
    ['unknown channel', value => ({ ...value, records: [{ ...entry(), channel: 'delivery-assumed' }] })],
    ['price coverage upgrade', value => ({ ...value, records: [{ ...entry(), priceCoverage: 'VERIFICADA' }] })],
    ['licence inferred from factual scope', value => ({ ...value, records: [{ ...entry(), source: { ...entry().source, rights: 'ODbL' } }] })],
    ['numeric postal code', value => ({ ...value, records: [{ ...entry(), address: { ...entry().address, postalCode: 38683 } }] })],
    ['another-island postal code', value => ({ ...value, records: [{ ...entry(), address: { ...entry().address, postalCode: '38800' } }] })],
    ['another country', value => ({ ...value, records: [{ ...entry(), address: { ...entry().address, country: 'FR' } }] })],
    ['another island', value => ({ ...value, records: [{ ...entry(), address: { ...entry().address, island: 'gran-canaria' } }] })],
    ['missing municipality', value => ({ ...value, records: [{ ...entry(), address: { ...entry().address, municipality: null } }] })],
    ['unknown pending reason', value => ({ ...value, records: [{ ...entry(), location: { status: 'pending', reason: 'nearby' } }] })],
    ['pending coordinates', value => ({ ...value, records: [{ ...entry(), location: { status: 'pending', reason: 'not-checked', latitude: 28.24 } }] })],
    ['published distance', value => ({ ...value, records: [{ ...entry(), location: { ...entry().location, distanceKm: 2 } }] })],
    ['coordinate method inferred', value => ({ ...value, records: [{ ...entry(), location: { ...entry().location, method: 'guessed-from-address' } }] })],
    ['online physical point assumed', value => ({ ...value, records: [{ ...entry(), channel: 'online' }] })],
    ['location source mismatch', value => ({ ...value, records: [{ ...entry(), location: { ...entry().location,
      sourceUrl: 'https://www.lidl.es/other-location/' } }] })],
  ];
  it.each(malformed)('rejects %s without normalizing the input', (_name, mutate) => {
    const input = mutate(registry());
    expect(validateStoreEstablishmentRegistry(input, AS_OF)).toBe(false);
  });

  it.each([null, undefined, [], 1, 'registry', true])('rejects non-schema input %j', input => {
    expect(validateStoreEstablishmentRegistry(input, AS_OF)).toBe(false);
  });

  it.each(['UPPERCASE', 'unsafe_id', '-leading', 'trailing-', 'two--hyphens', '1-start', 'а-lookalike', 'a'.repeat(81)])(
    'rejects noncanonical ID %s', id => {
      expect(validateStoreEstablishmentRegistry({ ...registry(), records: [{ ...entry(), id }] }, AS_OF)).toBe(false);
    },
  );

  it.each(['', ' leading', 'trailing ', 'text\nline', 'bidi\u202Etext', 'zero\u200Bwidth', '<script>', '&lt;script&gt;', '\uD800', 'x'.repeat(161)])(
    'rejects unsafe or unbounded display text %j', name => {
      expect(validateStoreEstablishmentRegistry({ ...registry(), records: [{ ...entry(), name }] }, AS_OF)).toBe(false);
    },
  );

  it('bounds address fields separately while allowing accented plain names', () => {
    const base = registry();
    expect(validateStoreEstablishmentRegistry({ ...base, records: [{ ...entry(), name: 'Tienda — Añaza · QA' }] }, AS_OF)).toBe(true);
    for (const [key, text] of [['street', 'x'.repeat(241)], ['locality', 'x'.repeat(121)], ['municipality', 'x'.repeat(121)]]) {
      expect(validateStoreEstablishmentRegistry({ ...base, records: [{ ...entry(), address: { ...entry().address, [key]: text } }] }, AS_OF)).toBe(false);
    }
  });

  it.each([
    'http://www.lidl.es/location/', 'https://www.lidl.es.evil.test/location/',
    'https://www.lidl.es@evil.test/location/', 'https://user:pass@www.lidl.es/location/',
    'https://www.lidl.es:443/location/', 'https://www.lidl.es./location/',
    'https://%77ww.lidl.es/location/', 'https://www.lidl.es/location/?token=qa',
    'https://www.lidl.es/location/#', 'https://www.lidl.es/location/?',
    'https://www.lidl.es\\@evil.test/', 'https://www.lidl.es/%00',
    'https://www.lidl.es/%3Cscript%3E', 'https://www.lidl.es/%E2%80%AE',
    'https://www.lidl.es/%', 'https://www.lidl.es/%2e%2e/location/',
    'javascript:alert(1)', 'https://www.aldi.es/location/', `https://www.lidl.es/${'x'.repeat(1000)}`,
  ])('rejects unreviewed or ambiguous source URL %s', url => {
    const original = entry();
    expect(validateStoreEstablishmentRegistry({ ...registry(), records: [{ ...original,
      source: { ...original.source, url }, location: { ...original.location, sourceUrl: url } }] }, AS_OF)).toBe(false);
  });

  it.each([
    [NaN, -16.84], [Infinity, -16.84], [-Infinity, -16.84], [28.24, NaN],
    [28.24, Infinity], [27.979, -16.84], [28.651, -16.84], [28.24, -16.951], [28.24, -16.069],
    [28.1, -15.6], [28.65, -17.8], [0, 0], ['28.24', -16.84], [null, -16.84],
  ])('rejects non-finite, coerced or out-of-scope coordinates %j/%j', (latitude, longitude) => {
    expect(validateStoreEstablishmentRegistry({ ...registry(), records: [{ ...entry(),
      location: { ...entry().location, latitude, longitude } }] }, AS_OF)).toBe(false);
  });

  it('checks only explicitly published bounds and permits a located fulfilment centre, never an online-store inference', () => {
    for (const [latitude, longitude] of [[27.98, -16.95], [28.65, -16.07]]) {
      expect(validateStoreEstablishmentRegistry({ ...registry(), records: [{ ...entry(), channel: 'fulfilment',
        location: { ...entry().location, latitude, longitude } }] }, AS_OF)).toBe(true);
    }
    expect(validateStoreEstablishmentRegistry({ ...registry(), records: [{ ...entry(), channel: 'online',
      location: { status: 'pending', reason: 'not-checked' } }] }, AS_OF)).toBe(true);
  });

  it.each(['2026-02-29', '2026-11-31', '2026-13-01', '2026-1-01', '0000-01-01', '26/11/2026', '2026-11-26T00:00:00Z'])(
    'rejects impossible or noncalendar date %s at every date boundary', date => {
      const value = registry();
      expect(validateStoreEstablishmentRegistry({ ...value, checkedOn: date }, AS_OF)).toBe(false);
      expect(validateStoreEstablishmentRegistry({ ...value, records: [{ ...entry(), source: { ...entry().source, checkedOn: date } }] }, AS_OF)).toBe(false);
      expect(validateStoreEstablishmentRegistry({ ...value, records: [{ ...entry(), location: { ...entry().location, checkedOn: date } }] }, AS_OF)).toBe(false);
      expect(validateStoreEstablishmentRegistry(value, date)).toBe(false);
    },
  );

  it('enforces location <= source <= registry <= explicit review date without pretending retrieval dates are observations', () => {
    const original = entry();
    const earlier = { ...original, source: { ...original.source, checkedOn: '2026-11-25' },
      location: { ...original.location, checkedOn: '2026-11-24' } };
    expect(validateStoreEstablishmentRegistry({ ...registry(), records: [earlier] }, AS_OF)).toBe(true);
    expect(validateStoreEstablishmentRegistry({ ...registry(), records: [{ ...earlier,
      location: { ...earlier.location, checkedOn: AS_OF } }] }, AS_OF)).toBe(false);
    expect(validateStoreEstablishmentRegistry({ ...registry(), records: [{ ...original,
      source: { ...original.source, checkedOn: '2026-11-27' } }] }, AS_OF)).toBe(false);
    expect(validateStoreEstablishmentRegistry({ ...registry(), checkedOn: '2026-11-27' }, AS_OF)).toBe(false);
  });

  it('uses the UTC date by default and rejects a future registry rather than rewriting its date', () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-11-25T23:59:59.000Z'));
      expect(validateStoreEstablishmentRegistry(registry())).toBe(false);
      vi.setSystemTime(new Date('2026-11-26T00:00:00.000Z'));
      expect(validateStoreEstablishmentRegistry(registry())).toBe(true);
    } finally { vi.useRealTimers(); }
  });

  it('caps the number of unique records at 500 before accepting a catalogue', () => {
    const records = Array.from({ length: 500 }, (_, index) => ({ ...entry(), id: `lidl-qa-${index}` }));
    expect(validateStoreEstablishmentRegistry({ ...registry(), records }, AS_OF)).toBe(true);
    expect(validateStoreEstablishmentRegistry({ ...registry(), records: [...records, { ...entry(), id: 'lidl-qa-500' }] }, AS_OF)).toBe(false);
  });

  it('rejects symbols, array extras and accessors without invoking their getters', () => {
    const value = registry();
    const getter = vi.fn(() => AS_OF);
    Object.defineProperty(value, 'checkedOn', { get: getter, enumerable: true });
    expect(validateStoreEstablishmentRegistry(value, AS_OF)).toBe(false);
    expect(getter).not.toHaveBeenCalled();
    const withSymbol = { ...registry(), [Symbol('hidden')]: true };
    expect(validateStoreEstablishmentRegistry(withSymbol, AS_OF)).toBe(false);
    const withArrayExtra = registry();
    Object.defineProperty(withArrayExtra.records, 'hidden', { value: true });
    expect(validateStoreEstablishmentRegistry(withArrayExtra, AS_OF)).toBe(false);
    const withIndexGetter = registry();
    Object.defineProperty(withIndexGetter.records, '0', { get: getter, enumerable: true });
    expect(validateStoreEstablishmentRegistry(withIndexGetter, AS_OF)).toBe(false);
    expect(getter).not.toHaveBeenCalled();
    const revoked = Proxy.revocable(registry(), {}); revoked.revoke();
    expect(validateStoreEstablishmentRegistry(revoked.proxy, AS_OF)).toBe(false);
  });
});

describe('explicit format selection preserves legacy chain favourites and source order', () => {
  it('never infers a format from the name, merges Dino formats or alters the registry', () => {
    const value: StoreEstablishmentRegistry = { ...registry(), records: [
      { ...entry('hiperdino-express'), name: 'HiperDino' }, entry('lidl'),
      entry('superdino'), entry('hiperdino'), { ...entry('lidl'), id: 'lidl-qa-second' },
    ] };
    const before = JSON.stringify(value);
    expect(validateStoreEstablishmentRegistry(value, AS_OF)).toBe(true);
    expect(establishmentsForFormat(value, 'lidl').map(record => record.id)).toEqual(['lidl-qa-location', 'lidl-qa-second']);
    expect(establishmentsForFormat(value, 'hiperdino-express').map(record => record.id)).toEqual(['hiperdino-express-qa-location']);
    expect(establishmentsForFormat(value, 'hiperdino')).toEqual([value.records[3]]);
    expect(establishmentsForFormat(value, 'superdino')).toEqual([value.records[2]]);
    expect(establishmentsForFormat(value, 'carrefour')).toEqual([]);
    expect(establishmentsForFormat(value, 'other')).toEqual([]);
    expect(Object.isFrozen(establishmentsForFormat(value, 'lidl'))).toBe(true);
    expect(JSON.stringify(value)).toBe(before);
  });
});
