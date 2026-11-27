import { describe, expect, it } from 'vitest';
import {
  compareManualBasketRequests,
  type ManualBasketComparison,
  type ManualBasketComparisonInput,
} from '../src/domain/manualBasketComparison';
import type {
  BasketCandidate, BasketNeed, BasketQuoteRequest, BasketTarget,
} from '../src/domain/basketQuoteContracts';

// Synthetic manual arithmetic, never commercial prices. Expected cents and
// fractions are fixed independently of the single-store calculator's helpers.
const target = (overrides: Partial<BasketTarget> = {}): BasketTarget => ({
  storeId: 'first-branch', formatId: 'hiperdino', channel: 'physical',
  postalCode: '38001', country: 'ES', island: 'tenerife', ...overrides,
});
const secondTarget = target({ storeId: 'second-branch', formatId: 'aldi', postalCode: '38600' });
const need = (overrides: Partial<BasketNeed> = {}): BasketNeed => ({
  id: 'rice', productKey: 'rice.brand-a.white', quantityMilli: 750_000, unit: 'g', ...overrides,
});
const offer = (overrides: Partial<BasketCandidate> = {}): BasketCandidate => ({
  id: 'rice-offer', lineId: 'rice', productKey: 'rice.brand-a.white', equivalence: 'confirmed',
  target: target(), packQuantityMilli: 500_000, unit: 'g', priceCents: 200,
  observedOn: '2026-11-27', validFrom: null, validTo: null,
  condition: 'unconditional', ...overrides,
});
const basket = (overrides: Partial<BasketQuoteRequest> = {}): BasketQuoteRequest => {
  const declaredTarget = overrides.target ?? target();
  return {
    version: 1, basis: 'manual', asOf: '2026-11-27', target: declaredTarget,
    costs: { additionalCents: 0, minimumGoodsCents: 0 },
    lines: [need()], offers: [offer({ target: declaredTarget })], ...overrides,
  };
};
const secondBasket = (overrides: Partial<BasketQuoteRequest> = {}): BasketQuoteRequest =>
  basket({ target: secondTarget, ...overrides });
const input = (
  first = basket(), second = secondBasket(),
  overrides: Partial<ManualBasketComparisonInput> = {},
): ManualBasketComparisonInput => ({
  first, second, confirmedLineIds: first.lines.map(line => line.id),
  differentStoresConfirmed: true, ...overrides,
});
const compared = (value: unknown): ManualBasketComparison => {
  const result = compareManualBasketRequests(value);
  expect(result.status).toBe('compared');
  if (result.status !== 'compared') throw new Error(`Expected comparison, received ${result.status}`);
  return result;
};
const beansNeed = need({ id: 'beans', productKey: 'beans.brand-b', quantityMilli: 3000, unit: 'ud' });
const beansOffer = (declaredTarget: BasketTarget, priceCents = 101): BasketCandidate => offer({
  id: 'beans-offer', lineId: 'beans', productKey: 'beans.brand-b',
  target: declaredTarget, packQuantityMilli: 2000, unit: 'ud', priceCents,
});
const twoLineBasket = (declaredTarget: BasketTarget): BasketQuoteRequest => basket({
  target: declaredTarget, lines: [need(), beansNeed],
  offers: [offer({ target: declaredTarget }), beansOffer(declaredTarget)],
});

describe('comparación manual: oráculos de desembolso completo', () => {
  it.each([
    { secondPack: 500_000, secondPrice: 199, secondTotal: 398, outcome: 'second-lower', difference: 2 },
    { secondPack: 500_000, secondPrice: 201, secondTotal: 402, outcome: 'first-lower', difference: 2 },
    { secondPack: 750_000, secondPrice: 400, secondTotal: 400, outcome: 'tie', difference: 0 },
    { secondPack: 1_000_000, secondPrice: 399, secondTotal: 399, outcome: 'second-lower', difference: 1 },
    { secondPack: 250_000, secondPrice: 134, secondTotal: 402, outcome: 'first-lower', difference: 2 },
  ] as const)('750 g: dos envases de 500 g por 400 frente a $secondTotal céntimos', example => {
    const result = compared(input(basket(), secondBasket({ offers: [offer({
      target: secondTarget, packQuantityMilli: example.secondPack, priceCents: example.secondPrice,
    })] })));
    expect(result).toMatchObject({ outcome: example.outcome, differenceCents: example.difference, reasons: [] });
    expect(result.first).toMatchObject({
      knownGoodsSubtotalCents: 400, goodsOutlayCents: 400, payableTotalCents: 400,
      coverage: { status: 'complete', numerator: 1, denominator: 1 },
    });
    expect(result.second.payableTotalCents).toBe(example.secondTotal);
  });

  it('elige por envases completos aunque la primera cesta consuma menos céntimos', () => {
    const result = compared(input(
      basket({ offers: [offer({ packQuantityMilli: 1_000_000, priceCents: 300 })] }),
      secondBasket({ offers: [offer({ target: secondTarget, packQuantityMilli: 750_000, priceCents: 260 })] }),
    ));
    expect(result.first.lines[0]).toMatchObject({
      packages: 1, purchasedBaseMilli: 1_000_000, leftoverBaseMilli: 250_000,
      goodsOutlayCents: 300, consumedCost: { numerator: '225', denominator: '1' },
    });
    expect(result.second.lines[0]).toMatchObject({
      packages: 1, purchasedBaseMilli: 750_000, leftoverBaseMilli: 0,
      goodsOutlayCents: 260, consumedCost: { numerator: '260', denominator: '1' },
    });
    expect(result).toMatchObject({ outcome: 'second-lower', differenceCents: 40, reasons: [] });
  });

  it('los gastos conocidos invierten el menor subtotal de productos', () => {
    const onlineFirst = target({ channel: 'online' });
    const onlineSecond = target({ ...secondTarget, channel: 'online' });
    const result = compared(input(
      basket({ target: onlineFirst, costs: { additionalCents: 100, minimumGoodsCents: 0 },
        offers: [offer({ target: onlineFirst, packQuantityMilli: 750_000, priceCents: 300 })] }),
      secondBasket({ target: onlineSecond,
        offers: [offer({ target: onlineSecond, packQuantityMilli: 750_000, priceCents: 350 })] }),
    ));
    expect(result.first).toMatchObject({ goodsOutlayCents: 300, payableTotalCents: 400 });
    expect(result.second).toMatchObject({ goodsOutlayCents: 350, payableTotalCents: 350 });
    expect(result).toMatchObject({ outcome: 'second-lower', differenceCents: 50, reasons: [] });
  });

  it('suma masa, volumen y unidades por sus propios envases, sin sumar consumos redondeados', () => {
    const milk = need({ id: 'milk', productKey: 'milk.brand-c', quantityMilli: 1250, unit: 'L' });
    const lines = [need({ quantityMilli: 750, unit: 'kg' }), milk, beansNeed];
    const first = basket({ lines, offers: [
      offer(),
      offer({ id: 'milk-offer', lineId: 'milk', productKey: milk.productKey,
        packQuantityMilli: 500_000, unit: 'ml', priceCents: 80 }),
      beansOffer(target()),
    ] });
    const second = secondBasket({ lines, offers: [
      offer({ target: secondTarget, packQuantityMilli: 750, unit: 'kg', priceCents: 410 }),
      offer({ id: 'milk-offer', lineId: 'milk', productKey: milk.productKey, target: secondTarget,
        packQuantityMilli: 1250, unit: 'L', priceCents: 230 }),
      beansOffer(secondTarget, 100),
    ] });
    const result = compared(input(first, second));
    // First: rice 2×200 + milk 3×80 + beans 2×101 = 842.
    // Second: rice 410 + milk 230 + beans 2×100 = 840.
    expect(result.first.payableTotalCents).toBe(842);
    expect(result.second.payableTotalCents).toBe(840);
    expect(result.first.lines).toMatchObject([
      { id: 'rice', baseUnit: 'g', packages: 2, consumedCostCents: 300 },
      { id: 'milk', baseUnit: 'ml', packages: 3, consumedCostCents: 200 },
      { id: 'beans', baseUnit: 'ud', packages: 2, consumedCostCents: 152,
        consumedCost: { numerator: '303', denominator: '2' } },
    ]);
    expect(result).toMatchObject({ outcome: 'second-lower', differenceCents: 2, reasons: [] });
  });

  it('un empate de caja sigue siendo empate con distinto consumo y sobrante', () => {
    const result = compared(input(basket(), secondBasket({ offers: [offer({
      target: secondTarget, packQuantityMilli: 750_000, priceCents: 400,
    })] })));
    expect(result.first.lines[0]).toMatchObject({ leftoverBaseMilli: 250_000, consumedCostCents: 300 });
    expect(result.second.lines[0]).toMatchObject({ leftoverBaseMilli: 0, consumedCostCents: 400 });
    expect(result).toMatchObject({ outcome: 'tie', differenceCents: 0, reasons: [] });
  });

  it('recalcula las ofertas elegibles de cada cesta y conserva el alcance no verificado', () => {
    const result = compared(input(basket({ offers: [
      offer({ id: 'expired-cheap', priceCents: 0, validTo: '2026-11-26' }),
      offer({ id: 'valid-cheap', priceCents: 180 }),
      offer({ id: 'valid-expensive', priceCents: 200 }),
    ] }), secondBasket()));
    expect(result.first.lines[0]).toMatchObject({ offerId: 'valid-cheap', goodsOutlayCents: 360 });
    expect(result.first.excludedOffers).toEqual([
      { offerId: 'expired-cheap', lineId: 'rice', reason: 'expired' },
    ]);
    expect(result).toMatchObject({ outcome: 'first-lower', differenceCents: 40, reasons: [] });
    for (const quote of [result.first, result.second]) {
      expect(quote).toMatchObject({ basis: 'manual', currency: 'EUR', priceVerification: 'NOT_VERIFIED' });
    }
  });
});

describe('comparación manual: misma necesidad y revisión explícita', () => {
  it('las permutaciones no intercambian identidad, cantidad ni confirmaciones de línea', () => {
    const first = twoLineBasket(target());
    const second = twoLineBasket(secondTarget);
    const expected = compared(input(first, second, { confirmedLineIds: ['beans', 'rice'] }));
    const permuted = compared(input(
      { ...first, offers: [...first.offers].reverse() },
      { ...second, lines: [...second.lines].reverse(), offers: [...second.offers].reverse() },
      { confirmedLineIds: ['rice', 'beans'] },
    ));
    expect(expected).toMatchObject({ outcome: 'tie', differenceCents: 0, reasons: [] });
    expect(permuted.first).toEqual(expected.first);
    expect(permuted.second).toEqual({ ...expected.second, lines: [...expected.second.lines].reverse() });
    expect(permuted).toMatchObject({ outcome: 'tie', differenceCents: 0, reasons: [] });
    expect(permuted.second.lines).toMatchObject([
      { id: 'beans', productKey: 'beans.brand-b', goodsOutlayCents: 202 },
      { id: 'rice', productKey: 'rice.brand-a.white', goodsOutlayCents: 400 },
    ]);
  });

  it.each([
    { confirmedLineIds: [] }, { confirmedLineIds: ['rice'] }, { confirmedLineIds: ['beans'] },
  ])('las ofertas confirmadas no sustituyen la revisión cruzada $confirmedLineIds', ({ confirmedLineIds }) => {
    const result = compared(input(twoLineBasket(target()), twoLineBasket(secondTarget), { confirmedLineIds }));
    expect(result).toMatchObject({
      outcome: 'not-comparable', differenceCents: null, reasons: ['equivalence-unreviewed'],
    });
    expect(result.first.payableTotalCents).toBe(602);
    expect(result.second.payableTotalCents).toBe(602);
  });

  it('formatos y CP distintos declarados no sustituyen la revisión de establecimientos', () => {
    const result = compared(input(basket(), secondBasket(), { differentStoresConfirmed: false }));
    expect(result.first.target).toMatchObject({ formatId: 'hiperdino', postalCode: '38001' });
    expect(result.second.target).toMatchObject({ formatId: 'aldi', postalCode: '38600' });
    expect(result).toMatchObject({ outcome: 'not-comparable', differenceCents: null, reasons: ['stores-unreviewed'] });
  });

  it('admite IDs manuales iguales tras revisión explícita de ambos establecimientos', () => {
    const firstTarget = target({ storeId: 'manual-store' });
    const otherTarget = target({ ...secondTarget, storeId: 'manual-store' });
    const result = compared(input(basket({ target: firstTarget }), secondBasket({ target: otherTarget })));
    expect(result).toMatchObject({ outcome: 'tie', differenceCents: 0, reasons: [] });
    expect(result.first.target.postalCode).toBe('38001');
    expect(result.second.target.postalCode).toBe('38600');
  });

  it('conserva todos los bloqueos sin fabricar una diferencia entre subtotales parciales', () => {
    const result = compared(input(
      basket({ offers: [] }), secondBasket({ costs: { additionalCents: null, minimumGoodsCents: 0 } }),
      { confirmedLineIds: [], differentStoresConfirmed: false },
    ));
    expect(result).toMatchObject({ outcome: 'not-comparable', differenceCents: null, reasons: [
      'equivalence-unreviewed', 'stores-unreviewed', 'first-not-qualified', 'second-not-qualified',
    ] });
  });
});

describe('comparación manual: cobertura, costes y vigencia', () => {
  it.each([
    { side: 'first', coverage: 'none', priced: 0, known: 0 },
    { side: 'first', coverage: 'partial', priced: 1, known: 202 },
    { side: 'second', coverage: 'none', priced: 0, known: 0 },
    { side: 'second', coverage: 'partial', priced: 1, known: 202 },
  ] as const)('la cesta $side con cobertura $coverage nunca gana por su subtotal conocido', example => {
    const declaredTarget = example.side === 'first' ? target() : secondTarget;
    const incomplete = { ...twoLineBasket(declaredTarget),
      offers: example.priced === 0 ? [] : [beansOffer(declaredTarget)] };
    const first = example.side === 'first' ? incomplete : twoLineBasket(target());
    const second = example.side === 'second' ? incomplete : twoLineBasket(secondTarget);
    const result = compared(input(first, second));
    const quote = result[example.side];
    expect(quote).toMatchObject({
      coverage: { status: example.coverage, numerator: example.priced, denominator: 2 },
      knownGoodsSubtotalCents: example.known, goodsOutlayCents: null, payableTotalCents: null,
      qualificationIssues: ['incomplete-coverage'],
    });
    expect(result).toMatchObject({
      outcome: 'not-comparable', differenceCents: null, reasons: [`${example.side}-not-qualified`],
    });
  });

  it('un subtotal parcial de cero tampoco empata con una cesta completa de cero', () => {
    const first = { ...twoLineBasket(target()), offers: [beansOffer(target(), 0)] };
    const second = { ...twoLineBasket(secondTarget),
      offers: [offer({ target: secondTarget, priceCents: 0 }), beansOffer(secondTarget, 0)] };
    const result = compared(input(first, second));
    expect(result.first).toMatchObject({ knownGoodsSubtotalCents: 0, payableTotalCents: null });
    expect(result.second.payableTotalCents).toBe(0);
    expect(result).toMatchObject({ outcome: 'not-comparable', differenceCents: null, reasons: ['first-not-qualified'] });
  });

  it.each([
    { side: 'first', costs: { additionalCents: null, minimumGoodsCents: 0 }, issue: 'fees-unknown' },
    { side: 'second', costs: { additionalCents: null, minimumGoodsCents: 0 }, issue: 'fees-unknown' },
    { side: 'first', costs: { additionalCents: 0, minimumGoodsCents: null }, issue: 'minimum-unknown' },
    { side: 'second', costs: { additionalCents: 0, minimumGoodsCents: null }, issue: 'minimum-unknown' },
    { side: 'first', costs: { additionalCents: 100, minimumGoodsCents: 500 }, issue: 'minimum-not-met' },
    { side: 'second', costs: { additionalCents: 100, minimumGoodsCents: 500 }, issue: 'minimum-not-met' },
  ] as const)('$side no produce diferencia final con $issue', example => {
    const first = example.side === 'first' ? basket({ costs: example.costs }) : basket();
    const second = example.side === 'second' ? secondBasket({ costs: example.costs }) : secondBasket();
    const result = compared(input(first, second));
    expect(result[example.side]).toMatchObject({
      coverage: { status: 'complete' }, goodsOutlayCents: 400,
      payableTotalCents: null, qualificationIssues: [example.issue],
    });
    expect(result).toMatchObject({
      outcome: 'not-comparable', differenceCents: null, reasons: [`${example.side}-not-qualified`],
    });
  });

  it('el mínimo se cumple con mercancía exacta; los gastos se suman después', () => {
    const result = compared(input(
      basket({ costs: { additionalCents: 23, minimumGoodsCents: 400 } }),
      secondBasket({ costs: { additionalCents: 0, minimumGoodsCents: 400 } }),
    ));
    expect(result.first).toMatchObject({ goodsOutlayCents: 400, payableTotalCents: 423, qualificationIssues: [] });
    expect(result).toMatchObject({ outcome: 'second-lower', differenceCents: 23, reasons: [] });
  });

  it.each([
    { observedOn: '2026-11-19', exclusion: 'stale' },
    { observedOn: '2026-11-28', exclusion: 'future-observation' },
  ] as const)('un cero manual $exclusion no vence a un precio conocido actual', ({ observedOn, exclusion }) => {
    const result = compared(input(
      basket({ offers: [offer({ priceCents: 0, observedOn })] }), secondBasket(),
    ));
    expect(result.first).toMatchObject({
      knownGoodsSubtotalCents: 0, payableTotalCents: null,
      coverage: { status: 'none', numerator: 0, denominator: 1 },
      lines: [{ id: 'rice', status: 'pending', reasons: [exclusion] }],
      excludedOffers: [{ offerId: 'rice-offer', lineId: 'rice', reason: exclusion }],
    });
    expect(result).toMatchObject({ outcome: 'not-comparable', differenceCents: null, reasons: ['first-not-qualified'] });
  });

  it('un cero manual de hace siete días sigue siendo conocido y no verificado', () => {
    const result = compared(input(
      basket({ offers: [offer({ priceCents: 0, observedOn: '2026-11-20' })] }),
      secondBasket({ offers: [offer({ target: secondTarget, priceCents: 1 })] }),
    ));
    expect(result.first).toMatchObject({ payableTotalCents: 0, priceVerification: 'NOT_VERIFIED' });
    expect(result.second).toMatchObject({ payableTotalCents: 2, priceVerification: 'NOT_VERIFIED' });
    expect(result).toMatchObject({ outcome: 'first-lower', differenceCents: 2, reasons: [] });
  });

  it('precio desconocido y cero manual no son equivalentes', () => {
    const result = compared(input(
      basket({ offers: [offer({ priceCents: null })] }),
      secondBasket({ offers: [offer({ target: secondTarget, priceCents: 0 })] }),
    ));
    expect(result.first.lines[0]).toMatchObject({ status: 'pending', reasons: ['price-unknown'] });
    expect(result.second.payableTotalCents).toBe(0);
    expect(result).toMatchObject({ outcome: 'not-comparable', differenceCents: null, reasons: ['first-not-qualified'] });
  });
});

describe('comparación manual: enteros seguros y origen', () => {
  const maximum = 9_007_199_254_740_991;
  const oneUnit = need({ quantityMilli: 1000, unit: 'ud' });
  const onePackBasket = (declaredTarget: BasketTarget, priceCents: number, additionalCents = 0): BasketQuoteRequest =>
    basket({ target: declaredTarget, lines: [oneUnit], costs: { additionalCents, minimumGoodsCents: 0 },
      offers: [offer({ target: declaredTarget, packQuantityMilli: 1000, unit: 'ud', priceCents })] });

  it.each([
    { first: maximum, second: maximum - 1, outcome: 'second-lower', difference: 1 },
    { first: maximum - 1, second: maximum, outcome: 'first-lower', difference: 1 },
    { first: maximum, second: maximum, outcome: 'tie', difference: 0 },
    { first: 0, second: maximum, outcome: 'first-lower', difference: maximum },
    { first: maximum, second: 0, outcome: 'second-lower', difference: maximum },
  ] as const)('compara exactamente $first con $second céntimos', example => {
    const result = compared(input(
      onePackBasket(target(), example.first), onePackBasket(secondTarget, example.second),
    ));
    expect(result.first.payableTotalCents).toBe(example.first);
    expect(result.second.payableTotalCents).toBe(example.second);
    expect(result).toMatchObject({ outcome: example.outcome, differenceCents: example.difference, reasons: [] });
    expect(Number.isSafeInteger(result.differenceCents)).toBe(true);
  });

  it.each(['first', 'second'] as const)('detiene la comparación si mercancía más gastos de %s supera el entero seguro', side => {
    const first = onePackBasket(target(), maximum, side === 'first' ? 1 : 0);
    const second = onePackBasket(secondTarget, maximum, side === 'second' ? 1 : 0);
    expect(compareManualBasketRequests(input(first, second))).toEqual({ status: 'numeric-limit' });
  });

  it('detiene la comparación si dos líneas válidas exceden el subtotal seguro', () => {
    const first = basket({ lines: [oneUnit, beansNeed], offers: [
      offer({ packQuantityMilli: 1000, unit: 'ud', priceCents: maximum }),
      beansOffer(target(), 1),
    ] });
    const second = secondBasket({ lines: [oneUnit, beansNeed], offers: [
      offer({ target: secondTarget, packQuantityMilli: 1000, unit: 'ud', priceCents: 0 }),
      beansOffer(secondTarget, 0),
    ] });
    expect(compareManualBasketRequests(input(first, second))).toEqual({ status: 'numeric-limit' });
  });

  it('una oferta individual desbordada no transforma cobertura ausente en una cesta barata', () => {
    const result = compared(input(
      basket({ offers: [offer({ priceCents: maximum })] }), secondBasket(),
    ));
    expect(result.first).toMatchObject({
      payableTotalCents: null, coverage: { status: 'none' },
      excludedOffers: [{ offerId: 'rice-offer', lineId: 'rice', reason: 'numeric-limit' }],
    });
    expect(result).toMatchObject({ outcome: 'not-comparable', differenceCents: null, reasons: ['first-not-qualified'] });
  });

  it('un numerador intermedio grande conserva un céntimo de diferencia final', () => {
    const tinyLeftover = need({ quantityMilli: 999_999_999 });
    const first = basket({ lines: [tinyLeftover], offers: [offer({
      packQuantityMilli: 1_000_000_000, priceCents: maximum,
    })] });
    const second = secondBasket({ lines: [tinyLeftover], offers: [offer({
      target: secondTarget, packQuantityMilli: 1_000_000_000, priceCents: maximum - 1,
    })] });
    const result = compared(input(first, second));
    expect(result.first.lines[0]).toMatchObject({
      consumedCost: { numerator: '9007199245733791745259009', denominator: '1000000000' },
      goodsOutlayCents: maximum,
    });
    expect(result).toMatchObject({ outcome: 'second-lower', differenceCents: 1, reasons: [] });
  });

  it.each(['first', 'second', 'both'] as const)('rechaza origen test-fixture en %s aunque todos los importes sean calculables', side => {
    const first = basket({ basis: side === 'first' || side === 'both' ? 'test-fixture' : 'manual' });
    const second = secondBasket({ basis: side === 'second' || side === 'both' ? 'test-fixture' : 'manual' });
    expect(compareManualBasketRequests(input(first, second))).toEqual({ status: 'invalid-input', reason: 'basis' });
  });
});
