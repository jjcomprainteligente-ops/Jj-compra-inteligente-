import { UNITS, type Unit } from './shopping';
import { PILOT_STORE_IDS, type PilotStoreId } from './stores';
import {
  MAX_BASKET_LINES, MAX_BASKET_OFFERS, MAX_BASKET_QUANTITY_MILLI,
  type BasketCandidate, type BasketInputIssue, type BasketNeed,
  type BasketQuoteInputError, type BasketQuoteRequest, type BasketTarget,
} from './basketQuoteContracts';

const ISSUES = ['shape', 'limit', 'identity', 'quantity', 'money', 'date', 'target', 'duplicate'] as const;
// Private identity tokens keep even a thrown hostile Proxy out of error reflection.
const failures = Object.freeze(Object.fromEntries(ISSUES.map(reason => [reason, Object.freeze({})]))) as Readonly<Record<BasketInputIssue, object>>;
function fail(reason: BasketInputIssue): never { throw failures[reason]; }

function fields(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail('shape');
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) fail('shape');
  const actual = Reflect.ownKeys(value);
  if (actual.length !== keys.length || actual.some(key => typeof key !== 'string' || !keys.includes(key))) fail('shape');
  const snapshot: Record<string, unknown> = Object.create(null);
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !('value' in descriptor)) fail('shape');
    Object.defineProperty(snapshot, key, { value: descriptor.value, enumerable: true });
  }
  return snapshot;
}

function dense(value: unknown, maximum: number): readonly unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) fail('shape');
  const length = Object.getOwnPropertyDescriptor(value, 'length');
  if (!length || !('value' in length) || !Number.isSafeInteger(length.value) || length.value < 0) fail('shape');
  const count: number = length.value;
  if (count > maximum) fail('limit');
  if (Reflect.ownKeys(value).length !== count + 1) fail('shape');
  const items: unknown[] = [];
  for (let index = 0; index < count; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor?.enumerable || !('value' in descriptor)) fail('shape');
    items.push(descriptor.value);
  }
  return items;
}

function identity(value: unknown): string {
  if (typeof value !== 'string' || value.length > 128 || value.trim() !== value
    || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)) fail('identity');
  return value;
}

function date(value: unknown): string {
  if (typeof value !== 'string' || value.length !== 10 || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) fail('date');
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) fail('date');
  return value;
}

function optionalDate(value: unknown): string | null { return value === null ? null : date(value); }

function money(value: unknown): number | null {
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) fail('money');
  return value === 0 ? 0 : value;
}

function unit(value: unknown): Unit {
  if (!(UNITS as readonly unknown[]).includes(value)) fail('quantity');
  return value as Unit;
}

function quantity(value: unknown, selectedUnit: Unit): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0
    || value > MAX_BASKET_QUANTITY_MILLI || selectedUnit === 'ud' && value % 1000 !== 0) fail('quantity');
  return value;
}

function target(value: unknown): BasketTarget {
  const v = fields(value, ['storeId', 'formatId', 'channel', 'postalCode', 'country', 'island']);
  const storeId = identity(v.storeId);
  if (!(PILOT_STORE_IDS as readonly unknown[]).includes(v.formatId)
    || v.channel !== 'physical' && v.channel !== 'online'
    || typeof v.postalCode !== 'string' || v.postalCode.length !== 5 || !/^38[0-6]\d{2}$/.test(v.postalCode)
    || v.country !== 'ES' || v.island !== 'tenerife') fail('target');
  // Declared scope only: a postcode prefix is not geographic or commercial proof.
  return Object.freeze({ storeId, formatId: v.formatId as PilotStoreId, channel: v.channel,
    postalCode: v.postalCode, country: 'ES', island: 'tenerife' });
}

function need(value: unknown): BasketNeed {
  const v = fields(value, ['id', 'productKey', 'quantityMilli', 'unit']);
  const selectedUnit = unit(v.unit);
  return Object.freeze({ id: identity(v.id), productKey: identity(v.productKey),
    quantityMilli: quantity(v.quantityMilli, selectedUnit), unit: selectedUnit });
}

function candidate(value: unknown): BasketCandidate {
  const v = fields(value, ['id', 'lineId', 'productKey', 'equivalence', 'target', 'packQuantityMilli',
    'unit', 'priceCents', 'observedOn', 'validFrom', 'validTo', 'condition']);
  if (v.equivalence !== 'confirmed' && v.equivalence !== 'unreviewed'
    || v.condition !== 'unconditional' && v.condition !== 'conditional') fail('shape');
  const selectedUnit = unit(v.unit), validFrom = optionalDate(v.validFrom), validTo = optionalDate(v.validTo);
  if (validFrom !== null && validTo !== null && validFrom > validTo) fail('date');
  return Object.freeze({ id: identity(v.id), lineId: identity(v.lineId), productKey: identity(v.productKey),
    equivalence: v.equivalence, target: target(v.target), packQuantityMilli: quantity(v.packQuantityMilli, selectedUnit),
    unit: selectedUnit, priceCents: money(v.priceCents), observedOn: date(v.observedOn), validFrom, validTo, condition: v.condition });
}

/** Strict detached snapshot, not a licence/GTIN/source validator or storage migration. */
export function readBasketQuoteRequest(input: unknown): { readonly status: 'valid'; readonly request: BasketQuoteRequest } | BasketQuoteInputError {
  try {
    const v = fields(input, ['version', 'basis', 'asOf', 'target', 'costs', 'lines', 'offers']);
    if (v.version !== 1 || v.basis !== 'manual' && v.basis !== 'test-fixture') fail('shape');
    const asOf = date(v.asOf), declaredTarget = target(v.target);
    const rawCosts = fields(v.costs, ['additionalCents', 'minimumGoodsCents']);
    const costs = Object.freeze({ additionalCents: money(rawCosts.additionalCents), minimumGoodsCents: money(rawCosts.minimumGoodsCents) });
    const lines = dense(v.lines, MAX_BASKET_LINES).map(need);
    const ids = new Set(lines.map(line => line.id)), products = new Set(lines.map(line => line.productKey));
    // Aggregation requires a separate explicit review; never allocate one pack twice.
    if (ids.size !== lines.length || products.size !== lines.length) fail('duplicate');
    const offers = dense(v.offers, MAX_BASKET_OFFERS).map(candidate);
    if (new Set(offers.map(offer => offer.id)).size !== offers.length) fail('duplicate');
    if (offers.some(offer => !ids.has(offer.lineId))) fail('identity');
    return Object.freeze({ status: 'valid', request: Object.freeze({ version: 1, basis: v.basis, asOf, target: declaredTarget,
      costs, lines: Object.freeze(lines), offers: Object.freeze(offers) }) });
  } catch (failure) {
    const reason = ISSUES.find(issue => failures[issue] === failure) ?? 'shape';
    return Object.freeze({ status: 'invalid-input', reason });
  }
}
