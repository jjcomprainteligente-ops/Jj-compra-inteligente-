import { describe, expect, it } from 'vitest';
import { quoteSingleStoreBasket } from '../src/domain/basketQuote';
import type {
  BasketCandidate, BasketNeed, BasketQuote, BasketQuoteRequest, BasketTarget,
} from '../src/domain/basketQuoteContracts';

// These are deliberately manual fixtures. Expected cents/ratios below are fixed
// arithmetic examples, independent of the engine's conversion/rounding helpers.
const target = (overrides: Partial<BasketTarget> = {}): BasketTarget => ({
  storeId: 'branch-001', formatId: 'hiperdino', channel: 'physical',
  postalCode: '38001', country: 'ES', island: 'tenerife', ...overrides,
});
const need = (overrides: Partial<BasketNeed> = {}): BasketNeed => ({
  id: 'rice', productKey: 'rice.brand-a.white', quantityMilli: 750_000, unit: 'g', ...overrides,
});
const offer = (overrides: Partial<BasketCandidate> = {}): BasketCandidate => ({
  id: 'offer-1', lineId: 'rice', productKey: 'rice.brand-a.white', equivalence: 'confirmed',
  target: target(), packQuantityMilli: 500_000, unit: 'g', priceCents: 200,
  observedOn: '2026-11-27', validFrom: null, validTo: null,
  condition: 'unconditional', ...overrides,
});
const request = (overrides: Partial<BasketQuoteRequest> = {}): BasketQuoteRequest => ({
  version: 1, basis: 'test-fixture', asOf: '2026-11-27', target: target(),
  costs: { additionalCents: 0, minimumGoodsCents: 0 },
  lines: [need()], offers: [offer()], ...overrides,
});
const calculated = (input: unknown): BasketQuote => {
  const result = quoteSingleStoreBasket(input);
  expect(result.status).toBe('calculated');
  if (result.status !== 'calculated') throw new Error(`Expected a quote, received ${result.status}`);
  return result;
};

describe('cesta manual: envases enteros y consumo exacto', () => {
  it('750 g con envases de 500 g a 200 céntimos compra 1000 g por 400, consume 300 y deja 250 g', () => {
    expect(calculated(request())).toEqual({
      status: 'calculated', basis: 'test-fixture', currency: 'EUR', priceVerification: 'NOT_VERIFIED',
      target: target(), asOf: '2026-11-27',
      lines: [{
        id: 'rice', productKey: 'rice.brand-a.white', status: 'quoted', offerId: 'offer-1',
        packages: 2, baseUnit: 'g', neededBaseMilli: 750_000, purchasedBaseMilli: 1_000_000,
        leftoverBaseMilli: 250_000, goodsOutlayCents: 400,
        consumedCost: { numerator: '300', denominator: '1' }, consumedCostCents: 300,
      }],
      excludedOffers: [],
      coverage: { status: 'complete', totalLines: 1, pricedLines: 1, numerator: 1, denominator: 1 },
      knownGoodsSubtotalCents: 400, goodsOutlayCents: 400, payableTotalCents: 400,
      qualificationIssues: [],
    });
  });

  it.each([
    { needUnit: 'kg', needMilli: 1250, packUnit: 'g', packMilli: 500_000, baseUnit: 'g',
      needed: 1_250_000, bought: 1_500_000, leftover: 250_000, packages: 3, outlay: 600, consumed: '500' },
    { needUnit: 'g', needMilli: 750_000, packUnit: 'kg', packMilli: 500, baseUnit: 'g',
      needed: 750_000, bought: 1_000_000, leftover: 250_000, packages: 2, outlay: 400, consumed: '300' },
    { needUnit: 'L', needMilli: 1250, packUnit: 'ml', packMilli: 500_000, baseUnit: 'ml',
      needed: 1_250_000, bought: 1_500_000, leftover: 250_000, packages: 3, outlay: 600, consumed: '500' },
    { needUnit: 'ml', needMilli: 750_000, packUnit: 'L', packMilli: 500, baseUnit: 'ml',
      needed: 750_000, bought: 1_000_000, leftover: 250_000, packages: 2, outlay: 400, consumed: '300' },
  ] as const)('convierte $needUnit y $packUnit sin cambiar la dimensión', example => {
    const quote = calculated(request({
      lines: [need({ quantityMilli: example.needMilli, unit: example.needUnit })],
      offers: [offer({ packQuantityMilli: example.packMilli, unit: example.packUnit })],
    }));
    expect(quote.lines[0]).toMatchObject({
      status: 'quoted', baseUnit: example.baseUnit, packages: example.packages,
      neededBaseMilli: example.needed, purchasedBaseMilli: example.bought,
      leftoverBaseMilli: example.leftover, goodsOutlayCents: example.outlay,
      consumedCost: { numerator: example.consumed, denominator: '1' },
    });
  });

  it('mantiene las unidades enteras: 3 ud en paquetes de 2 a 101 céntimos', () => {
    const quote = calculated(request({
      lines: [need({ quantityMilli: 3000, unit: 'ud' })],
      offers: [offer({ packQuantityMilli: 2000, unit: 'ud', priceCents: 101 })],
    }));
    expect(quote.lines[0]).toMatchObject({
      packages: 2, baseUnit: 'ud', neededBaseMilli: 3000, purchasedBaseMilli: 4000,
      leftoverBaseMilli: 1000, goodsOutlayCents: 202,
      consumedCost: { numerator: '303', denominator: '2' }, consumedCostCents: 152,
    });
    expect(quote.payableTotalCents).toBe(202);
  });

  it.each([
    { needed: 1, pack: 2000, price: 1, numerator: '1', denominator: '2000', display: 0 },
    { needed: 1, pack: 2, price: 1, numerator: '1', denominator: '2', display: 1 },
    { needed: 3, pack: 2, price: 1, numerator: '3', denominator: '2', display: 2 },
    { needed: 2, pack: 3, price: 1, numerator: '2', denominator: '3', display: 1 },
  ])('conserva $numerator/$denominator céntimos y redondea sólo la presentación', example => {
    const quote = calculated(request({
      lines: [need({ quantityMilli: example.needed })],
      offers: [offer({ packQuantityMilli: example.pack, priceCents: example.price })],
    }));
    expect(quote.lines[0]).toMatchObject({
      consumedCost: { numerator: example.numerator, denominator: example.denominator },
      consumedCostCents: example.display,
    });
  });

  it('usa aritmética exacta aunque el numerador intermedio supere el entero seguro', () => {
    const quote = calculated(request({
      lines: [need({ quantityMilli: 999_999_999 })],
      offers: [offer({ packQuantityMilli: 1_000_000_000, priceCents: Number.MAX_SAFE_INTEGER })],
    }));
    expect(quote.lines[0]).toMatchObject({
      packages: 1, leftoverBaseMilli: 1, goodsOutlayCents: 9_007_199_254_740_991,
      consumedCost: { numerator: '9007199245733791745259009', denominator: '1000000000' },
      consumedCostCents: 9_007_199_245_733_792,
    });
    expect(quote.payableTotalCents).toBe(9_007_199_254_740_991);
  });

  it('distingue cero manual conocido del precio desconocido y no verifica ninguno', () => {
    const free = calculated(request({ basis: 'manual', offers: [offer({ priceCents: 0 })] }));
    expect(free).toMatchObject({
      basis: 'manual', priceVerification: 'NOT_VERIFIED', knownGoodsSubtotalCents: 0,
      goodsOutlayCents: 0, payableTotalCents: 0,
    });
    expect(free.lines[0]).toMatchObject({
      consumedCost: { numerator: '0', denominator: '1' }, consumedCostCents: 0,
    });
    const unknown = calculated(request({ basis: 'manual', offers: [offer({ priceCents: null })] }));
    expect(unknown).toMatchObject({
      priceVerification: 'NOT_VERIFIED', knownGoodsSubtotalCents: 0,
      goodsOutlayCents: null, payableTotalCents: null,
      coverage: { status: 'none', pricedLines: 0 },
      lines: [{ status: 'pending', reasons: ['price-unknown'] }],
    });
  });
});

describe('selección reproducible de oferta para una sola tienda', () => {
  it('minimiza el desembolso de envases aunque otro formato tenga menor precio por kg', () => {
    const quote = calculated(request({ offers: [
      offer({ id: 'cheaper-per-kg', packQuantityMilli: 1_000_000, priceCents: 700 }),
      offer({ id: 'cheaper-checkout', packQuantityMilli: 250_000, priceCents: 200 }),
    ] }));
    expect(quote.lines[0]).toMatchObject({
      offerId: 'cheaper-checkout', packages: 3, goodsOutlayCents: 600, leftoverBaseMilli: 0,
    });
    expect(quote.excludedOffers).toEqual([]);
  });

  it('desempata desembolso por menor sobrante antes que por identificador', () => {
    const quote = calculated(request({ offers: [
      offer({ id: 'a-more-leftover', packQuantityMilli: 500_000, priceCents: 200 }),
      offer({ id: 'z-less-leftover', packQuantityMilli: 400_000, priceCents: 200 }),
    ] }));
    expect(quote.lines[0]).toMatchObject({
      offerId: 'z-less-leftover', packages: 2, goodsOutlayCents: 400, leftoverBaseMilli: 50_000,
    });
  });

  it.each([
    { ids: ['a', 'Z'], winner: 'Z' },
    { ids: ['offer-2', 'offer-10'], winner: 'offer-10' },
  ])('usa orden ordinal de ID cuando coste y sobrante empatan: $winner', ({ ids, winner }) => {
    const quote = calculated(request({ offers: ids.map(id => offer({ id })) }));
    expect(quote.lines[0]).toMatchObject({ offerId: winner });
  });

  it('permuta ofertas sin alterar selección, motivos ni orden canónico de exclusión', () => {
    const offers = [
      offer({ id: 'z-stale', observedOn: '2026-11-19' }),
      offer({ id: 'a-winner' }),
      offer({ id: 'm-price', priceCents: null }),
      offer({ id: 'b-tie' }),
    ];
    const expected = calculated(request({ offers }));
    expect(expected.lines[0]).toMatchObject({ offerId: 'a-winner' });
    expect(expected.excludedOffers).toEqual([
      { offerId: 'm-price', lineId: 'rice', reason: 'price-unknown' },
      { offerId: 'z-stale', lineId: 'rice', reason: 'stale' },
    ]);
    expect(calculated(request({ offers: [...offers].reverse() }))).toEqual(expected);
    expect(calculated(request({ offers: [offers[2], offers[0], offers[3], offers[1]] }))).toEqual(expected);
  });

  it('exige confirmación explícita y productKey exacto sin inferir marca o variante', () => {
    const quote = calculated(request({ offers: [
      offer({ id: 'unreviewed', equivalence: 'unreviewed' }),
      offer({ id: 'other-brand', productKey: 'rice.brand-b.white' }),
      offer({ id: 'other-variant', productKey: 'rice.brand-a.brown' }),
      offer({ id: 'different-case', productKey: 'Rice.brand-a.white' }),
    ] }));
    expect(quote.lines[0]).toMatchObject({
      status: 'pending', reasons: ['equivalence-unreviewed', 'product-mismatch'],
    });
    expect(quote.excludedOffers).toEqual([
      { offerId: 'different-case', lineId: 'rice', reason: 'product-mismatch' },
      { offerId: 'other-brand', lineId: 'rice', reason: 'product-mismatch' },
      { offerId: 'other-variant', lineId: 'rice', reason: 'product-mismatch' },
      { offerId: 'unreviewed', lineId: 'rice', reason: 'equivalence-unreviewed' },
    ]);
  });

  it.each([
    { field: 'storeId', value: 'branch-002' },
    { field: 'formatId', value: 'superdino' },
    { field: 'channel', value: 'online' },
    { field: 'postalCode', value: '38699' },
  ] as const)('no hereda precios de otro destino válido: $field', ({ field, value }) => {
    const quote = calculated(request({ offers: [offer({ target: target({ [field]: value }) })] }));
    expect(quote.lines[0]).toMatchObject({ status: 'pending', reasons: ['target-mismatch'] });
    expect(quote.goodsOutlayCents).toBeNull();
  });

  it.each([
    { country: 'PT' }, { island: 'gran-canaria' }, { postalCode: '28001' },
  ])('distingue un destino fuera del esquema de un destino válido diferente: %j', overrides => {
    const input = request();
    expect(quoteSingleStoreBasket({
      ...input, offers: [{ ...offer(), target: { ...target(), ...overrides } }],
    })).toEqual({ status: 'invalid-input', reason: 'target' });
  });

  it('admite otro destino declarado dentro del ámbito y exige su coincidencia exacta', () => {
    const alternate = target({ storeId: 'another-branch', formatId: 'aldi', channel: 'online', postalCode: '38699' });
    expect(calculated(request({ target: alternate, offers: [offer({ target: alternate })] })).payableTotalCents).toBe(400);
  });

  it('mantiene separadas masa, volumen y unidades aunque las cifras coincidan', () => {
    const quote = calculated(request({ offers: [
      offer({ id: 'volume', unit: 'ml' }), offer({ id: 'units', unit: 'ud', packQuantityMilli: 1000 }),
    ] }));
    expect(quote.lines[0]).toMatchObject({ status: 'pending', reasons: ['unit-mismatch'] });
    expect(quote.excludedOffers).toHaveLength(2);
  });

  it('nunca aplica una condición comercial aunque su precio sea cero', () => {
    const conditional = offer({ id: 'conditional-zero', condition: 'conditional', priceCents: 0 });
    const withKnown = calculated(request({ offers: [conditional, offer()] }));
    expect(withKnown.lines[0]).toMatchObject({ offerId: 'offer-1', goodsOutlayCents: 400 });
    expect(withKnown.excludedOffers).toEqual([
      { offerId: 'conditional-zero', lineId: 'rice', reason: 'conditional' },
    ]);
    const alone = calculated(request({ offers: [conditional] }));
    expect(alone.lines[0]).toMatchObject({ status: 'pending', reasons: ['conditional'] });
    expect(alone.payableTotalCents).toBeNull();
  });
});

describe('fechas civiles explícitas', () => {
  it('incluye observación de siete días y excluye la de ocho', () => {
    expect(calculated(request({ offers: [offer({ observedOn: '2026-11-20' })] })).coverage.status).toBe('complete');
    const stale = calculated(request({ offers: [offer({ observedOn: '2026-11-19' })] }));
    expect(stale.lines[0]).toMatchObject({ status: 'pending', reasons: ['stale'] });
  });

  it('incluye ambos límites de validez y distingue futuro, aún no válido y caducado', () => {
    const quote = calculated(request({ offers: [
      offer({ id: 'valid-today', validFrom: '2026-11-27', validTo: '2026-11-27' }),
      offer({ id: 'future-observation', observedOn: '2026-11-28' }),
      offer({ id: 'future-validity', validFrom: '2026-11-28' }),
      offer({ id: 'expired-validity', validTo: '2026-11-26' }),
    ] }));
    expect(quote.lines[0]).toMatchObject({ offerId: 'valid-today' });
    expect(quote.excludedOffers).toEqual([
      { offerId: 'expired-validity', lineId: 'rice', reason: 'expired' },
      { offerId: 'future-observation', lineId: 'rice', reason: 'future-observation' },
      { offerId: 'future-validity', lineId: 'rice', reason: 'not-yet-valid' },
    ]);
  });

  it('cuenta el 29 de febrero y depende de asOf, sin consultar el reloj actual', () => {
    const leapOffer = offer({ observedOn: '2000-02-29' });
    expect(calculated(request({ asOf: '2000-03-07', offers: [leapOffer] })).coverage.status).toBe('complete');
    expect(calculated(request({ asOf: '2000-03-08', offers: [leapOffer] })).lines[0]).toMatchObject({
      status: 'pending', reasons: ['stale'],
    });
    expect(calculated(request({ asOf: '2000-02-28', offers: [leapOffer] })).lines[0]).toMatchObject({
      status: 'pending', reasons: ['future-observation'],
    });
  });
});

describe('cobertura y cualificación de un total de compra', () => {
  const twoNeeds = [
    need({ id: 'z-rice', quantityMilli: 1000, unit: 'ud' }),
    need({ id: 'a-oil', productKey: 'oil.brand-a.virgin', quantityMilli: 1000, unit: 'ud' }),
  ];
  const twoOffers = [
    offer({ id: 'rice-offer', lineId: 'z-rice', packQuantityMilli: 1000, unit: 'ud', priceCents: 123 }),
    offer({ id: 'oil-offer', lineId: 'a-oil', productKey: 'oil.brand-a.virgin', packQuantityMilli: 1000, unit: 'ud', priceCents: 77 }),
  ];

  it.each([
    { count: 0, status: 'none', known: 0, total: null },
    { count: 1, status: 'partial', known: 123, total: null },
    { count: 2, status: 'complete', known: 200, total: 200 },
  ])('expresa $count/2 líneas cubiertas sin fabricar un total cero', ({ count, status, known, total }) => {
    const quote = calculated(request({ lines: twoNeeds, offers: twoOffers.slice(0, count) }));
    expect(quote.coverage).toEqual({ status, totalLines: 2, pricedLines: count, numerator: count, denominator: 2 });
    expect(quote.lines.map(line => line.id)).toEqual(['z-rice', 'a-oil']);
    expect(quote.knownGoodsSubtotalCents).toBe(known);
    expect(quote.goodsOutlayCents).toBe(total);
    expect(quote.payableTotalCents).toBe(total);
    expect(quote.qualificationIssues).toEqual(count === 2 ? [] : ['incomplete-coverage']);
    if (count === 0) expect(quote.lines).toEqual([
      { id: 'z-rice', productKey: 'rice.brand-a.white', status: 'pending', reasons: ['no-offer'] },
      { id: 'a-oil', productKey: 'oil.brand-a.virgin', status: 'pending', reasons: ['no-offer'] },
    ]);
  });

  it('una cesta vacía no afirma cobertura completa ni total pagable', () => {
    const quote = calculated(request({ lines: [], offers: [] }));
    expect(quote).toMatchObject({
      lines: [], excludedOffers: [], knownGoodsSubtotalCents: 0,
      goodsOutlayCents: null, payableTotalCents: null,
      coverage: { status: 'empty', totalLines: 0, pricedLines: 0, numerator: 0, denominator: 0 },
      qualificationIssues: ['empty-basket'], priceVerification: 'NOT_VERIFIED',
    });
  });

  it.each([
    { additionalCents: 0, minimumGoodsCents: 0, payable: 400, issues: [] },
    { additionalCents: 25, minimumGoodsCents: 400, payable: 425, issues: [] },
    { additionalCents: null, minimumGoodsCents: 0, payable: null, issues: ['fees-unknown'] },
    { additionalCents: 0, minimumGoodsCents: null, payable: null, issues: ['minimum-unknown'] },
    { additionalCents: null, minimumGoodsCents: null, payable: null, issues: ['fees-unknown', 'minimum-unknown'] },
    { additionalCents: 100, minimumGoodsCents: 401, payable: null, issues: ['minimum-not-met'] },
  ])('cualifica gastos y mínimo declarados: %j', ({ additionalCents, minimumGoodsCents, payable, issues }) => {
    const quote = calculated(request({ costs: { additionalCents, minimumGoodsCents } }));
    expect(quote.goodsOutlayCents).toBe(400);
    expect(quote.payableTotalCents).toBe(payable);
    expect(quote.qualificationIssues).toEqual(issues);
    expect(quote.lines[0]).toMatchObject({ packages: 2, goodsOutlayCents: 400 });
  });

  it('no añade envases ni selecciona una oferta más cara para alcanzar el mínimo', () => {
    const quote = calculated(request({
      costs: { additionalCents: 0, minimumGoodsCents: 500 },
      offers: [offer(), offer({ id: 'reaches-minimum', priceCents: 300 })],
    }));
    expect(quote.lines[0]).toMatchObject({ offerId: 'offer-1', packages: 2, goodsOutlayCents: 400 });
    expect(quote.payableTotalCents).toBeNull();
    expect(quote.qualificationIssues).toEqual(['minimum-not-met']);
  });

  it('un subtotal parcial no permite afirmar que se incumple el mínimo', () => {
    const quote = calculated(request({
      lines: twoNeeds, offers: [twoOffers[0]],
      costs: { additionalCents: null, minimumGoodsCents: 500 },
    }));
    expect(quote.knownGoodsSubtotalCents).toBe(123);
    expect(quote.qualificationIssues).toEqual(['incomplete-coverage', 'fees-unknown']);
    expect(quote.payableTotalCents).toBeNull();
  });
});

describe('límites numéricos y motivos de exclusión', () => {
  it('excluye sólo la oferta cuyo desembolso supera el entero seguro y conserva una alternativa', () => {
    const quote = calculated(request({ offers: [
      offer({ id: 'too-large', priceCents: Number.MAX_SAFE_INTEGER }), offer({ id: 'safe' }),
    ] }));
    expect(quote.lines[0]).toMatchObject({ offerId: 'safe', goodsOutlayCents: 400 });
    expect(quote.excludedOffers).toEqual([
      { offerId: 'too-large', lineId: 'rice', reason: 'numeric-limit' },
    ]);
    const onlyLarge = calculated(request({ offers: [offer({ priceCents: Number.MAX_SAFE_INTEGER })] }));
    expect(onlyLarge.lines[0]).toMatchObject({ status: 'pending', reasons: ['numeric-limit'] });
    expect(onlyLarge.goodsOutlayCents).toBeNull();
  });

  it('acepta conversión y número de paquetes grandes cuando todos los resultados siguen siendo seguros', () => {
    const quote = calculated(request({
      lines: [need({ quantityMilli: 1_000_000_000, unit: 'kg' })],
      offers: [offer({ packQuantityMilli: 1, unit: 'g', priceCents: 1 })],
    }));
    expect(quote.lines[0]).toMatchObject({
      packages: 1_000_000_000_000, baseUnit: 'g', neededBaseMilli: 1_000_000_000_000,
      purchasedBaseMilli: 1_000_000_000_000, leftoverBaseMilli: 0,
      goodsOutlayCents: 1_000_000_000_000,
      consumedCost: { numerator: '1000000000000', denominator: '1' },
      consumedCostCents: 1_000_000_000_000,
    });
  });

  it('señala límite global al sumar dos líneas seguras cuyo total excede MAX_SAFE', () => {
    expect(quoteSingleStoreBasket(request({
      lines: [
        need({ id: 'max', quantityMilli: 1000, unit: 'ud' }),
        need({ id: 'extra', productKey: 'oil.brand-a', quantityMilli: 1000, unit: 'ud' }),
      ],
      offers: [
        offer({ id: 'max-offer', lineId: 'max', packQuantityMilli: 1000, unit: 'ud', priceCents: Number.MAX_SAFE_INTEGER }),
        offer({ id: 'extra-offer', lineId: 'extra', productKey: 'oil.brand-a', packQuantityMilli: 1000, unit: 'ud', priceCents: 1 }),
      ],
    }))).toEqual({ status: 'numeric-limit' });
  });

  it('señala límite global cuando los gastos desbordan un subtotal seguro', () => {
    expect(quoteSingleStoreBasket(request({
      lines: [need({ quantityMilli: 1000, unit: 'ud' })],
      offers: [offer({ packQuantityMilli: 1000, unit: 'ud', priceCents: Number.MAX_SAFE_INTEGER })],
      costs: { additionalCents: 1, minimumGoodsCents: 0 },
    }))).toEqual({ status: 'numeric-limit' });
  });

  it('asigna un único motivo por oferta, deduplica motivos de línea y ordena ambas salidas canónicamente', () => {
    const quote = calculated(request({ offers: [
      offer({ id: '11-numeric', priceCents: Number.MAX_SAFE_INTEGER }),
      offer({ id: '10-condition', condition: 'conditional', priceCents: Number.MAX_SAFE_INTEGER }),
      offer({ id: '09-stale', observedOn: '2026-11-19', condition: 'conditional' }),
      offer({ id: '09-stale-again', observedOn: '2026-11-18' }),
      offer({ id: '08-expired', validTo: '2026-11-26', observedOn: '2026-11-19' }),
      offer({ id: '07-not-yet', validFrom: '2026-11-28', observedOn: '2026-11-19' }),
      offer({ id: '06-future', observedOn: '2026-11-28', validFrom: '2026-11-28' }),
      offer({ id: '05-price', priceCents: null, observedOn: '2026-11-28' }),
      offer({ id: '04-unit', unit: 'ml', priceCents: null }),
      offer({ id: '03-target', target: target({ storeId: 'branch-002' }), unit: 'ml' }),
      offer({ id: '02-product', productKey: 'other-brand', target: target({ storeId: 'branch-002' }) }),
      offer({ id: '01-unreviewed', equivalence: 'unreviewed', productKey: 'other-brand' }),
    ] }));
    expect(quote.lines[0]).toMatchObject({ status: 'pending', reasons: [
      'equivalence-unreviewed', 'product-mismatch', 'target-mismatch', 'unit-mismatch',
      'price-unknown', 'future-observation', 'not-yet-valid', 'expired', 'stale', 'conditional', 'numeric-limit',
    ] });
    expect(quote.excludedOffers).toEqual([
      { offerId: '01-unreviewed', lineId: 'rice', reason: 'equivalence-unreviewed' },
      { offerId: '02-product', lineId: 'rice', reason: 'product-mismatch' },
      { offerId: '03-target', lineId: 'rice', reason: 'target-mismatch' },
      { offerId: '04-unit', lineId: 'rice', reason: 'unit-mismatch' },
      { offerId: '05-price', lineId: 'rice', reason: 'price-unknown' },
      { offerId: '06-future', lineId: 'rice', reason: 'future-observation' },
      { offerId: '07-not-yet', lineId: 'rice', reason: 'not-yet-valid' },
      { offerId: '08-expired', lineId: 'rice', reason: 'expired' },
      { offerId: '09-stale', lineId: 'rice', reason: 'stale' },
      { offerId: '09-stale-again', lineId: 'rice', reason: 'stale' },
      { offerId: '10-condition', lineId: 'rice', reason: 'conditional' },
      { offerId: '11-numeric', lineId: 'rice', reason: 'numeric-limit' },
    ]);
  });
});

describe('aislamiento y salida inmutable', () => {
  it('no altera una entrada congelada y devuelve sólo datos JSON profundamente inmutables', () => {
    const freezeTree = (value: unknown): void => {
      if (typeof value !== 'object' || value === null) return;
      for (const child of Object.values(value)) freezeTree(child);
      Object.freeze(value);
    };
    const input = request({ offers: [offer({ id: 'selected' }), offer({ id: 'excluded', priceCents: null })] });
    const before = JSON.stringify(input);
    freezeTree(input);
    const quote = calculated(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(JSON.parse(JSON.stringify(quote))).toEqual(quote);
    const assertFrozenTree = (value: unknown): void => {
      if (typeof value !== 'object' || value === null) return;
      expect(Object.isFrozen(value)).toBe(true);
      for (const child of Object.values(value)) assertFrozenTree(child);
    };
    assertFrozenTree(quote);
    expect(() => Object.assign(quote.target, { storeId: 'changed' })).toThrow();
    expect(() => Object.assign(quote.lines[0], { status: 'pending' })).toThrow();
    expect(() => Object.assign(quote.excludedOffers[0], { reason: 'conditional' })).toThrow();
    expect(calculated(input)).toEqual(quote);
  });

  it('no congela ni comparte el destino mutable del llamante', () => {
    const input = request();
    const before = JSON.parse(JSON.stringify(input));
    const quote = calculated(input);
    expect(input).toEqual(before);
    expect(Object.isFrozen(input)).toBe(false);
    expect(Object.isFrozen(input.target)).toBe(false);
    expect(quote.target).not.toBe(input.target);
    Object.assign(input.target, { storeId: 'caller-changed' });
    expect(quote.target.storeId).toBe('branch-001');
  });
});
