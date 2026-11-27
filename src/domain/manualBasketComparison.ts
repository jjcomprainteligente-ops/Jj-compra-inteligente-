import { quoteSingleStoreBasket } from './basketQuote';
import {
  MAX_BASKET_LINES,
  type BasketQuote,
  type BasketQuoteRequest,
} from './basketQuoteContracts';
import { readBasketQuoteRequest } from './basketQuoteValidation';

export interface ManualBasketComparisonInput {
  readonly first: BasketQuoteRequest;
  readonly second: BasketQuoteRequest;
  /** Explicit cross-review attestations, never inferred from generated IDs. */
  readonly confirmedLineIds: readonly string[];
  /** The caller reviews the visible establishment metadata for both requests. */
  readonly differentStoresConfirmed: boolean;
}

export type ManualBasketComparisonInputIssue = 'shape' | 'requests' | 'basis' | 'needs'
  | 'day' | 'channel' | 'confirmations';
export type ManualBasketComparisonReason = 'equivalence-unreviewed' | 'stores-unreviewed'
  | 'first-not-qualified' | 'second-not-qualified';

export interface ManualBasketComparison {
  readonly status: 'compared';
  readonly first: BasketQuote;
  readonly second: BasketQuote;
  readonly outcome: 'not-comparable' | 'first-lower' | 'second-lower' | 'tie';
  readonly differenceCents: number | null;
  readonly reasons: readonly ManualBasketComparisonReason[];
}

export type ManualBasketComparisonResult = ManualBasketComparison
  | { readonly status: 'invalid-input'; readonly reason: ManualBasketComparisonInputIssue }
  | { readonly status: 'numeric-limit' };

const ISSUES = ['shape', 'requests', 'basis', 'needs', 'day', 'channel', 'confirmations'] as const;
// Compare only our private tokens: hostile thrown values are never inspected.
const failures = Object.freeze(Object.fromEntries(ISSUES.map(reason => [reason, Object.freeze({})]))) as Readonly<Record<ManualBasketComparisonInputIssue, object>>;
function fail(reason: ManualBasketComparisonInputIssue): never { throw failures[reason]; }

function fields(input: unknown): Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) fail('shape');
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) fail('shape');
  const keys = ['first', 'second', 'confirmedLineIds', 'differentStoresConfirmed'];
  const actual = Reflect.ownKeys(input);
  if (actual.length !== keys.length || actual.some(key => typeof key !== 'string' || !keys.includes(key))) fail('shape');
  const snapshot: Record<string, unknown> = Object.create(null);
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor?.enumerable || !('value' in descriptor)) fail('shape');
    Object.defineProperty(snapshot, key, { value: descriptor.value, enumerable: true });
  }
  return snapshot;
}

function confirmations(input: unknown, lineIds: ReadonlySet<string>): ReadonlySet<string> {
  if (!Array.isArray(input) || Object.getPrototypeOf(input) !== Array.prototype) fail('confirmations');
  const length = Object.getOwnPropertyDescriptor(input, 'length');
  if (!length || !('value' in length) || !Number.isSafeInteger(length.value)
    || length.value < 0 || length.value > MAX_BASKET_LINES) fail('confirmations');
  const count: number = length.value;
  if (Reflect.ownKeys(input).length !== count + 1) fail('confirmations');
  const confirmed = new Set<string>();
  for (let index = 0; index < count; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(input, String(index));
    if (!descriptor?.enumerable || !('value' in descriptor)) fail('confirmations');
    const id: unknown = descriptor.value;
    if (typeof id !== 'string' || !lineIds.has(id) || confirmed.has(id)) fail('confirmations');
    confirmed.add(id);
  }
  return confirmed;
}

function sameNeeds(first: BasketQuoteRequest, second: BasketQuoteRequest): boolean {
  if (first.lines.length !== second.lines.length) return false;
  const secondById = new Map(second.lines.map(line => [line.id, line]));
  return first.lines.every(line => {
    const other = secondById.get(line.id);
    return other !== undefined && other.productKey === line.productKey
      && other.quantityMilli === line.quantityMilli && other.unit === line.unit;
  });
}

/**
 * Pure comparison of two detached manual reviews, with fresh single-store
 * calculations. Each target keeps its own declared postcode; days and channels
 * must agree. A generated `manual-store` ID is not proof of store identity, nor
 * are generated product IDs proof of equivalence. The caller must explicitly
 * review the visible establishment and product metadata, including independent
 * source observations, and discard attestations whenever either reviewed input
 * changes. This is not a verified market rank.
 */
export function compareManualBasketRequests(input: unknown): ManualBasketComparisonResult {
  try {
    const value = fields(input);
    if (typeof value.differentStoresConfirmed !== 'boolean') fail('shape');
    const firstRead = readBasketQuoteRequest(value.first);
    const secondRead = readBasketQuoteRequest(value.second);
    if (firstRead.status !== 'valid' || secondRead.status !== 'valid') fail('requests');
    const firstRequest = firstRead.request, secondRequest = secondRead.request;
    if (firstRequest.basis !== 'manual' || secondRequest.basis !== 'manual') fail('basis');
    if (!sameNeeds(firstRequest, secondRequest)) fail('needs');
    if (firstRequest.asOf !== secondRequest.asOf) fail('day');
    if (firstRequest.target.channel !== secondRequest.target.channel) fail('channel');
    const lineIds = new Set(firstRequest.lines.map(line => line.id));
    let confirmedLineIds: ReadonlySet<string>;
    try { confirmedLineIds = confirmations(value.confirmedLineIds, lineIds); }
    catch { fail('confirmations'); }

    const first = quoteSingleStoreBasket(firstRequest);
    const second = quoteSingleStoreBasket(secondRequest);
    if (first.status === 'numeric-limit' || second.status === 'numeric-limit') {
      return Object.freeze({ status: 'numeric-limit' });
    }
    // Both requests are detached, frozen reader outputs; keep a closed boundary
    // if the single-store contract ever changes its validation requirements.
    if (first.status !== 'calculated' || second.status !== 'calculated') fail('requests');

    const reasons: ManualBasketComparisonReason[] = [];
    if (confirmedLineIds.size !== lineIds.size) reasons.push('equivalence-unreviewed');
    if (!value.differentStoresConfirmed) reasons.push('stores-unreviewed');
    if (first.payableTotalCents === null) reasons.push('first-not-qualified');
    if (second.payableTotalCents === null) reasons.push('second-not-qualified');

    let outcome: ManualBasketComparison['outcome'] = 'not-comparable';
    let differenceCents: number | null = null;
    if (reasons.length === 0 && first.payableTotalCents !== null && second.payableTotalCents !== null) {
      const difference = BigInt(first.payableTotalCents) - BigInt(second.payableTotalCents);
      outcome = difference < 0n ? 'first-lower' : difference > 0n ? 'second-lower' : 'tie';
      differenceCents = Number(difference < 0n ? -difference : difference);
    }
    // Single-store quotes are already deeply frozen and detached from inputs.
    return Object.freeze({ status: 'compared', first, second, outcome, differenceCents,
      reasons: Object.freeze(reasons) });
  } catch (failure) {
    const reason = ISSUES.find(issue => failures[issue] === failure) ?? 'shape';
    return Object.freeze({ status: 'invalid-input', reason });
  }
}
