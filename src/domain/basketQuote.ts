import {
  BASKET_RECENT_DAYS,
  type BasketCandidate,
  type BasketExclusionReason,
  type BasketNeed,
  type BasketQuote,
  type BasketQuoteResult,
  type BasketQuotedLine,
  type BasketTarget,
} from './basketQuoteContracts';
import { readBasketQuoteRequest } from './basketQuoteValidation';

const MAX_SERIALIZED_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);
const DAY_MILLISECONDS = 86_400_000n;
const RECENT_DAYS = BigInt(BASKET_RECENT_DAYS);

/** First applicable reason wins; pending-line reasons use the same order. */
const EXCLUSION_ORDER: readonly BasketExclusionReason[] = [
  'equivalence-unreviewed',
  'product-mismatch',
  'target-mismatch',
  'unit-mismatch',
  'price-unknown',
  'future-observation',
  'not-yet-valid',
  'expired',
  'stale',
  'conditional',
  'numeric-limit',
];

interface CandidateCalculation {
  readonly offerId: string;
  readonly packages: bigint;
  readonly purchasedBaseMilli: bigint;
  readonly leftoverBaseMilli: bigint;
  readonly goodsOutlayCents: bigint;
  readonly consumedNumerator: bigint;
  readonly consumedDenominator: bigint;
  readonly consumedCostCents: bigint;
}

function freeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}

function baseUnit(unit: BasketNeed['unit']): BasketQuotedLine['baseUnit'] {
  if (unit === 'g' || unit === 'kg') return 'g';
  if (unit === 'ml' || unit === 'L') return 'ml';
  return 'ud';
}

function baseQuantity(quantityMilli: number, unit: BasketNeed['unit']): bigint {
  return BigInt(quantityMilli) * (unit === 'kg' || unit === 'L' ? 1000n : 1n);
}

function sameTarget(left: BasketTarget, right: BasketTarget): boolean {
  return left.storeId === right.storeId
    && left.formatId === right.formatId
    && left.channel === right.channel
    && left.postalCode === right.postalCode
    && left.country === right.country
    && left.island === right.island;
}

/** The validator supplies real ISO calendar dates; no device clock is consulted. */
function calendarDay(value: string): bigint {
  return BigInt(Date.parse(`${value}T00:00:00.000Z`)) / DAY_MILLISECONDS;
}

function exclusionReason(
  need: BasketNeed,
  offer: BasketCandidate,
  target: BasketTarget,
  asOf: string,
  asOfDay: bigint,
): BasketExclusionReason | null {
  if (offer.equivalence !== 'confirmed') return 'equivalence-unreviewed';
  if (offer.productKey !== need.productKey) return 'product-mismatch';
  if (!sameTarget(offer.target, target)) return 'target-mismatch';
  if (baseUnit(offer.unit) !== baseUnit(need.unit)) return 'unit-mismatch';
  if (offer.priceCents === null) return 'price-unknown';
  if (offer.observedOn > asOf) return 'future-observation';
  if (offer.validFrom !== null && offer.validFrom > asOf) return 'not-yet-valid';
  if (offer.validTo !== null && offer.validTo < asOf) return 'expired';
  if (asOfDay - calendarDay(offer.observedOn) > RECENT_DAYS) return 'stale';
  if (offer.condition !== 'unconditional') return 'conditional';
  return null;
}

function serializable(...values: readonly bigint[]): boolean {
  return values.every(value => value >= 0n && value <= MAX_SERIALIZED_INTEGER);
}

function gcd(left: bigint, right: bigint): bigint {
  while (right !== 0n) {
    const remainder = left % right;
    left = right;
    right = remainder;
  }
  return left;
}

function calculateCandidate(neededBaseMilli: bigint, offer: BasketCandidate): CandidateCalculation | null {
  // Only an eligible, explicitly priced offer reaches this calculation.
  if (offer.priceCents === null) return null;
  const packBaseMilli = baseQuantity(offer.packQuantityMilli, offer.unit);
  const packages = (neededBaseMilli + packBaseMilli - 1n) / packBaseMilli;
  const purchasedBaseMilli = packages * packBaseMilli;
  const leftoverBaseMilli = purchasedBaseMilli - neededBaseMilli;
  const priceCents = BigInt(offer.priceCents);
  const goodsOutlayCents = packages * priceCents;
  const consumedNumerator = priceCents * neededBaseMilli;
  const consumedCostCents = (2n * consumedNumerator + packBaseMilli) / (2n * packBaseMilli);
  if (!serializable(packages, neededBaseMilli, purchasedBaseMilli, leftoverBaseMilli, goodsOutlayCents, consumedCostCents)) {
    return null;
  }
  const divisor = gcd(consumedNumerator, packBaseMilli);
  return {
    offerId: offer.id,
    packages,
    purchasedBaseMilli,
    leftoverBaseMilli,
    goodsOutlayCents,
    consumedNumerator: consumedNumerator / divisor,
    consumedDenominator: packBaseMilli / divisor,
    consumedCostCents,
  };
}

function precedes(left: CandidateCalculation, right: CandidateCalculation): boolean {
  if (left.goodsOutlayCents !== right.goodsOutlayCents) return left.goodsOutlayCents < right.goodsOutlayCents;
  if (left.leftoverBaseMilli !== right.leftoverBaseMilli) return left.leftoverBaseMilli < right.leftoverBaseMilli;
  return left.offerId < right.offerId;
}

function quotedLine(need: BasketNeed, neededBaseMilli: bigint, calculation: CandidateCalculation): BasketQuotedLine {
  return {
    id: need.id,
    productKey: need.productKey,
    status: 'quoted',
    offerId: calculation.offerId,
    packages: Number(calculation.packages),
    baseUnit: baseUnit(need.unit),
    neededBaseMilli: Number(neededBaseMilli),
    purchasedBaseMilli: Number(calculation.purchasedBaseMilli),
    leftoverBaseMilli: Number(calculation.leftoverBaseMilli),
    goodsOutlayCents: Number(calculation.goodsOutlayCents),
    consumedCost: {
      numerator: calculation.consumedNumerator.toString(),
      denominator: calculation.consumedDenominator.toString(),
    },
    consumedCostCents: Number(calculation.consumedCostCents),
  };
}

/**
 * Isolated whole-pack arithmetic for manual inputs and test fixtures. Its result
 * is never a verified commercial price, a saved basket or a cross-store rank.
 */
export function quoteSingleStoreBasket(input: unknown): BasketQuoteResult {
  const parsed = readBasketQuoteRequest(input);
  if (parsed.status === 'invalid-input') return freeze({ status: 'invalid-input', reason: parsed.reason });
  const request = parsed.request;
  const asOfDay = calendarDay(request.asOf);
  const offersByLine = new Map<string, BasketCandidate[]>();
  for (const offer of request.offers) {
    const offers = offersByLine.get(offer.lineId);
    if (offers) offers.push(offer);
    else offersByLine.set(offer.lineId, [offer]);
  }

  const lines: BasketQuote['lines'][number][] = [];
  const excludedOffers: BasketQuote['excludedOffers'][number][] = [];
  let knownGoodsSubtotal = 0n;
  let pricedLines = 0;
  for (const need of request.lines) {
    const neededBaseMilli = baseQuantity(need.quantityMilli, need.unit);
    const reasons = new Set<BasketExclusionReason>();
    let best: CandidateCalculation | null = null;
    for (const offer of offersByLine.get(need.id) ?? []) {
      const reason = exclusionReason(need, offer, request.target, request.asOf, asOfDay);
      const calculation = reason === null ? calculateCandidate(neededBaseMilli, offer) : null;
      if (reason !== null || calculation === null) {
        const excludedReason = reason ?? 'numeric-limit';
        reasons.add(excludedReason);
        excludedOffers.push({ offerId: offer.id, lineId: offer.lineId, reason: excludedReason });
      } else if (best === null || precedes(calculation, best)) {
        best = calculation;
      }
    }
    if (best === null) {
      lines.push({
        id: need.id,
        productKey: need.productKey,
        status: 'pending',
        reasons: reasons.size === 0 ? ['no-offer'] : EXCLUSION_ORDER.filter(reason => reasons.has(reason)),
      });
    } else {
      lines.push(quotedLine(need, neededBaseMilli, best));
      knownGoodsSubtotal += best.goodsOutlayCents;
      if (!serializable(knownGoodsSubtotal)) return freeze({ status: 'numeric-limit' });
      pricedLines += 1;
    }
  }

  excludedOffers.sort((left, right) => left.offerId < right.offerId ? -1 : left.offerId > right.offerId ? 1 : 0);
  const totalLines = request.lines.length;
  const complete = totalLines > 0 && pricedLines === totalLines;
  const qualificationIssues: BasketQuote['qualificationIssues'][number][] = [];
  if (totalLines === 0) qualificationIssues.push('empty-basket');
  if (totalLines > 0 && !complete) qualificationIssues.push('incomplete-coverage');
  if (request.costs.additionalCents === null) qualificationIssues.push('fees-unknown');
  if (request.costs.minimumGoodsCents === null) qualificationIssues.push('minimum-unknown');
  const minimumMet = request.costs.minimumGoodsCents !== null
    && knownGoodsSubtotal >= BigInt(request.costs.minimumGoodsCents);
  if (complete && request.costs.minimumGoodsCents !== null && !minimumMet) qualificationIssues.push('minimum-not-met');

  let payableTotalCents: number | null = null;
  if (complete && request.costs.additionalCents !== null && minimumMet) {
    const payableTotal = knownGoodsSubtotal + BigInt(request.costs.additionalCents);
    if (!serializable(payableTotal)) return freeze({ status: 'numeric-limit' });
    payableTotalCents = Number(payableTotal);
  }

  return freeze({
    status: 'calculated',
    basis: request.basis,
    currency: 'EUR',
    priceVerification: 'NOT_VERIFIED',
    target: { ...request.target },
    asOf: request.asOf,
    lines,
    excludedOffers,
    coverage: {
      status: totalLines === 0 ? 'empty' : pricedLines === 0 ? 'none' : complete ? 'complete' : 'partial',
      totalLines,
      pricedLines,
      numerator: pricedLines,
      denominator: totalLines,
    },
    knownGoodsSubtotalCents: Number(knownGoodsSubtotal),
    goodsOutlayCents: complete ? Number(knownGoodsSubtotal) : null,
    payableTotalCents,
    qualificationIssues,
  });
}
