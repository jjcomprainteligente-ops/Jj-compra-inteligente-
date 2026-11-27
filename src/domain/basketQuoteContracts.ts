import type { Unit } from './shopping';
import type { PilotStoreId } from './stores';

/** Isolated calculation proposal. This is not a feed, saved document or verified PVP. */
export interface BasketTarget {
  readonly storeId: string;
  readonly formatId: PilotStoreId;
  readonly channel: 'physical' | 'online';
  readonly postalCode: string;
  readonly country: 'ES';
  readonly island: 'tenerife';
}

export interface BasketNeed {
  readonly id: string;
  /** Caller-confirmed brand/variant identity; never inferred from a display name. */
  readonly productKey: string;
  readonly quantityMilli: number;
  readonly unit: Unit;
}

export interface BasketCandidate {
  readonly id: string;
  readonly lineId: string;
  readonly productKey: string;
  readonly equivalence: 'confirmed' | 'unreviewed';
  readonly target: BasketTarget;
  readonly packQuantityMilli: number;
  readonly unit: Unit;
  readonly priceCents: number | null;
  readonly observedOn: string;
  readonly validFrom: string | null;
  readonly validTo: string | null;
  readonly condition: 'unconditional' | 'conditional';
}

export interface BasketQuoteRequest {
  readonly version: 1;
  readonly basis: 'manual' | 'test-fixture';
  /** Explicit calendar day supplied by the caller; the engine never reads a clock. */
  readonly asOf: string;
  readonly target: BasketTarget;
  readonly costs: {
    /** Unknown charges are null; no extra charge must be an explicit zero. */
    readonly additionalCents: number | null;
    /** Unknown order minimum is null; no minimum must be an explicit zero. */
    readonly minimumGoodsCents: number | null;
  };
  readonly lines: readonly BasketNeed[];
  readonly offers: readonly BasketCandidate[];
}

export const MAX_BASKET_LINES = 200;
export const MAX_BASKET_OFFERS = 2000;
export const MAX_BASKET_QUANTITY_MILLI = 1_000_000_000;
export const BASKET_RECENT_DAYS = 7;

export type BasketInputIssue = 'shape' | 'limit' | 'identity' | 'quantity' | 'money' | 'date' | 'target' | 'duplicate';
export interface BasketQuoteInputError { readonly status: 'invalid-input'; readonly reason: BasketInputIssue }
export type BasketExclusionReason = 'equivalence-unreviewed' | 'product-mismatch' | 'target-mismatch'
  | 'unit-mismatch' | 'price-unknown' | 'future-observation' | 'not-yet-valid' | 'expired'
  | 'stale' | 'conditional' | 'numeric-limit';

export interface BasketQuotedLine {
  readonly id: string;
  readonly productKey: string;
  readonly status: 'quoted';
  readonly offerId: string;
  readonly packages: number;
  readonly baseUnit: 'g' | 'ml' | 'ud';
  readonly neededBaseMilli: number;
  readonly purchasedBaseMilli: number;
  readonly leftoverBaseMilli: number;
  readonly goodsOutlayCents: number;
  /** Reduced exact ratio in cents, separate from whole-pack checkout cost. */
  readonly consumedCost: { readonly numerator: string; readonly denominator: string };
  /** Half-up display rounding only; not used to select an offer or sum a basket. */
  readonly consumedCostCents: number;
}

export interface BasketPendingLine {
  readonly id: string;
  readonly productKey: string;
  readonly status: 'pending';
  readonly reasons: readonly ('no-offer' | BasketExclusionReason)[];
}

export interface BasketQuote {
  readonly status: 'calculated';
  readonly basis: 'manual' | 'test-fixture';
  readonly currency: 'EUR';
  readonly priceVerification: 'NOT_VERIFIED';
  readonly target: BasketTarget;
  readonly asOf: string;
  readonly lines: readonly (BasketQuotedLine | BasketPendingLine)[];
  readonly excludedOffers: readonly { readonly offerId: string; readonly lineId: string; readonly reason: BasketExclusionReason }[];
  readonly coverage: {
    readonly status: 'empty' | 'none' | 'partial' | 'complete';
    readonly totalLines: number;
    readonly pricedLines: number;
    /** Exact line-count coverage, not percentage of monetary value. */
    readonly numerator: number;
    readonly denominator: number;
  };
  readonly knownGoodsSubtotalCents: number;
  readonly goodsOutlayCents: number | null;
  /** Never available for empty/partial baskets, unknown fees or unmet/unknown minima. */
  readonly payableTotalCents: number | null;
  readonly qualificationIssues: readonly ('empty-basket' | 'incomplete-coverage' | 'fees-unknown' | 'minimum-unknown' | 'minimum-not-met')[];
}

export type BasketQuoteResult = BasketQuote | BasketQuoteInputError | { readonly status: 'numeric-limit' };
