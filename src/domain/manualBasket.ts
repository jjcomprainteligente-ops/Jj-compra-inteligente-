import {
  MAX_BASKET_LINES,
  type BasketQuoteRequest,
  type BasketTarget,
} from './basketQuoteContracts';
import { readBasketQuoteRequest } from './basketQuoteValidation';
import { validatePriceObservation, type PriceObservation } from './priceObservations';
import type { ShoppingList } from './shopping';

export interface ManualBasketBinding {
  itemId: string;
  observationId: string;
  /** The UI asks about the same product, destination and unconditional price together. */
  confirmed: boolean;
}

export interface ManualBasketInput {
  list: ShoppingList;
  observations: PriceObservation[];
  target: Omit<BasketTarget, 'storeId'> & { storeName: string };
  bindings: ManualBasketBinding[];
  costs: BasketQuoteRequest['costs'];
  asOf: string;
  distinctProductsConfirmed: boolean;
}

const REASONS = [
  'invalidInput', 'emptyList', 'lineLimit', 'duplicateItems', 'distinctProducts',
  'invalidTarget', 'invalidBinding', 'invalidObservation',
] as const;
type Reason = typeof REASONS[number];
const failures = Object.freeze(Object.fromEntries(REASONS.map(reason => [reason, Object.freeze({})]))) as Readonly<Record<Reason, object>>;
function fail(reason: Reason): never { throw failures[reason]; }

/** Read only own data properties: accessors never become manual attestations. */
function fields(value: unknown, keys: readonly string[], reason: Reason): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) fail(reason);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) fail(reason);
  const snapshot: Record<string, unknown> = {};
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor?.enumerable || !('value' in descriptor)) fail(reason);
    Object.defineProperty(snapshot, key, { value: descriptor.value, enumerable: true });
  }
  return snapshot;
}

function dense(value: unknown, reason: Reason, maximum = 2000): readonly unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) fail(reason);
  const length = Object.getOwnPropertyDescriptor(value, 'length');
  if (!length || !('value' in length) || !Number.isSafeInteger(length.value)
    || length.value < 0 || length.value > maximum) fail(reason);
  const count: number = length.value;
  if (Reflect.ownKeys(value).length !== count + 1) fail(reason);
  const snapshot: unknown[] = [];
  for (let index = 0; index < count; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor?.enumerable || !('value' in descriptor)) fail(reason);
    snapshot.push(descriptor.value);
  }
  return snapshot;
}

/** Legacy IDs are lookups only; the engine receives opaque ASCII IDs below. */
function legacyId(value: unknown, reason: Reason): string {
  if (typeof value !== 'string' || !value || value.length > 128 || value.trim() !== value) fail(reason);
  return value;
}

function normalizedName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
}

const OBSERVATION_FIELDS = [
  'id', 'product', 'brand', 'format', 'quality', 'store', 'quantityMilli', 'unit',
  'priceCents', 'observedOn', 'sourceKind', 'sourceReference', 'url',
] as const;

/**
 * Ephemeral adapter, with no clock, storage, network or automatic product match.
 * A repeated normalized name may hide different brands: ask for explicit list
 * review instead of inventing an identity or allocating one pack to two lines.
 * The caller must discard confirmations when the reviewed inputs change.
 */
export function buildManualBasketRequest(input: ManualBasketInput):
  { status: 'ready'; request: BasketQuoteRequest } | { status: 'blocked'; reason: string } {
  try {
    const value = fields(input, ['list', 'observations', 'target', 'bindings', 'costs', 'asOf', 'distinctProductsConfirmed'], 'invalidInput');
    const list = fields(value.list, ['items'], 'invalidInput');
    const itemIds = new Set<string>();
    const names = new Set<string>();
    const pending: { sourceId: string; quantityMilli: unknown; unit: unknown }[] = [];
    for (const item of dense(list.items, 'invalidInput')) {
      const snapshot = fields(item, ['id', 'name', 'quantityMilli', 'unit', 'checked'], 'invalidInput');
      const sourceId = legacyId(snapshot.id, 'invalidInput');
      if (itemIds.has(sourceId) || typeof snapshot.checked !== 'boolean') fail('invalidInput');
      itemIds.add(sourceId);
      if (snapshot.checked) continue;
      if (pending.length === MAX_BASKET_LINES) fail('lineLimit');
      if (typeof snapshot.name !== 'string' || snapshot.name.length > 120) fail('invalidInput');
      const name = normalizedName(snapshot.name);
      if (!name || names.has(name)) fail('duplicateItems');
      names.add(name);
      pending.push({ sourceId, quantityMilli: snapshot.quantityMilli, unit: snapshot.unit });
    }
    if (pending.length === 0) fail('emptyList');
    if (value.distinctProductsConfirmed !== true) fail('distinctProducts');

    const rawTarget = fields(value.target, ['storeName', 'formatId', 'channel', 'postalCode', 'country', 'island'], 'invalidTarget');
    if (typeof rawTarget.storeName !== 'string' || !rawTarget.storeName.trim() || rawTarget.storeName.length > 120) fail('invalidTarget');
    const target = {
      storeId: 'manual-store', formatId: rawTarget.formatId, channel: rawTarget.channel,
      postalCode: rawTarget.postalCode, country: rawTarget.country, island: rawTarget.island,
    };
    const lines = pending.map((item, index) => ({
      id: `item-${index}`, productKey: `product-${index}`, quantityMilli: item.quantityMilli, unit: item.unit,
    }));
    const itemIndexes = new Map(pending.map((item, index) => [item.sourceId, index]));
    const observationValues = dense(value.observations, 'invalidObservation');
    const observationIndexes = new Map<string, number[]>();
    observationValues.forEach((observation, index) => {
      // Unselected demo, unknown or malformed entries never supply an offer.
      if (observation === null || typeof observation !== 'object') return;
      const id = Object.getOwnPropertyDescriptor(observation, 'id');
      if (!id?.enumerable || !('value' in id) || typeof id.value !== 'string') return;
      const indexes = observationIndexes.get(id.value);
      if (indexes) indexes.push(index);
      else observationIndexes.set(id.value, [index]);
    });

    const boundItems = new Set<string>(), boundObservations = new Set<string>();
    const offers: unknown[] = [];
    for (const binding of dense(value.bindings, 'invalidBinding', MAX_BASKET_LINES)) {
      const snapshot = fields(binding, ['itemId', 'observationId', 'confirmed'], 'invalidBinding');
      const itemId = legacyId(snapshot.itemId, 'invalidBinding');
      const observationId = legacyId(snapshot.observationId, 'invalidBinding');
      const itemIndex = itemIndexes.get(itemId);
      if (itemIndex === undefined || typeof snapshot.confirmed !== 'boolean'
        || boundItems.has(itemId) || boundObservations.has(observationId)) fail('invalidBinding');
      boundItems.add(itemId);
      boundObservations.add(observationId);
      const indexes = observationIndexes.get(observationId);
      if (!indexes || indexes.length !== 1) fail('invalidObservation');
      const observationIndex = indexes[0];
      let observation: PriceObservation;
      try {
        observation = validatePriceObservation(fields(observationValues[observationIndex], OBSERVATION_FIELDS, 'invalidObservation'));
      } catch { fail('invalidObservation'); }
      if (observation.sourceKind !== 'manual') fail('invalidObservation');
      if (!snapshot.confirmed) continue;
      offers.push({
        id: `observation-${observationIndex}`, lineId: `item-${itemIndex}`, productKey: `product-${itemIndex}`,
        equivalence: 'confirmed', target, packQuantityMilli: observation.quantityMilli,
        unit: observation.unit, priceCents: observation.priceCents, observedOn: observation.observedOn,
        validFrom: null, validTo: null, condition: 'unconditional',
      });
    }
    // The strict engine reader validates the remaining quantities, dates, scope
    // and costs, and returns a detached, deeply frozen request with no aliases.
    const parsed = readBasketQuoteRequest({
      version: 1, basis: 'manual', asOf: value.asOf, target, costs: value.costs, lines, offers,
    });
    if (parsed.status !== 'valid') fail(parsed.reason === 'target' ? 'invalidTarget' : 'invalidInput');
    return { status: 'ready', request: parsed.request };
  } catch (failure) {
    const reason = REASONS.find(reason => failures[reason] === failure) ?? 'invalidInput';
    return { status: 'blocked', reason: `basket.error.${reason}` };
  }
}
