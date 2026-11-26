import { describe, expect, it } from 'vitest';
import { postalReferenceCatalog } from '../src/data/postalReferences';
import { findPostalReferences, validatePostalReferenceCatalog, type PostalReferenceCatalog } from '../src/domain/postalReferences';
import { findNearbyEstablishments } from '../src/domain/storeGeography';
import { storeEstablishmentRegistry } from '../src/data/storeEstablishments';
const catalogue: PostalReferenceCatalog = postalReferenceCatalog;

describe('B06.2 reviewed source facts', () => {
  it('publishes a partial catalogue with unique source identities', () => {
    expect(validatePostalReferenceCatalog(postalReferenceCatalog, '2026-11-26')).toBe(true);
    expect(postalReferenceCatalog.records).toHaveLength(209);
    expect(new Set(postalReferenceCatalog.records.map(item => item.id)).size).toBe(209);
    expect(new Set(postalReferenceCatalog.records.map(item => item.postalCode)).size).toBe(129);
    expect(new Set(postalReferenceCatalog.records.map(item => item.municipalityCode)).size).toBe(29);
    expect(postalReferenceCatalog.coverage).toBe('partial');
  });

  // Independently transcribed from populated-place P/PPL rows, rather than the
  // estimated postal points that incorrectly place Los Cristianos inland.
  it.each([
    ['place-2514741-38650', 'Los Cristianos', '38650', '38006', 28.05011, -16.72008],
    ['place-6692470-38683', 'Los Gigantes', '38683', '38040', 28.24361, -16.84153],
  ] as const)('keeps the reviewed geographic identity %s', (id, locality, postalCode, municipalityCode, latitude, longitude) => {
    const record = postalReferenceCatalog.records.find(item => item.id === id);
    expect(record).toMatchObject({ locality, postalCode, municipalityCode, latitude, longitude, method: 'reviewed-gazetteer' });
    expect(findPostalReferences(postalReferenceCatalog, postalCode, 'postal', '2026-11-26')).toMatchObject({ status: 'choices' });
  });

  it('keeps uncertain store 162 without a distance at the Los Gigantes reference', () => {
    const result = findNearbyEstablishments(storeEstablishmentRegistry, { latitude: 28.24361, longitude: -16.84153 }, 5, undefined, '2026-11-26');
    if (result.status !== 'ok') throw new Error('Reviewed search unavailable');
    expect(result.within.map(item => item.establishment.id)).toEqual(['dinosol-11', 'dinosol-166', 'lidl-santiago-quinto-centenario']);
    expect(result.pending.map(item => item.id)).toEqual(['dinosol-162']);
    expect(result.outside).toHaveLength(2);
    expect(result.within.every(item => item.distanceKm > 0 && item.distanceKm < 1)).toBe(true);
  });

  it('does not activate the bad airport reference or infer coverage on other islands', () => {
    expect(catalogue.records.some(item => /aeropuerto/i.test(item.locality) && item.postalCode === '38610')).toBe(false);
    for (const cp of ['35001', '38700', '38800', '38900']) {
      expect(findPostalReferences(postalReferenceCatalog, cp, 'postal', '2026-11-26')).toEqual({ status: 'outside-scope' });
    }
  });
});
