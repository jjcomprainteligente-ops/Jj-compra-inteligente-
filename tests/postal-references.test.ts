import { describe, expect, it, vi } from 'vitest';
import {
  findPostalReferences, postalReferenceById, validatePostalReferenceCatalog,
  type PostalReference, type PostalReferenceCatalog, type PostalReferenceLookupResult,
} from '../src/domain/postalReferences';

const AS_OF = '2026-11-26';
const postalSource = 'https://download.geonames.org/export/zip/ES.zip';
const gazetteerSource = 'https://download.geonames.org/export/dump/ES.zip';
const attribution = { name: 'GeoNames' as const, url: 'https://www.geonames.org/' as const,
  license: 'CC-BY-4.0' as const, licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' as const, adapted: true as const };

function hash(index: number) { return index.toString(16).padStart(16, '0') + 'a'.repeat(48); }
// Synthetic reference records test the wire contract, not a newly geocoded place.
function postal(index = 1, postalCode = '38650', locality = 'Playa De Los Cristianos', municipality = 'Arona') {
  const sourceId = hash(index);
  return { id: `postal-${postalCode}-${sourceId.slice(0, 16)}`, postalCode, locality, municipality,
    municipalityCode: '38006', country: 'ES' as const, island: 'tenerife' as const,
    latitude: 28.05, longitude: -16.72, method: 'postal-geonameid' as const, sourceId, sourceUrl: postalSource };
}
function gazetteer(sourceId = '2514741', postalCode = '38650', locality = 'Los Cristianos') {
  return { ...postal(), id: `place-${sourceId}-${postalCode}`, postalCode, locality,
    method: 'reviewed-gazetteer' as const, sourceId, sourceUrl: gazetteerSource };
}
function catalog(records: readonly PostalReference[] = [postal()]) {
  return { version: 1 as const, checkedOn: AS_OF, coverage: 'partial' as const, attribution: { ...attribution }, records };
}
function choices(result: PostalReferenceLookupResult) {
  if (result.status !== 'choices') throw new Error(`Expected reference choices, received ${result.status}.`);
  return result;
}

describe('strict approximate postal reference catalogue', () => {
  it('accepts both explicit source methods and an empty partial catalogue', () => {
    expect(validatePostalReferenceCatalog(catalog([postal(), gazetteer()]), AS_OF)).toBe(true);
    expect(validatePostalReferenceCatalog(catalog([]), AS_OF)).toBe(true);
    expect(validatePostalReferenceCatalog(Object.freeze(catalog(Object.freeze([Object.freeze(postal())]))), AS_OF)).toBe(true);
    expect(validatePostalReferenceCatalog(Object.assign(Object.create(null), catalog()), AS_OF)).toBe(true);
  });

  it.each([
    null, undefined, [], 'catalogue', 1, true, {}, { ...catalog(), version: 2 },
    { ...catalog(), version: '1' }, { ...catalog(), coverage: 'complete' },
    { ...catalog(), hiddenRecovery: true }, { ...catalog(), records: {} },
    { ...catalog(), records: new Array(1) }, Object.create(catalog()),
    { ...catalog(), records: [Object.create(postal())] },
    { ...catalog(), records: [{ ...postal(), distanceKm: 0 }] },
    { ...catalog(), records: Object.assign([postal()], { extra: true }) },
    { ...catalog(), records: Object.assign([postal()], { [Symbol('hidden')]: 1 }) },
    { ...catalog(), [Symbol('hidden')]: true },
  ])('rejects malformed, inherited, unknown-version or extra catalogue fields %j', value => {
    expect(validatePostalReferenceCatalog(value, AS_OF)).toBe(false);
    expect(findPostalReferences(value, '38650', 'postal', AS_OF)).toEqual({ status: 'unavailable' });
  });

  it.each([
    { ...attribution, name: 'Other data' }, { ...attribution, license: 'public-domain' },
    { ...attribution, adapted: false }, { ...attribution, url: 'http://www.geonames.org/' },
    { ...attribution, url: 'https://www.geonames.org.evil.test/' },
    { ...attribution, licenseUrl: 'https://creativecommons.org/licenses/by/3.0/' },
    { ...attribution, token: 'qa-placeholder' }, Object.create(attribution), null,
  ])('retains the complete fixed attribution rather than accepting %j', value => {
    expect(validatePostalReferenceCatalog({ ...catalog(), attribution: value }, AS_OF)).toBe(false);
  });

  it.each([
    { ...postal(), postalCode: '38700' }, { ...postal(), postalCode: '35001' },
    { ...postal(), postalCode: 38650 }, { ...postal(), postalCode: '٣٨٦٥٠' },
    { ...postal(), municipalityCode: '38037' }, { ...postal(), municipalityCode: '38036' },
    { ...postal(), municipalityCode: '38048' }, { ...postal(), municipalityCode: 38006 },
    { ...postal(), country: 'FR' }, { ...postal(), island: 'la-palma' },
    { ...postal(), latitude: 28.1, longitude: -15.4 }, { ...postal(), latitude: 28.68, longitude: -17.76 },
    { ...postal(), latitude: NaN }, { ...postal(), longitude: Infinity },
    { ...postal(), latitude: '28.05' }, { ...postal(), method: 'nearest-postcode-average' },
  ])('rejects unreviewed country, municipality, postcode, point or inference %j', reference => {
    expect(validatePostalReferenceCatalog(catalog([reference as unknown as PostalReference]), AS_OF)).toBe(false);
  });

  it.each([
    '38001', '38004', '38005', '38006', '38010', '38011', '38012', '38015', '38017', '38018',
    '38019', '38020', '38022', '38023', '38025', '38026', '38028', '38031', '38032', '38034',
    '38035', '38038', '38039', '38040', '38041', '38042', '38043', '38044', '38046', '38051', '38052',
  ])('accepts the explicit Tenerife municipality-code scope %s without inferring a name', municipalityCode => {
    expect(validatePostalReferenceCatalog(catalog([{ ...postal(), municipalityCode }]), AS_OF)).toBe(true);
  });

  it.each(['', ' leading', 'trailing ', '<script>', '&lt;script&gt;', '\nline', 'bidi\u202etext',
    'zero\u200bwidth', 'join\u200dtext', '\ud800', 'x'.repeat(181)])('rejects unsafe/unbounded locality %j', locality => {
    expect(validatePostalReferenceCatalog(catalog([{ ...postal(), locality }]), AS_OF)).toBe(false);
  });

  it('bounds municipality separately while retaining accent and punctuation facts', () => {
    expect(validatePostalReferenceCatalog(catalog([{ ...postal(), locality: 'Añaza — San Juan (QA)', municipality: 'San Cristóbal de La Laguna' }]), AS_OF)).toBe(true);
    expect(validatePostalReferenceCatalog(catalog([{ ...postal(), municipality: 'x'.repeat(121) }]), AS_OF)).toBe(false);
    expect(validatePostalReferenceCatalog(catalog([{ ...postal(), municipality: '123' }]), AS_OF)).toBe(false);
  });

  it.each([
    { ...postal(), sourceId: hash(1).toUpperCase() }, { ...postal(), sourceId: hash(1).slice(1) },
    { ...postal(), id: postal().id.toUpperCase() }, { ...postal(), id: `postal-38683-${hash(1).slice(0, 16)}` },
    { ...postal(), id: `postal-38650-${hash(2).slice(0, 16)}` },
    { ...postal(), sourceUrl: gazetteerSource }, { ...postal(), sourceUrl: postalSource + '?token=qa' },
    { ...postal(), sourceUrl: 'https://download.geonames.org.evil.test/export/zip/ES.zip' },
    { ...gazetteer(), sourceId: '02514741', id: 'place-02514741-38650' },
    { ...gazetteer(), sourceId: '0', id: 'place-0-38650' },
    { ...gazetteer(), sourceId: '12345678901', id: 'place-12345678901-38650' },
    { ...gazetteer(), sourceId: '２５１４７４１' }, { ...gazetteer(), sourceId: 2514741 },
    { ...gazetteer(), id: 'place-2514741-38683' }, { ...gazetteer(), sourceUrl: postalSource },
  ])('requires a canonical source identity and the method-specific exact URL %j', reference => {
    expect(validatePostalReferenceCatalog(catalog([reference as unknown as PostalReference]), AS_OF)).toBe(false);
  });

  it('rejects duplicate IDs, prefix collisions and reuse of one postal raw-line hash for another CP', () => {
    expect(validatePostalReferenceCatalog(catalog([postal(), postal()]), AS_OF)).toBe(false);
    const prefixCollision = { ...postal(), sourceId: hash(1).slice(0, 16) + 'b'.repeat(48) };
    expect(validatePostalReferenceCatalog(catalog([postal(), prefixCollision]), AS_OF)).toBe(false);
    const reused = { ...postal(), postalCode: '38683', id: `postal-38683-${hash(1).slice(0, 16)}` };
    expect(validatePostalReferenceCatalog(catalog([postal(), reused]), AS_OF)).toBe(false);
    // A reviewed place may legitimately be associated with more than one CP.
    expect(validatePostalReferenceCatalog(catalog([gazetteer(), gazetteer('2514741', '38683')]), AS_OF)).toBe(true);
  });

  it('does not deduplicate distinct names, source methods or IDs because their points coincide', () => {
    const value = catalog([postal(1, '38683', 'Puerto De Santiago'), postal(2, '38683', 'Acantilados De Los Gigantes'),
      gazetteer('6692470', '38683', 'Los Gigantes')]);
    expect(validatePostalReferenceCatalog(value, AS_OF)).toBe(true);
    expect(choices(findPostalReferences(value, '38683', 'postal', AS_OF)).references).toHaveLength(3);
  });

  it('rejects getters and hostile/revoked objects without executing accessors', () => {
    let reads = 0;
    const getter = { ...catalog(), get records() { reads++; return [postal()]; } };
    const rowGetter = { ...postal(), get latitude() { reads++; return 28.05; } };
    const arrayGetter: PostalReference[] = [];
    Object.defineProperty(arrayGetter, '0', { enumerable: true, get() { reads++; return postal(); } });
    const revoked = Proxy.revocable(catalog(), {}); revoked.revoke();
    for (const value of [getter, catalog([rowGetter]), catalog(arrayGetter), revoked.proxy]) {
      expect(validatePostalReferenceCatalog(value, AS_OF)).toBe(false);
      expect(findPostalReferences(value, '38650', 'postal', AS_OF)).toEqual({ status: 'unavailable' });
    }
    expect(reads).toBe(0);
  });

  it('uses descriptor snapshots without invoking later Proxy property reads', () => {
    let reads = 0;
    const value = new Proxy(catalog(), { get() { reads++; throw new Error('No late field read.'); } });
    expect(validatePostalReferenceCatalog(value, AS_OF)).toBe(true);
    expect(choices(findPostalReferences(value, '38650', 'postal', AS_OF)).references).toHaveLength(1);
    expect(reads).toBe(0);
  });

  it.each(['2026-02-29', '2026-11-31', '0000-01-01', '26/11/2026', '2026-11-26T00:00:00Z'])(
    'rejects impossible/noncalendar catalogue and review dates %s', date => {
      expect(validatePostalReferenceCatalog({ ...catalog(), checkedOn: date }, AS_OF)).toBe(false);
      expect(validatePostalReferenceCatalog(catalog(), date)).toBe(false);
    },
  );

  it('uses the UTC date gate and does not silently rewrite a future source date', () => {
    expect(validatePostalReferenceCatalog(catalog(), '2026-11-25')).toBe(false);
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date('2026-11-25T23:59:59Z'));
      expect(findPostalReferences(catalog(), '38650', 'postal')).toEqual({ status: 'unavailable' });
      vi.setSystemTime(new Date('2026-11-26T00:00:00Z'));
      expect(findPostalReferences(catalog(), '38650', 'postal').status).toBe('choices');
    } finally { vi.useRealTimers(); }
  });

  it('accepts 1000 references but rejects an oversized/sparse array before treating it as coverage', () => {
    const rows = Array.from({ length: 1000 }, (_, index) => postal(index + 1));
    expect(validatePostalReferenceCatalog(catalog(rows), AS_OF)).toBe(true);
    expect(validatePostalReferenceCatalog(catalog([...rows, postal(1001)]), AS_OF)).toBe(false);
    expect(validatePostalReferenceCatalog({ ...catalog(), records: new Array(100_000) }, AS_OF)).toBe(false);
  });
});

describe('explicit postal and locality reference choices', () => {
  const value = catalog([postal(1), gazetteer(), postal(2, '38683', 'Puerto De Santiago', 'Santiago del Teide'),
    gazetteer('6692470', '38683', 'Los Gigantes')]);

  it.each(['38650', ' 38650 ', '      38650     '])('matches an exact ASCII Spanish CP %j without choosing a point', input => {
    const result = choices(findPostalReferences(value, input, 'postal', AS_OF));
    expect(result.references).toHaveLength(2);
    expect(result.references.map(reference => reference.locality)).toEqual(['Los Cristianos', 'Playa De Los Cristianos']);
    expect(result.truncated).toBe(false);
    expect(result).not.toHaveProperty('selected'); expect(result).not.toHaveProperty('origin');
  });

  it('returns choices even for one source and never substitutes a nearby postcode for missing data', () => {
    const result = choices(findPostalReferences(catalog([postal()]), '38650', 'postal', AS_OF));
    expect(result.references).toHaveLength(1); expect(result).not.toHaveProperty('selected');
    expect(findPostalReferences(value, '38651', 'postal', AS_OF)).toEqual({ status: 'no-reference' });
    expect(findPostalReferences(value, '38000', 'postal', AS_OF)).toEqual({ status: 'no-reference' });
  });

  it.each(['01001', '35001', '38700', '38800', '38900', '28001', '52000'])(
    'separates an outside-scope postal range %s from malformed input, without claiming existence', input => {
      expect(findPostalReferences(value, input, 'postal', AS_OF)).toEqual({ status: 'outside-scope' });
    },
  );

  it.each(['', ' ', '00000', '53000', '99999', '3865', '386500', '38a50', '386.50', '٣٨٦٥٠', '３８６５０',
    '\t38650', '38650\n', '\u00a038650', '38650\u200b', '12345678901234567', null, undefined, 38650, {}, []])('rejects invalid postal input %j', input => {
    expect(findPostalReferences(value, input, 'postal', AS_OF)).toEqual({ status: 'invalid-input' });
  });

  it.each(['Los Cristianos', 'LOS CRISTI', 'crist', '  los cristi  ', 'los-cristi', '(los), cristi'])('matches locality word prefixes without guessing %j', input => {
    const result = choices(findPostalReferences(value, input, 'locality', AS_OF));
    expect(result.references.map(reference => reference.locality)).toEqual(['Los Cristianos', 'Playa De Los Cristianos']);
    expect(result.references.every(reference => reference.latitude === 28.05 && reference.longitude === -16.72)).toBe(true);
  });

  it('matches municipality words independently, and never combines partial matches from two fields', () => {
    expect(choices(findPostalReferences(value, 'santi tei', 'locality', AS_OF)).references.map(reference => reference.locality))
      .toEqual(['Puerto De Santiago']);
    expect(findPostalReferences(value, 'cristianos arona', 'locality', AS_OF)).toEqual({ status: 'no-reference' });
    expect(findPostalReferences(value, 'puerto arona', 'locality', AS_OF)).toEqual({ status: 'no-reference' });
  });

  it('folds canonical accents without approximate spelling, transliteration or coordinate inference', () => {
    const accents = catalog([postal(1, '38200', 'San Cristóbal de La Laguna', 'San Cristóbal de La Laguna'),
      postal(2, '38111', 'Añaza', 'Santa Cruz de Tenerife')]);
    expect(choices(findPostalReferences(accents, 'CRISTOBAL LAG', 'locality', AS_OF)).references[0].locality).toBe('San Cristóbal de La Laguna');
    expect(choices(findPostalReferences(accents, 'anaza', 'locality', AS_OF)).references[0].locality).toBe('Añaza');
    expect(choices(findPostalReferences(accents, 'An\u0303aza', 'locality', AS_OF)).references[0].locality).toBe('Añaza');
    expect(findPostalReferences(accents, 'cristbol', 'locality', AS_OF)).toEqual({ status: 'no-reference' });
    expect(findPostalReferences(accents, 'Аnaza', 'locality', AS_OF)).toEqual({ status: 'no-reference' });
  });

  it.each(['', ' ', 'a', 'e\u0301', '\u0301\u0301', '...', '<script>', '&lt;script&gt;', 'cristi\u202e',
    'cristi\u200b', 'cristi\u200d', 'cristi\n', '\ud800x', '123', 'Santa2', 'Santa😀', 'x'.repeat(81), null, 123])('rejects unsafe or empty locality input %j before matching', input => {
    expect(findPostalReferences(value, input, 'locality', AS_OF)).toEqual({ status: 'invalid-input' });
  });

  it('sorts by normalized locality, then CP and canonical ID, before limiting to 30', () => {
    const rows = Array.from({ length: 35 }, (_, index) => postal(index + 1, '38650', `Localidad ${String.fromCharCode(65 + index % 26)}`));
    const ordered = choices(findPostalReferences(catalog(rows), 'localidad', 'locality', AS_OF));
    const reversed = choices(findPostalReferences(catalog([...rows].reverse()), 'localidad', 'locality', AS_OF));
    expect(ordered.references).toHaveLength(30); expect(ordered.truncated).toBe(true);
    expect(reversed).toEqual(ordered);
    const sameName = catalog([postal(2, '38683', 'Árbol'), postal(3, '38650', 'Arbol'), postal(1, '38650', 'Arbol')]);
    expect(choices(findPostalReferences(sameName, 'arbol', 'locality', AS_OF)).references.map(reference => reference.id))
      .toEqual([postal(1).id, postal(3).id, postal(2, '38683').id]);
    expect(choices(findPostalReferences(catalog(rows.slice(0, 30)), 'localidad', 'locality', AS_OF)).truncated).toBe(false);
  });

  it('returns frozen independent choices and leaves source order, attribution and coordinates unchanged', () => {
    const original = postal(), input = catalog([original]); const before = JSON.stringify(input);
    const result = choices(findPostalReferences(input, '38650', 'postal', AS_OF));
    expect(JSON.stringify(input)).toBe(before);
    expect(Object.isFrozen(input)).toBe(false); expect(Object.isFrozen(original)).toBe(false);
    expect(Object.isFrozen(result)).toBe(true); expect(Object.isFrozen(result.references)).toBe(true);
    expect(Object.isFrozen(result.references[0])).toBe(true); expect(result.references[0]).not.toBe(original);
    original.latitude = 28.2; original.locality = 'Changed after search';
    expect(result.references[0].latitude).toBe(28.05); expect(result.references[0].locality).toBe('Playa De Los Cristianos');
  });

  it('reports no-reference for an empty partial catalogue and rejects an unknown search mode', () => {
    expect(findPostalReferences(catalog([]), '38650', 'postal', AS_OF)).toEqual({ status: 'no-reference' });
    expect(findPostalReferences(value, '38650', 'nearby' as 'postal', AS_OF)).toEqual({ status: 'invalid-input' });
  });
});

describe('bounded lookup of an explicitly selected reference ID', () => {
  const value: PostalReferenceCatalog = catalog([postal(), gazetteer()]);

  it('returns only the requested ID as a frozen reference, without an implicit first choice', () => {
    const reference = postalReferenceById(value, gazetteer().id);
    expect(reference).toEqual(gazetteer()); expect(Object.isFrozen(reference)).toBe(true);
    expect(reference).not.toBe(value.records[1]);
    expect(postalReferenceById(value, `place-999-38650`)).toBeNull();
    expect(postalReferenceById(catalog([]), postal().id)).toBeNull();
  });

  it.each([null, undefined, 1, {}, [], '', ' ', '38650', 'constructor', '__proto__',
    ` ${postal().id}`, `${postal().id}\n`, 'x'.repeat(81), 'place-02514741-38650', 'place-0-38650',
    'place-2514741-38700', 'postal-38650-' + 'F'.repeat(16)])('rejects invalid/unselected ID %j', id => {
    expect(postalReferenceById(value, id)).toBeNull();
  });

  it('retains the caller-applied explicit review date rather than replacing an ID from another catalogue', () => {
    const reviewed = { ...catalog(), checkedOn: '2030-01-01' };
    expect(validatePostalReferenceCatalog(reviewed, '2030-01-01')).toBe(true);
    expect(postalReferenceById(reviewed, postal().id)?.id).toBe(postal().id);
    expect(postalReferenceById({ ...value, records: [gazetteer()] }, postal().id)).toBeNull();
  });

  it('fails closed on malformed caller data and does not invoke a records getter', () => {
    let reads = 0;
    const getter = { ...value, get records() { reads++; return [postal()]; } };
    expect(postalReferenceById(getter, postal().id)).toBeNull(); expect(reads).toBe(0);
    expect(postalReferenceById({ ...value, records: [postal(), postal()] }, postal().id)).toBeNull();
  });
});
