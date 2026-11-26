import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { storeEstablishmentRegistry } from '../src/data/storeEstablishments';
import { establishmentsForFormat, validateStoreEstablishmentRegistry, type StoreEstablishmentRegistry } from '../src/domain/storeEstablishments';

const registry: StoreEstablishmentRegistry = storeEstablishmentRegistry;
const manifest = JSON.parse(readFileSync(new URL('../referencias/tiendas/B06_1/source-manifest.json', import.meta.url), 'utf8'));

// Independent transcription of the five points explicitly published in the
// six individual official pages checked on 26 November. This is not a geocoder.
const publishedPoints = [
  ['lidl-santa-cruz-general-sur', 'lidl', 28.4217, -16.31916, '38107'],
  ['lidl-santiago-quinto-centenario', 'lidl', 28.23913, -16.8391, '38683'],
  ['dinosol-231', 'hiperdino', 28.4892, -16.33, '38206'],
  ['dinosol-166', 'superdino', 28.2409, -16.8392, '38683'],
  ['dinosol-11', 'hiperdino-express', 28.2465, -16.8423, '38683'],
] as const;

describe('reviewed establishment data and source evidence', () => {
  it('passes the production gate with an explicitly partial six-record catalogue', () => {
    expect(validateStoreEstablishmentRegistry(registry, '2026-11-26')).toBe(true);
    expect(registry.coverage).toBe('partial');
    expect(registry.records).toHaveLength(6);
    expect(new Set(registry.records.map(record => record.id)).size).toBe(6);
    expect(new Set(registry.records.map(record => record.formatId)).size).toBe(4);
  });

  it.each(publishedPoints)('retains the reviewed point and format of %s', (id, format, latitude, longitude, postcode) => {
    const record = registry.records.find(entry => entry.id === id);
    if (!record || record.location.status !== 'published') throw new Error('Reviewed point missing.');
    expect(record.formatId).toBe(format);
    expect(record.location.latitude).toBe(latitude);
    expect(record.location.longitude).toBe(longitude);
    expect(record.location.sourceUrl).toBe(record.source.url);
    expect(record.address.postalCode).toBe(postcode);
    expect(record.address.country).toBe('ES');
    expect(record.address.island).toBe('tenerife');
  });

  it('keeps the source postcode conflict without activating its observed coordinates', () => {
    const record = registry.records.find(entry => entry.id === 'dinosol-162');
    if (!record) throw new Error('Pending source record missing.');
    expect(record.address.postalCode).toBe('38436');
    expect(record.address.municipality).toBe('Santiago del Teide');
    expect(record.location).toEqual({ status: 'pending', reason: 'conflicting-source' });
    const reference = manifest.sources.find((source: { recordId: string }) => source.recordId === record.id);
    expect(reference.locationEvidence.observedLatitude).toBe(28.2351);
    expect(reference.locationEvidence.observedLongitude).toBe(-16.8325);
    expect(reference.locationEvidence.runtimeStatus).toBe('pending');
  });

  it('does not turn incomplete source coverage into inferred establishments or prices', () => {
    expect(establishmentsForFormat(registry, 'aldi')).toEqual([]);
    expect(establishmentsForFormat(registry, 'mercadona')).toEqual([]);
    expect(establishmentsForFormat(registry, 'carrefour')).toEqual([]);
    expect(establishmentsForFormat(registry, 'other')).toEqual([]);
    for (const record of registry.records) {
      expect(record.channel).toBe('physical');
      expect(record.priceCoverage).toBe('NO_VERIFICADA');
      expect(record.source.rights).toBe('FACTUAL_REFERENCE_ONLY');
    }
  });

  it('binds each displayed factual reference to its individual official HTTP receipt', () => {
    expect(manifest.sources).toHaveLength(6);
    expect(manifest.rawHtmlPublished).toBe(false);
    expect(manifest.cookiesTokensScriptsPhoneNumbersProductsAndPricesPublished).toBe(false);
    expect(manifest.communityOrHistoricalPriceSourcesUsed).toBe(false);
    for (const record of registry.records) {
      const sources = manifest.sources.filter((source: { recordId: string }) => source.recordId === record.id);
      expect(sources).toHaveLength(1);
      const source = sources[0];
      expect(source.source).toEqual(record.source);
      expect(source.facts.formatId).toBe(record.formatId);
      expect(source.facts.channel).toBe(record.channel);
      expect(source.facts.address).toEqual(record.address);
      expect(source.http.status).toBe(200);
      expect(source.http.url).toBe(record.source.url);
      expect(source.http.finalURL).toBe(record.source.url);
      expect(source.http.checkedAt).toMatch(/^2026-11-26T/);
      expect(source.http.sha256).toMatch(/^[a-f\d]{64}$/);
      expect(source.http.bytes).toBeLessThan(2 * 1024 * 1024);
      if (record.location.status === 'published') {
        expect(source.locationEvidence.runtimeStatus).toBe('published');
        expect(source.locationEvidence.observedLatitude).toBe(record.location.latitude);
        expect(source.locationEvidence.observedLongitude).toBe(record.location.longitude);
      }
    }
  });
});
