import { describe, expect, it } from 'vitest';
import { readBasketQuoteRequest } from '../src/domain/basketQuoteValidation';
import { MAX_BASKET_LINES, MAX_BASKET_OFFERS } from '../src/domain/basketQuoteContracts';

// Synthetic calculations only. These are not catalogue data or retailer prices.
const target = () => ({ storeId: 'qa-store', formatId: 'lidl', channel: 'physical', postalCode: '38683', country: 'ES', island: 'tenerife' });
const need = () => ({ id: 'qa-line', productKey: 'qa-product', quantityMilli: 750000, unit: 'g' });
const offer = () => ({ id: 'qa-offer', lineId: 'qa-line', productKey: 'qa-product', equivalence: 'confirmed', target: target(),
  packQuantityMilli: 500000, unit: 'g', priceCents: 200, observedOn: '2026-11-27', validFrom: null, validTo: null, condition: 'unconditional' });
const request = () => ({ version: 1, basis: 'test-fixture', asOf: '2026-11-27', target: target(),
  costs: { additionalCents: 0, minimumGoodsCents: 0 }, lines: [need()], offers: [offer()] });
const invalid = (value: unknown) => expect(readBasketQuoteRequest(value).status).toBe('invalid-input');

describe('strict isolated basket input boundary', () => {
  it.each([undefined, null, false, 42, 'basket', [], new Date(), new Map(), () => request()])('rejects non-record input %j without throwing', value => invalid(value));

  it('rejects extra, missing, inherited and symbolic fields rather than trusting caller flags', () => {
    const value = request();
    invalid({ ...value, verified: true });
    invalid({ ...value, priceVerification: 'VERIFIED' });
    invalid({ ...value, [Symbol('extra')]: true });
    const { asOf: _omitted, ...missing } = value;
    invalid(missing);
    invalid(Object.assign(Object.create({ version: 1 }), missing));
    invalid({ ...value, version: 2 });
    invalid({ ...value, basis: 'official-current' });
    invalid({ ...value, costs: { ...value.costs, discount: 1 } });
    invalid({ ...value, lines: [{ ...need(), name: 'Unreviewed text' }] });
    invalid({ ...value, offers: [{ ...offer(), gtinVerified: true }] });
    invalid({ ...value, target: { ...target(), latitude: 28.2 } });
  });

  it('accepts inert null-prototype records and returns detached frozen values', () => {
    const input = request();
    const parsed = readBasketQuoteRequest(Object.assign(Object.create(null), input));
    if (parsed.status !== 'valid') throw new Error('Valid inert fixture rejected');
    expect(parsed.request).toEqual(input);
    expect(parsed.request.target).not.toBe(input.target);
    expect(parsed.request.lines[0]).not.toBe(input.lines[0]);
    expect(parsed.request.offers[0].target).not.toBe(input.offers[0].target);
    expect(Object.isFrozen(input)).toBe(false);
    expect(Object.isFrozen(parsed)).toBe(true);
    expect(Object.isFrozen(parsed.request.offers[0].target)).toBe(true);
    input.lines[0].quantityMilli = 1000;
    input.offers[0].target.postalCode = '38001';
    expect(parsed.request.lines[0].quantityMilli).toBe(750000);
    expect(parsed.request.offers[0].target.postalCode).toBe('38683');
    expect(JSON.parse(JSON.stringify(parsed.request))).toEqual(parsed.request);
  });

  it.each(['', ' white', 'white ', 'white\n', 'white\r', 'white\u2028', 'white\u2029', 'a\u0000b', 'a\u202Eb', '<script>', 'café', 'a'.repeat(129)])('rejects unsafe or ambiguous identity %j', id => {
    invalid({ ...request(), lines: [{ ...need(), id }] });
    invalid({ ...request(), target: { ...target(), storeId: id } });
  });

  it.each(['38683\n', '38683\r', '38683\u2028', ' 38683', '38683 ', '３８６８３', '28001', '38700', '38800', '38900', '3800', '380001'])('rejects invalid/out-of-scope declared postcode %j', postalCode => {
    expect(readBasketQuoteRequest({ ...request(), target: { ...target(), postalCode } })).toEqual({ status: 'invalid-input', reason: 'target' });
  });

  it.each([{ country: 'PT' }, { island: 'la-palma' }, { channel: 'warehouse' }, { formatId: 'carrefour' }, { formatId: '__proto__' }])('rejects unsupported declared targets %j', patch => invalid({ ...request(), target: { ...target(), ...patch } }));

  it.each([0, -1, -0, 0.5, Infinity, NaN, Number.MAX_SAFE_INTEGER, 1_000_000_001, '1000', null, undefined])('rejects invalid quantity %j', quantityMilli => {
    invalid({ ...request(), lines: [{ ...need(), quantityMilli }] });
    invalid({ ...request(), offers: [{ ...offer(), packQuantityMilli: quantityMilli }] });
  });

  it('requires whole units, supported dimensions and bounded integer thousandths', () => {
    invalid({ ...request(), lines: [{ ...need(), unit: 'ud', quantityMilli: 1500 }] });
    invalid({ ...request(), offers: [{ ...offer(), unit: 'ud', packQuantityMilli: 999 }] });
    invalid({ ...request(), lines: [{ ...need(), unit: 'litre' }] });
    expect(readBasketQuoteRequest({ ...request(), lines: [{ ...need(), unit: 'kg', quantityMilli: 1_000_000_000 }] }).status).toBe('valid');
  });

  it.each([-1, 0.1, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1, '100', undefined])('rejects malformed amounts %j instead of treating them as unknown', value => {
    invalid({ ...request(), offers: [{ ...offer(), priceCents: value }] });
    invalid({ ...request(), costs: { additionalCents: value, minimumGoodsCents: 0 } });
    invalid({ ...request(), costs: { additionalCents: 0, minimumGoodsCents: value } });
  });

  it('distinguishes explicit zero, unknown null and missing fields', () => {
    for (const priceCents of [0, null, Number.MAX_SAFE_INTEGER]) expect(readBasketQuoteRequest({ ...request(), offers: [{ ...offer(), priceCents }] }).status).toBe('valid');
    const parsed = readBasketQuoteRequest({ ...request(), costs: { additionalCents: -0, minimumGoodsCents: null } });
    if (parsed.status !== 'valid') throw new Error('Valid explicit zero rejected');
    expect(Object.is(parsed.request.costs.additionalCents, -0)).toBe(false);
  });

  it.each(['2026-02-29', '1900-02-29', '2026-04-31', '2026-00-01', '2026-11-31', '2026-1-01', '2026-11-27\n', '2026-11-27T00:00:00Z', '0000-01-01', '', undefined, new Date()])('rejects non-calendar dates %j', asOf => {
    invalid({ ...request(), asOf });
    invalid({ ...request(), offers: [{ ...offer(), observedOn: asOf }] });
  });

  it('accepts real leap dates and validates the declared validity interval', () => {
    expect(readBasketQuoteRequest({ ...request(), asOf: '2000-02-29' }).status).toBe('valid');
    invalid({ ...request(), offers: [{ ...offer(), validFrom: '2026-11-28', validTo: '2026-11-27' }] });
    invalid({ ...request(), offers: [{ ...offer(), validFrom: 'bad-date' }] });
    invalid({ ...request(), offers: [{ ...offer(), validTo: undefined }] });
    expect(readBasketQuoteRequest({ ...request(), offers: [{ ...offer(), observedOn: '2026-11-28' }] }).status).toBe('valid');
  });

  it('rejects duplicate needs/products/offers and orphan offers without implicit aggregation', () => {
    invalid({ ...request(), lines: [need(), { ...need(), productKey: 'other-product' }] });
    invalid({ ...request(), lines: [need(), { ...need(), id: 'different-line' }] });
    invalid({ ...request(), offers: [offer(), offer()] });
    invalid({ ...request(), offers: [{ ...offer(), lineId: 'absent-line' }] });
    invalid({ ...request(), offers: [{ ...offer(), equivalence: 'verified' }] });
    invalid({ ...request(), offers: [{ ...offer(), condition: 'coupon-accepted' }] });
  });

  it('bounds counts and rejects sparse, inherited, accessor and extended arrays', () => {
    const input = request();
    invalid({ ...input, lines: new Array(2) });
    invalid({ ...input, offers: new Array(1) });
    invalid({ ...input, lines: Object.assign([need()], { extra: true }) });
    invalid({ ...input, offers: Object.assign([offer()], { [Symbol('extra')]: true }) });
    const inherited = Object.create(Array.prototype, { 0: { value: need(), enumerable: true } });
    const sparse = new Array(1); Object.setPrototypeOf(sparse, inherited);
    invalid({ ...input, lines: sparse });
    const accessor = [need()]; let reads = 0;
    Object.defineProperty(accessor, '0', { enumerable: true, get() { reads++; throw new Error('Must not execute'); } });
    invalid({ ...input, lines: accessor }); expect(reads).toBe(0);
    expect(readBasketQuoteRequest({ ...input, lines: new Array(MAX_BASKET_LINES + 1) })).toEqual({ status: 'invalid-input', reason: 'limit' });
    expect(readBasketQuoteRequest({ ...input, offers: new Array(MAX_BASKET_OFFERS + 1) })).toEqual({ status: 'invalid-input', reason: 'limit' });
    expect(readBasketQuoteRequest({ ...input, offers: Array.from({ length: MAX_BASKET_OFFERS }, (_, index) => ({ ...offer(), id: `qa-offer-${index}` })) }).status).toBe('valid');
    expect(readBasketQuoteRequest({ ...input, offers: [], lines: Array.from({ length: MAX_BASKET_LINES }, (_, index) => ({ ...need(), id: `qa-line-${index}`, productKey: `qa-product-${index}` })) }).status).toBe('valid');
  });

  it('does not invoke field accessors or trust prototypes and proxy property reads', () => {
    let reads = 0; const input = request();
    Object.defineProperty(input, 'asOf', { enumerable: true, get() { reads++; throw new Error('Private text must not be read'); } });
    invalid(input); expect(reads).toBe(0);
    const inert = new Proxy(request(), { get() { reads++; throw new Error('No direct reads allowed'); } });
    expect(readBasketQuoteRequest(inert).status).toBe('valid'); expect(reads).toBe(0);
    const revoked = Proxy.revocable(request(), {}); revoked.revoke(); invalid(revoked.proxy);
    const hostileFailure = new Proxy({}, { getPrototypeOf() { throw new Error('Do not inspect thrown objects'); } });
    invalid(new Proxy({}, { getPrototypeOf() { throw hostileFailure; } }));
    const cycle = request(); invalid({ ...cycle, costs: cycle });
  });
});
