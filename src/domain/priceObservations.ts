import { appError, errorText } from '../i18n/errors';
import { parseAmount } from './comparisons';
import { UNITS, formatQuantity, parseQuantity, type Unit } from './shopping';

export const SOURCE_KINDS = ['manual', 'demo', 'unknown'] as const;
export const RECENT_DAYS = 7;
export type ObservationSourceKind = typeof SOURCE_KINDS[number];
export type ObservationStatus = 'manual' | 'stale' | 'unknown' | 'demo';

export interface PriceObservation {
  id: string;
  product: string;
  brand: string;
  format: string;
  quality: string;
  store: string;
  quantityMilli: number;
  unit: Unit;
  priceCents: number | null;
  observedOn: string;
  sourceKind: ObservationSourceKind;
  sourceReference: string;
  url: string | null;
}

export interface ObservationInput {
  product: string;
  brand: string;
  format: string;
  quality: string;
  store: string;
  quantity: string;
  unit: Unit;
  price: string;
  observedOn: string;
  sourceKind: ObservationSourceKind;
  sourceReference: string;
  url: string;
}

export interface NormalizedPrice {
  cents: number;
  unitLabel: '€/kg' | '€/L' | '€/ud';
}

export interface ObservationComparison {
  ranked: PriceObservation[];
  excluded: { observation: PriceObservation; reason: string }[];
  bestIds: string[];
  warning?: string;
}

const MAX_CENTS = BigInt(Number.MAX_SAFE_INTEGER);
const DAY_MILLISECONDS = 86_400_000;
const invisibleControls = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F]/u;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function checkedText(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== 'string' || !value.trim()) throw appError("errors.fieldRequired", { label: label });
  const text = value.trim();
  if (text.length > maxLength) throw appError("errors.fieldLength", { label: label, maxLength: maxLength });
  if (invisibleControls.test(text)) throw appError("errors.fieldControls", { label: label });
  return text;
}

function calendarDate(value: unknown, label = errorText("errors.labelDate")): string {
  if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) {
    throw appError("errors.dateFormat", { label: label });
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw appError("errors.dateCalendar", { label: label });
  }
  return value;
}

/** Local calendar date, so the form follows the device's day rather than UTC midnight. */
export function todayISO(now = new Date()): string {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw appError("errors.deviceDate");
  const value = `${now.getFullYear().toString().padStart(4, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
  return calendarDate(value, errorText("errors.labelDeviceDate"));
}

function checkedUnit(value: unknown): Unit {
  if (!(UNITS as readonly unknown[]).includes(value)) throw appError("errors.unitInvalid");
  return value as Unit;
}

function checkedQuantity(value: unknown, unit: Unit): number {
  if (typeof value !== 'number') throw appError("errors.storedQuantity");
  return parseQuantity(formatQuantity(value), unit);
}

function checkedCents(value: unknown): number | null {
  if (value === null) return null;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw appError("errors.priceCents");
  }
  return value;
}

function checkedUrl(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') throw appError("errors.urlInvalid");
  const url = value.trim();
  if (!url) return null;
  if (url.length > 2048 || /[\u0000-\u0020\u007F-\u009F]/u.test(url)) {
    throw appError("errors.urlHttpNoControls");
  }
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) throw new Error();
    return parsed.toString();
  } catch {
    throw appError("errors.urlHttpNoCredentials");
  }
}

function dimension(unit: Unit): 'mass' | 'volume' | 'count' {
  return unit === 'g' || unit === 'kg' ? 'mass' : unit === 'ml' || unit === 'L' ? 'volume' : 'count';
}

function priceRatio(value: Pick<PriceObservation, 'quantityMilli' | 'unit' | 'priceCents'>) {
  if (!value || typeof value !== 'object') throw appError("errors.observationInvalid");
  const unit = checkedUnit(value.unit);
  const quantityMilli = checkedQuantity(value.quantityMilli, unit);
  const priceCents = checkedCents(value.priceCents);
  if (priceCents === null) return null;
  const numerator = BigInt(priceCents) * (unit === 'g' || unit === 'ml' ? 1_000_000n : 1000n);
  const denominator = BigInt(quantityMilli);
  if (numerator > MAX_CENTS * denominator) throw appError("errors.normalizedTooLarge");
  return { numerator, denominator, unitLabel: (dimension(unit) === 'mass' ? '€/kg' : dimension(unit) === 'volume' ? '€/L' : '€/ud') as NormalizedPrice['unitLabel'] };
}

/** The rounded display value is never used to choose the cheapest observation. */
export function normalizedPrice(value: Pick<PriceObservation, 'quantityMilli' | 'unit' | 'priceCents'>): NormalizedPrice | null {
  const ratio = priceRatio(value);
  if (!ratio) return null;
  return { cents: Number((ratio.numerator * 2n + ratio.denominator) / (ratio.denominator * 2n)), unitLabel: ratio.unitLabel };
}

function checkedFields(value: Record<string, unknown>): Omit<PriceObservation, 'id'> {
  const unit = checkedUnit(value.unit);
  if (!(SOURCE_KINDS as readonly unknown[]).includes(value.sourceKind)) {
    throw appError("errors.sourceInvalid");
  }
  const observation: Omit<PriceObservation, 'id'> = {
    product: checkedText(value.product, errorText("errors.labelProduct"), 120),
    brand: checkedText(value.brand, errorText("errors.labelBrand"), 80),
    format: checkedText(value.format, errorText("errors.labelFormat"), 80),
    quality: checkedText(value.quality, errorText("errors.labelQuality"), 120),
    store: checkedText(value.store, errorText("errors.labelStore"), 120),
    quantityMilli: checkedQuantity(value.quantityMilli, unit), unit,
    priceCents: checkedCents(value.priceCents), observedOn: calendarDate(value.observedOn),
    sourceKind: value.sourceKind as ObservationSourceKind,
    sourceReference: checkedText(value.sourceReference, errorText("errors.labelSource"), 300),
    url: checkedUrl(value.url),
  };
  normalizedPrice(observation);
  return observation;
}

/** Strict persisted shape. A clock rollback must not make existing records unreadable. */
export function validatePriceObservation(value: unknown): PriceObservation {
  if (!record(value) || typeof value.id !== 'string' || !value.id || value.id.length > 128 || value.id.trim() !== value.id || invisibleControls.test(value.id)) {
    throw appError("errors.observationId");
  }
  return { id: value.id, ...checkedFields(value) };
}

export function validateObservationInput(input: ObservationInput, today = todayISO()): Omit<PriceObservation, 'id'> {
  if (!record(input) || typeof input.quantity !== 'string' || input.quantity.length > 64 || typeof input.price !== 'string' || input.price.length > 32 ||
      typeof input.observedOn !== 'string' || typeof input.url !== 'string') {
    throw appError("errors.quantityPrice");
  }
  const contextDate = calendarDate(today, errorText("errors.labelReferenceDate"));
  const unit = checkedUnit(input.unit);
  const observation = checkedFields({ ...input,
    quantityMilli: parseQuantity(input.quantity, unit),
    priceCents: input.price.trim() ? parseAmount(input.price) : null,
    observedOn: input.observedOn.trim(),
  });
  if (observation.observedOn > contextDate) throw appError("errors.dateFuture");
  return observation;
}

function statusFor(observation: PriceObservation, today: string): ObservationStatus {
  if (observation.sourceKind === 'demo') return 'demo';
  if (observation.sourceKind === 'unknown' || observation.priceCents === null || observation.observedOn > today) return 'unknown';
  const days = (new Date(`${today}T00:00:00.000Z`).getTime() - new Date(`${observation.observedOn}T00:00:00.000Z`).getTime()) / DAY_MILLISECONDS;
  return days > RECENT_DAYS ? 'stale' : 'manual';
}

/** “manual” means a recent user contribution, never a verified/current shop price. */
export function observationStatus(observation: PriceObservation, today = todayISO()): ObservationStatus {
  return statusFor(validatePriceObservation(observation), calendarDate(today, errorText("errors.labelReferenceDate")));
}

function exclusionReason(observation: PriceObservation, today: string): string | undefined {
  const status = statusFor(observation, today);
  if (status === 'demo') return errorText("errors.reasonDemo");
  if (observation.observedOn > today) return errorText("errors.reasonFuture");
  if (observation.priceCents === null) return errorText("errors.reasonUnknownPrice");
  if (observation.sourceKind === 'unknown') return errorText("errors.reasonUnknownSource");
  if (status === 'stale') return errorText("errors.reasonStale", { days: RECENT_DAYS });
  return undefined;
}

function identity(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
}

function identityMismatch(observation: PriceObservation, reference: PriceObservation): string | undefined {
  if (identity(observation.product) !== identity(reference.product)) return errorText("errors.reasonProduct");
  if (identity(observation.brand) !== identity(reference.brand)) return errorText("errors.reasonBrand");
  if (identity(observation.format) !== identity(reference.format)) return errorText("errors.reasonFormat");
  if (identity(observation.quality) !== identity(reference.quality)) return errorText("errors.reasonQuality");
  if (dimension(observation.unit) !== dimension(reference.unit)) return errorText("errors.reasonUnit");
  return undefined;
}

function compareExact(left: PriceObservation, right: PriceObservation): number {
  const a = priceRatio(left)!;
  const b = priceRatio(right)!;
  const aProduct = a.numerator * b.denominator;
  const bProduct = b.numerator * a.denominator;
  return aProduct < bProduct ? -1 : aProduct > bProduct ? 1 : 0;
}

/** Only declared equivalent, recent manual observations participate. No savings claim is made. */
export function compareObservations(observations: readonly PriceObservation[], referenceId: string, today = todayISO()): ObservationComparison {
  const contextDate = calendarDate(today, errorText("errors.labelReferenceDate"));
  if (!Array.isArray(observations) || observations.length > 2000) throw appError("errors.compareLimit");
  const values = observations.map(validatePriceObservation);
  if (new Set(values.map(value => value.id)).size !== values.length) throw appError("errors.observationIdsRepeated");
  const reference = values.find(observation => observation.id === referenceId);
  if (!reference) return { ranked: [], bestIds: [], warning: errorText("errors.referenceSelect"),
    excluded: values.map(observation => ({ observation, reason: exclusionReason(observation, contextDate) ?? errorText("errors.referenceMissing") })) };
  const referenceIssue = exclusionReason(reference, contextDate);
  if (referenceIssue) return { ranked: [], bestIds: [], warning: errorText("errors.referenceUnfit", { reason: referenceIssue }),
    excluded: values.map(observation => ({ observation, reason: exclusionReason(observation, contextDate) ?? errorText("errors.referenceRecent") })) };

  const ranked: PriceObservation[] = [];
  const excluded: ObservationComparison['excluded'] = [];
  for (const observation of values) {
    const reason = exclusionReason(observation, contextDate) ?? identityMismatch(observation, reference);
    if (reason) excluded.push({ observation, reason });
    else ranked.push(observation);
  }
  ranked.sort(compareExact);
  return { ranked, excluded, bestIds: ranked.filter(observation => compareExact(observation, ranked[0]) === 0).map(observation => observation.id) };
}
