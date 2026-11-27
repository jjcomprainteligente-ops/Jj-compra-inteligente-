import { describe, expect, it } from 'vitest';
import { quoteSingleStoreBasket } from '../src/domain/basketQuote';
import type { BasketQuote, BasketQuoteRequest } from '../src/domain/basketQuoteContracts';
import { buildManualBasketRequest, type ManualBasketInput } from '../src/domain/manualBasket';
import type { PriceObservation } from '../src/domain/priceObservations';
import type { ShoppingItem } from '../src/domain/shopping';
import { PILOT_STORE_IDS } from '../src/domain/stores';

const item = (changes: Partial<ShoppingItem> = {}): ShoppingItem => ({
  id: 'artículo-arroz', name: 'Arroz', quantityMilli: 750_000, unit: 'g', category: 'Despensa',
  checked: false, note: '', unitPriceCents: 999, priceKind: 'estimated', ...changes,
});
const observation = (changes: Partial<PriceObservation> = {}): PriceObservation => ({
  id: 'observación-arroz', product: 'Arroz', brand: 'Marca revisada', format: 'Bolsa', quality: 'Blanco',
  store: 'Sucursal revisada', quantityMilli: 500_000, unit: 'g', priceCents: 200,
  observedOn: '2026-11-27', sourceKind: 'manual', sourceReference: 'Anotación propia', url: null, ...changes,
});
const input = (changes: Partial<ManualBasketInput> = {}): ManualBasketInput => ({
  list: { id: 'lista-mañana', name: 'Mi compra', budgetCents: 50_000, items: [item()] },
  observations: [observation()],
  target: { storeName: 'Sucursal revisada', formatId: 'hiperdino', channel: 'physical', postalCode: '38001', country: 'ES', island: 'tenerife' },
  bindings: [{ itemId: 'artículo-arroz', observationId: 'observación-arroz', confirmed: true }],
  costs: { additionalCents: 0, minimumGoodsCents: 0 }, asOf: '2026-11-27', distinctProductsConfirmed: true,
  ...changes,
});
const ready = (value: ManualBasketInput): BasketQuoteRequest => {
  const result = buildManualBasketRequest(value);
  expect(result.status).toBe('ready');
  if (result.status !== 'ready') throw new Error('Expected a manual request');
  return result.request;
};
const calculated = (value: ManualBasketInput): BasketQuote => {
  const result = quoteSingleStoreBasket(ready(value));
  expect(result.status).toBe('calculated');
  if (result.status !== 'calculated') throw new Error('Expected a manual quote');
  return result;
};
const blocked = (value: ManualBasketInput, reason: string) => {
  expect(buildManualBasketRequest(value)).toEqual({ status: 'blocked', reason: `basket.error.${reason}` });
};
function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

describe('adaptador de revisión manual: compra y cobertura reales del motor', () => {
  it('750 g con envases de 500 g a 2 € compra dos por 4 €, consume 3 € y deja 250 g', () => {
    const quote = calculated(input());
    expect(quote).toMatchObject({
      basis: 'manual', priceVerification: 'NOT_VERIFIED', asOf: '2026-11-27',
      coverage: { status: 'complete', totalLines: 1, pricedLines: 1 },
      knownGoodsSubtotalCents: 400, goodsOutlayCents: 400, payableTotalCents: 400,
      lines: [{ id: 'item-0', productKey: 'product-0', status: 'quoted', offerId: 'observation-0',
        packages: 2, baseUnit: 'g', neededBaseMilli: 750_000, purchasedBaseMilli: 1_000_000,
        leftoverBaseMilli: 250_000, goodsOutlayCents: 400,
        consumedCost: { numerator: '300', denominator: '1' }, consumedCostCents: 300 }],
    });
  });

  it('conserva cantidades en milésimas al convertir kg y g', () => {
    const value = input();
    value.list.items[0] = item({ quantityMilli: 750, unit: 'kg' });
    expect(calculated(value).lines[0]).toMatchObject({
      packages: 2, neededBaseMilli: 750_000, purchasedBaseMilli: 1_000_000,
      leftoverBaseMilli: 250_000, goodsOutlayCents: 400, consumedCostCents: 300,
    });
  });

  it('incluye cada pendiente y deja una cesta parcial sin total completo ni pagable', () => {
    const value = input({ costs: { additionalCents: null, minimumGoodsCents: null } });
    value.list.items.unshift(item({ id: 'comprado', name: 'Ya comprado', checked: true }));
    value.list.items.push(item({ id: 'leche', name: 'Leche', unit: 'L', quantityMilli: 1000 }));
    const quote = calculated(value);
    expect(quote.coverage).toEqual({ status: 'partial', totalLines: 2, pricedLines: 1, numerator: 1, denominator: 2 });
    expect(quote.lines[1]).toEqual({ id: 'item-1', productKey: 'product-1', status: 'pending', reasons: ['no-offer'] });
    expect(quote.knownGoodsSubtotalCents).toBe(400);
    expect(quote.goodsOutlayCents).toBeNull();
    expect(quote.payableTotalCents).toBeNull();
    expect(quote.qualificationIssues).toEqual(['incomplete-coverage', 'fees-unknown', 'minimum-unknown']);
  });

  it.each([
    { costs: { additionalCents: 0, minimumGoodsCents: 0 }, payable: 400, issues: [] },
    { costs: { additionalCents: null, minimumGoodsCents: 0 }, payable: null, issues: ['fees-unknown'] },
    { costs: { additionalCents: 0, minimumGoodsCents: null }, payable: null, issues: ['minimum-unknown'] },
    { costs: { additionalCents: 50, minimumGoodsCents: 401 }, payable: null, issues: ['minimum-not-met'] },
    { costs: { additionalCents: 50, minimumGoodsCents: 400 }, payable: 450, issues: [] },
  ])('distingue costes/mínimos cero de desconocidos o no alcanzados: $costs', ({ costs, payable, issues }) => {
    const request = ready(input({ costs }));
    expect(request.costs).toEqual(costs);
    const quote = calculated(input({ costs }));
    expect(quote.payableTotalCents).toBe(payable);
    expect(quote.qualificationIssues).toEqual(issues);
  });

  it('distingue un envase de precio cero de uno sin precio conocido', () => {
    expect(calculated(input({ observations: [observation({ priceCents: 0 })] }))).toMatchObject({
      coverage: { status: 'complete' }, goodsOutlayCents: 0, payableTotalCents: 0,
    });
    expect(calculated(input({ observations: [observation({ priceCents: null })] }))).toMatchObject({
      coverage: { status: 'none' }, knownGoodsSubtotalCents: 0, goodsOutlayCents: null, payableTotalCents: null,
      lines: [{ status: 'pending', reasons: ['price-unknown'] }],
    });
  });

  it.each([
    { observedOn: '2026-11-19', reason: 'stale' },
    { observedOn: '2026-11-28', reason: 'future-observation' },
  ])('conserva la fecha $observedOn para que el motor explique $reason', ({ observedOn, reason }) => {
    const quote = calculated(input({ observations: [observation({ observedOn })] }));
    expect(quote.lines[0]).toMatchObject({ status: 'pending', reasons: [reason] });
    expect(quote.payableTotalCents).toBeNull();
  });
});

describe('selección y atestaciones explícitas, sin deducir producto ni destino', () => {
  it('no usa ni el nombre coincidente, ni el precio de lista, ni una selección sin confirmar', () => {
    for (const bindings of [[], [{ itemId: 'artículo-arroz', observationId: 'observación-arroz', confirmed: false }]]) {
      const value = input({ bindings });
      expect(ready(value).offers).toEqual([]);
      expect(calculated(value).lines[0]).toMatchObject({ status: 'pending', reasons: ['no-offer'] });
    }
  });

  it('un producto cambiado con la atestación descartada queda pendiente', () => {
    const value = input({ observations: [observation({ product: 'Otra variedad', brand: 'Otra marca' })],
      bindings: [{ itemId: 'artículo-arroz', observationId: 'observación-arroz', confirmed: false }] });
    expect(ready(value).offers).toEqual([]);
    expect(calculated(value).coverage.status).toBe('none');
  });

  it('la confirmación conjunta permite una identidad revisada sin comparar nombres de texto', () => {
    const value = input({ observations: [observation({ product: 'Nombre más detallado', store: 'Nombre antiguo de la sucursal' })] });
    const request = ready(value);
    expect(request.offers[0]).toMatchObject({ equivalence: 'confirmed', condition: 'unconditional',
      target: request.target, validFrom: null, validTo: null });
    expect(calculated(value).coverage.status).toBe('complete');
  });

  it('exige la declaración global de productos distintos antes de asignar identidades opacas', () => {
    blocked(input({ distinctProductsConfirmed: false }), 'distinctProducts');
    blocked(input({ distinctProductsConfirmed: 'sí' as unknown as boolean }), 'distinctProducts');
  });

  it.each(['demo', 'unknown'] as const)('impide promover fuente %s aunque esté confirmada o no', sourceKind => {
    for (const confirmed of [true, false]) {
      blocked(input({ observations: [observation({ sourceKind })],
        bindings: [{ itemId: 'artículo-arroz', observationId: 'observación-arroz', confirmed }] }), 'invalidObservation');
    }
  });

  it('ignora fuentes demo, desconocidas y entradas malformadas no seleccionadas', () => {
    const value = input({ observations: [observation({ id: 'demo', sourceKind: 'demo' }),
      observation({ id: 'unknown', sourceKind: 'unknown' }), null as unknown as PriceObservation, observation()] });
    expect(ready(value).offers[0].id).toBe('observation-3');
    expect(calculated(value).payableTotalCents).toBe(400);
  });

  it('no permite asignar la misma observación a dos líneas ni repetir una vinculación', () => {
    const value = input();
    value.list.items.push(item({ id: 'otro', name: 'Otro producto' }));
    value.bindings.push({ itemId: 'otro', observationId: 'observación-arroz', confirmed: true });
    blocked(value, 'invalidBinding');
    const duplicate = input();
    duplicate.bindings.push({ ...duplicate.bindings[0], confirmed: false });
    blocked(duplicate, 'invalidBinding');
  });

  it('rechaza dos observaciones distintas vinculadas a la misma línea', () => {
    const value = input();
    value.observations.push(observation({ id: 'otra-observación' }));
    value.bindings.push({ itemId: 'artículo-arroz', observationId: 'otra-observación', confirmed: true });
    blocked(value, 'invalidBinding');
  });

  it('rechaza una observación seleccionada con ID ambiguo', () => {
    blocked(input({ observations: [observation(), observation({ priceCents: 1 })] }), 'invalidObservation');
  });

  it('rechaza referencias borradas o marcadas como compradas, y observaciones ausentes', () => {
    blocked(input({ bindings: [{ itemId: 'borrado', observationId: 'observación-arroz', confirmed: true }] }), 'invalidBinding');
    const checked = input();
    checked.list.items.push(item({ id: 'comprado', name: 'Comprado', checked: true }));
    checked.bindings = [{ itemId: 'comprado', observationId: 'observación-arroz', confirmed: true }];
    blocked(checked, 'invalidBinding');
    blocked(input({ observations: [] }), 'invalidObservation');
  });
});

describe('límites y revisión conservadora de la lista', () => {
  it('procesa las 200 líneas pendientes y bloquea la 201 sin truncar', () => {
    const value = input({ bindings: [] });
    value.list.items = Array.from({ length: 200 }, (_, index) => item({ id: `item-${index}`, name: `Producto ${index}` }));
    expect(ready(value).lines).toHaveLength(200);
    expect(calculated(value).coverage.totalLines).toBe(200);
    value.list.items.push(item({ id: 'item-200', name: 'Producto 200' }));
    blocked(value, 'lineLimit');
    expect(value.list.items).toHaveLength(201);
  });

  it('cuenta solo los pendientes para el límite y no reutiliza duplicados ya comprados', () => {
    const value = input();
    value.list.items.push(...Array.from({ length: 210 }, (_, index) => item({ id: `comprado-${index}`, checked: true })));
    expect(ready(value).lines).toHaveLength(1);
    expect(calculated(value).payableTotalCents).toBe(400);
  });

  it('acota a 2000 las entradas heredadas y a 200 las vinculaciones sin recorrer arrays enormes', () => {
    const value = input();
    value.list.items.push(...Array.from({ length: 1999 }, (_, index) => item({ id: `comprado-${index}`, checked: true })));
    expect(ready(value).lines).toHaveLength(1);
    value.list.items.push(item({ id: 'comprado-extra', checked: true }));
    blocked(value, 'invalidInput');

    const observations = input();
    observations.observations.push(...Array.from({ length: 1999 }, (_, index) => observation({ id: `otro-${index}`, sourceKind: 'demo' })));
    expect(ready(observations).offers).toHaveLength(1);
    observations.observations.push(observation({ id: 'extra' }));
    blocked(observations, 'invalidObservation');

    const bindings = input();
    bindings.bindings = new Array(201);
    blocked(bindings, 'invalidBinding');
    const huge = input();
    let enumerated = false;
    huge.list.items = new Proxy(new Array(2_000_000), {
      ownKeys() { enumerated = true; throw new Error('Must reject the length before enumeration'); },
    });
    blocked(huge, 'invalidInput');
    expect(enumerated).toBe(false);
  });

  it('bloquea listas vacías o sin pendientes', () => {
    const empty = input();
    empty.list.items = [];
    blocked(empty, 'emptyList');
    empty.list.items = [item({ checked: true })];
    blocked(empty, 'emptyList');
  });

  it.each([' arroz ', 'ARRÓZ', 'Aŕroz'])('pide revisar nombres repetidos normalizados %s aunque cambie unidad', name => {
    const value = input();
    value.list.items.push(item({ id: 'otra-marca', name, unit: 'kg', quantityMilli: 1000 }));
    blocked(value, 'duplicateItems');
  });

  it('normaliza espacios internos y bloquea nombres vacíos sin fusionar datos', () => {
    const value = input();
    value.list.items = [item({ name: 'Arroz blanco' }), item({ id: 'otro', name: ' ARROZ   BLANCO ' })];
    const before = JSON.stringify(value);
    blocked(value, 'duplicateItems');
    expect(JSON.stringify(value)).toBe(before);
    value.list.items = [item({ name: ' \t\n ' })];
    blocked(value, 'duplicateItems');
  });

  it('rechaza IDs originales de línea repetidos antes de hacer lookups', () => {
    const value = input();
    value.list.items.push(item({ name: 'Otro producto' }));
    blocked(value, 'invalidInput');
  });
});

describe('ámbito declarado y datos inválidos sin reflejar información privada', () => {
  it.each(PILOT_STORE_IDS)('admite el formato piloto explícito %s', formatId => {
    const value = input();
    value.target = { ...value.target, formatId };
    expect(ready(value).target.formatId).toBe(formatId);
  });

  it.each([
    { storeName: '' }, { storeName: ' ' }, { storeName: 'x'.repeat(121) }, { storeName: ` ${'x'.repeat(120)} ` },
    { formatId: 'other' }, { channel: 'delivery' }, { postalCode: '38700' },
    { postalCode: '28001' }, { postalCode: '3800' }, { country: 'FR' }, { island: 'gran-canaria' },
  ])('rechaza destino incompleto o fuera del piloto: %j', changes => {
    const value = input();
    value.target = { ...value.target, ...changes } as ManualBasketInput['target'];
    blocked(value, 'invalidTarget');
  });

  it('admite nombre de sucursal de 120 caracteres y canal online expresos', () => {
    const value = input();
    value.target = { ...value.target, storeName: 'x'.repeat(120), channel: 'online', postalCode: '38699' };
    expect(ready(value).target).toMatchObject({ channel: 'online', postalCode: '38699' });
  });

  it.each([
    { quantityMilli: 0 }, { quantityMilli: 1.5 }, { quantityMilli: 1_000_000_001 },
    { quantityMilli: 500, unit: 'ud' }, { unit: 'box' },
  ])('delega validación estricta de cantidades al motor: %j', changes => {
    const value = input();
    value.list.items[0] = { ...item(), ...changes } as ShoppingItem;
    blocked(value, 'invalidInput');
  });

  it.each([
    { asOf: '2026-02-29' },
    { costs: { additionalCents: -1, minimumGoodsCents: 0 } },
    { costs: { additionalCents: 0, minimumGoodsCents: 0.5 } },
    { costs: { additionalCents: 0, minimumGoodsCents: undefined } },
  ])('delega validación estricta de fecha/costes al motor: %j', changes => {
    blocked(input(changes as Partial<ManualBasketInput>), 'invalidInput');
  });

  it.each([
    { product: '' }, { sourceReference: '' }, { quantityMilli: 0 }, { unit: 'box' },
    { priceCents: -1 }, { observedOn: '2026-02-29' }, { url: 'javascript:alert(1)' },
  ])('valida el snapshot seleccionado de observación: %j', changes => {
    blocked(input({ observations: [observation(changes as Partial<PriceObservation>)] }), 'invalidObservation');
  });

  it('no ejecuta un getter usado como atestación y devuelve únicamente una clave segura', () => {
    const value = input();
    let reads = 0;
    Object.defineProperty(value.bindings[0], 'confirmed', { enumerable: true, get() { reads++; throw new Error('dato privado'); } });
    blocked(value, 'invalidBinding');
    expect(reads).toBe(0);
    const hostile = new Proxy({}, { getOwnPropertyDescriptor() { throw new Error('dato privado'); } });
    blocked(hostile as ManualBasketInput, 'invalidInput');
  });
});

describe('IDs opacos, snapshots separados y ninguna mutación', () => {
  it('acepta IDs Unicode heredados sin copiar IDs ni textos del usuario al motor', () => {
    const value = input();
    value.list.items[0].id = '商品-ñ';
    value.observations[0].id = '観察-ó';
    value.bindings = [{ itemId: '商品-ñ', observationId: '観察-ó', confirmed: true }];
    const request = ready(value);
    expect(request.lines[0]).toEqual({ id: 'item-0', productKey: 'product-0', quantityMilli: 750_000, unit: 'g' });
    expect(request.offers[0]).toMatchObject({ id: 'observation-0', lineId: 'item-0', productKey: 'product-0' });
    expect(request.target.storeId).toBe('manual-store');
    const serialized = JSON.stringify(request);
    for (const text of ['商品', '観察', 'Arroz', 'Sucursal revisada', 'Marca revisada', 'Anotación propia', 'lista-mañana']) {
      expect(serialized).not.toContain(text);
    }
  });

  it('funciona con entradas congeladas sin cambiar la lista, las observaciones ni las vinculaciones', () => {
    const value = freezeDeep(input());
    const before = JSON.stringify(value);
    expect(calculated(value).payableTotalCents).toBe(400);
    expect(JSON.stringify(value)).toBe(before);
  });

  it('devuelve un request profundamente congelado que no comparte referencias con la entrada', () => {
    const costs = { additionalCents: 0, minimumGoodsCents: 0 };
    const target = { ...input().target };
    const value = input({ costs, target });
    const request = ready(value);
    const before = JSON.stringify(request);
    expect(request.target).not.toBe(value.target);
    expect(request.costs).not.toBe(value.costs);
    expect(request.lines[0]).not.toBe(value.list.items[0]);
    expect(request.offers[0]).not.toBe(value.observations[0]);
    for (const node of [request, request.target, request.costs, request.lines, request.lines[0],
      request.offers, request.offers[0], request.offers[0].target]) expect(Object.isFrozen(node)).toBe(true);
    value.list.items[0].quantityMilli = 1_000_000;
    value.observations[0].priceCents = 500;
    value.bindings[0].confirmed = false;
    target.postalCode = '38600';
    costs.additionalCents = 100;
    costs.minimumGoodsCents = 999;
    expect(JSON.stringify(request)).toBe(before);
    expect(quoteSingleStoreBasket(request)).toMatchObject({ payableTotalCents: 400 });
  });
});
