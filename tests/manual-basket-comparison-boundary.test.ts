import { describe, expect, it } from 'vitest';
import { quoteSingleStoreBasket } from '../src/domain/basketQuote';
import {
  MAX_BASKET_LINES,
  type BasketQuoteRequest,
} from '../src/domain/basketQuoteContracts';
import {
  compareManualBasketRequests,
  type ManualBasketComparisonInput,
  type ManualBasketComparisonInputIssue,
} from '../src/domain/manualBasketComparison';

// Synthetic manual input; no catalogue, commercial verification or real price.
const request = (): BasketQuoteRequest => {
  const target = { storeId: 'manual-store', formatId: 'lidl', channel: 'physical',
    postalCode: '38001', country: 'ES', island: 'tenerife' } as const;
  return {
    version: 1, basis: 'manual', asOf: '2026-11-27', target,
    costs: { additionalCents: 0, minimumGoodsCents: 0 },
    lines: [{ id: 'line-1', productKey: 'product-1', quantityMilli: 1000, unit: 'ud' }],
    offers: [{ id: 'offer-1', lineId: 'line-1', productKey: 'product-1', equivalence: 'confirmed',
      target, packQuantityMilli: 1000, unit: 'ud', priceCents: 125, observedOn: '2026-11-27',
      validFrom: null, validTo: null, condition: 'unconditional' }],
  };
};
const input = (): ManualBasketComparisonInput => ({
  first: request(), second: request(), confirmedLineIds: ['line-1'], differentStoresConfirmed: true,
});
const invalid = (value: unknown, reason: ManualBasketComparisonInputIssue) => {
  const result = compareManualBasketRequests(value);
  expect(result).toEqual({ status: 'invalid-input', reason });
  expect(Object.isFrozen(result)).toBe(true);
};

describe('manual basket comparison input boundary', () => {
  it.each([undefined, null, true, 1, 'private source text', [], new Date(), new Map(), () => input()])(
    'rejects non-record input without throwing (%j)', value => invalid(value, 'shape'),
  );

  it('requires exactly four own enumerable data properties, excluding claimed quotes and totals', () => {
    const value = input();
    invalid({ ...value, totalCents: 0 }, 'shape');
    invalid({ ...value, firstQuote: quoteSingleStoreBasket(value.first) }, 'shape');
    invalid({ ...value, [Symbol('private text')]: true }, 'shape');
    const { first: _missing, ...withoutFirst } = value;
    invalid(withoutFirst, 'shape');
    invalid(Object.assign(Object.create({ first: value.first }), withoutFirst), 'shape');
    const hidden = { ...value };
    Object.defineProperty(hidden, 'confirmedLineIds', { value: value.confirmedLineIds, enumerable: false });
    invalid(hidden, 'shape');
    invalid({ ...value, differentStoresConfirmed: 'true' }, 'shape');
    invalid({ ...value, differentStoresConfirmed: 1 }, 'shape');
  });

  it('does not invoke getters on top-level fields or nested requests', () => {
    for (const key of ['first', 'second', 'confirmedLineIds', 'differentStoresConfirmed']) {
      let reads = 0;
      const value = input();
      Object.defineProperty(value, key, { enumerable: true, get() { reads++; throw new Error('Private getter text'); } });
      invalid(value, 'shape');
      expect(reads).toBe(0);
    }
    let requestReads = 0;
    const first = request();
    Object.defineProperty(first, 'asOf', { enumerable: true, get() { requestReads++; throw new Error('Private date'); } });
    invalid({ ...input(), first }, 'requests');
    expect(requestReads).toBe(0);
  });

  it('never follows a prototype accessor as a required property', () => {
    let reads = 0;
    const value = input();
    const prototype = Object.create(Object.prototype, {
      first: { get() { reads++; throw new Error('Private inherited text'); } },
    });
    const { first: _missing, ...rest } = value;
    invalid(Object.assign(Object.create(prototype), rest), 'shape');
    expect(reads).toBe(0);
  });

  it('accepts null-prototype records without freezing or sharing caller objects', () => {
    const value = input();
    const result = compareManualBasketRequests(Object.assign(Object.create(null), value));
    expect(result.status).toBe('compared');
    if (result.status !== 'compared') throw new Error('Valid inert record rejected');
    expect(Object.isFrozen(value.first)).toBe(false);
    expect(result.first.target).not.toBe(value.first.target);
    expect(result.first.lines).not.toBe(value.first.lines);
    expect(result.first.lines[0]).not.toBe(value.first.lines[0]);
    expect(result.second.target).not.toBe(value.second.target);
  });

  it('uses the existing reader for invalid requests and rejects supplied quote objects', () => {
    const value = input();
    invalid({ ...value, first: quoteSingleStoreBasket(value.first) }, 'requests');
    invalid({ ...value, second: { ...value.second, payableTotalCents: 0 } }, 'requests');
    invalid({ ...value, first: { ...value.first, costs: { additionalCents: -1, minimumGoodsCents: 0 } } }, 'requests');
    invalid({ ...value, second: { ...value.second, target: { ...value.second.target, country: 'PT' } } }, 'requests');
    invalid({ ...value, first: { ...value.first, target: { ...value.first.target, island: 'la-palma' } } }, 'requests');
    invalid({ ...value, second: { ...value.second, lines: new Array(MAX_BASKET_LINES + 1) } }, 'requests');
    invalid({ ...value, first: { ...value.first, offers: Object.assign([...value.first.offers], { extra: true }) } }, 'requests');
  });

  it.each(['first', 'second'] as const)('requires manual basis for the %s request', side => {
    const value = input();
    invalid({ ...value, [side]: { ...value[side], basis: 'test-fixture' } }, 'basis');
  });

  it('requires exact needs by line ID, rather than equal count or unit conversion', () => {
    const value = input();
    const line = value.second.lines[0];
    for (const patch of [
      { id: 'other-line' }, { productKey: 'other-product' }, { quantityMilli: 2000 }, { unit: 'g' },
    ]) {
      // No offers keeps a changed line ID a valid request for the needs gate.
      invalid({ ...value, second: { ...value.second, lines: [{ ...line, ...patch }], offers: [] } }, 'needs');
    }
    invalid({ ...value, second: { ...value.second, lines: [], offers: [] } }, 'needs');
  });

  it('requires the same declared calendar day and channel', () => {
    const value = input();
    invalid({ ...value, second: { ...value.second, asOf: '2026-11-28' } }, 'day');
    invalid({ ...value, second: { ...value.second, target: { ...value.second.target, channel: 'online' } } }, 'channel');
  });

  it.each([undefined, null, false, 'line-1', {}, ['unknown'], ['line-1', 'line-1'], [1], [new String('line-1')]])(
    'rejects malformed, unknown and duplicate attestations (%j)', confirmedLineIds => {
      invalid({ ...input(), confirmedLineIds }, 'confirmations');
    },
  );

  it('rejects sparse, inherited, accessor, hidden, extended and symbolic confirmation arrays', () => {
    const sparse = new Array(1);
    const inherited = ['line-1'];
    Object.setPrototypeOf(inherited, Object.create(Array.prototype));
    const accessor = ['line-1']; let reads = 0;
    Object.defineProperty(accessor, '0', { enumerable: true, get() { reads++; throw new Error('Private line'); } });
    const hidden = ['line-1'];
    Object.defineProperty(hidden, '0', { value: 'line-1', enumerable: false });
    for (const confirmedLineIds of [sparse, inherited, accessor, hidden,
      Object.assign(['line-1'], { extra: true }), Object.assign(['line-1'], { [Symbol('extra')]: true }),
      new Array(MAX_BASKET_LINES + 1),
    ]) invalid({ ...input(), confirmedLineIds }, 'confirmations');
    expect(reads).toBe(0);
  });

  it('accepts exactly 200 dense confirmed lines without clipping', () => {
    const value = input();
    const lines = Array.from({ length: MAX_BASKET_LINES }, (_, index) => ({
      id: `line-${index}`, productKey: `product-${index}`, quantityMilli: 1000, unit: 'ud' as const,
    }));
    const result = compareManualBasketRequests({
      ...value, first: { ...value.first, lines, offers: [] }, second: { ...value.second, lines, offers: [] },
      confirmedLineIds: lines.map(line => line.id),
    });
    expect(result).toMatchObject({ status: 'compared', outcome: 'not-comparable', differenceCents: null,
      reasons: ['first-not-qualified', 'second-not-qualified'],
      first: { coverage: { totalLines: MAX_BASKET_LINES } }, second: { coverage: { totalLines: MAX_BASKET_LINES } } });
  });

  it('uses descriptors rather than Proxy property reads', () => {
    let reads = 0;
    const inertProxy = <T extends object>(value: T): T => new Proxy(value, {
      get() { reads++; throw new Error('Private direct property read'); },
    });
    const value = input();
    const result = compareManualBasketRequests(inertProxy({
      ...value, first: inertProxy(value.first), second: inertProxy(value.second),
      confirmedLineIds: inertProxy(['line-1']),
    }));
    expect(result).toMatchObject({ status: 'compared', outcome: 'tie', differenceCents: 0 });
    expect(reads).toBe(0);
  });

  it('catches revoked and throwing Proxies without reflecting private failures', () => {
    const revoked = Proxy.revocable({}, {}); revoked.revoke();
    invalid(revoked.proxy, 'shape');
    invalid({ ...input(), first: revoked.proxy }, 'requests');
    invalid({ ...input(), confirmedLineIds: revoked.proxy }, 'confirmations');
    const privateFailure = new Proxy({}, {
      get() { throw new Error('Do not reflect thrown values'); },
      getPrototypeOf() { throw new Error('Do not inspect thrown values'); },
    });
    const throwing = new Proxy({}, { getPrototypeOf() { throw privateFailure; } });
    invalid(throwing, 'shape');
    invalid({ ...input(), second: throwing }, 'requests');
    const throwingArray = new Proxy(['line-1'], { ownKeys() { throw privateFailure; } });
    invalid({ ...input(), confirmedLineIds: throwingArray }, 'confirmations');
  });

  it('returns JSON data deeply frozen and detached, while leaving caller data mutable', () => {
    const value = input();
    const before = JSON.stringify(value);
    const result = compareManualBasketRequests(value);
    expect(JSON.stringify(value)).toBe(before);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    const assertFrozen = (node: unknown): void => {
      if (node === null || typeof node !== 'object') return;
      expect(Object.isFrozen(node)).toBe(true);
      for (const child of Object.values(node)) assertFrozen(child);
    };
    assertFrozen(result);
    expect(Object.isFrozen(value)).toBe(false);
    expect(Object.isFrozen(value.first.target)).toBe(false);
    expect(Object.isFrozen(value.confirmedLineIds)).toBe(false);
    Object.assign(value.first.target, { postalCode: '38683' });
    Object.assign(value.first.offers[0], { priceCents: 999 });
    if (result.status !== 'compared') throw new Error('Valid request rejected');
    expect(result.first.target.postalCode).toBe('38001');
    expect(result.first.payableTotalCents).toBe(125);
    expect(result.first).not.toBe(result.second);
  });

  it('accepts a deeply frozen input without changing it', () => {
    const value = input();
    const before = JSON.stringify(value);
    const freeze = (node: unknown): void => {
      if (node === null || typeof node !== 'object') return;
      for (const child of Object.values(node)) freeze(child);
      Object.freeze(node);
    };
    freeze(value);
    expect(compareManualBasketRequests(value)).toMatchObject({ status: 'compared', outcome: 'tie', differenceCents: 0 });
    expect(JSON.stringify(value)).toBe(before);
  });
});
