import { appError } from '../i18n/errors';
export interface Offer {
  id: string;
  store: string;
  url: string;
  priceCents: number;
  shippingCents: number;
}

export interface Comparison {
  id: string;
  name: string;
  offers: Offer[];
}

export interface OfferInput {
  store: string;
  url: string;
  price: string;
  shipping: string;
}

const euroFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

/** Parse decimal euros without floating-point rounding or implicit grouping. */
export function parseAmount(input: string): number {
  const value = input.trim();
  if (!/^\d+(?:[,.]\d{1,2})?$/.test(value)) {
    throw appError("errors.amountInvalid");
  }
  const [euros, fraction = ''] = value.replace(',', '.').split('.');
  const whole = Number(euros);
  const cents = whole * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(whole) || !Number.isSafeInteger(cents) || cents < 0) {
    throw appError("errors.amountTooLarge");
  }
  return cents;
}

export function formatMoney(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw appError("errors.centsInvalid");
  }
  // Format whole euros separately so even the largest supported value retains
  // its exact cents instead of losing precision through floating-point division.
  const value = BigInt(cents);
  const fraction = (value % 100n).toString().padStart(2, '0');
  return euroFormatter.formatToParts(value / 100n)
    .map((part) => part.type === 'fraction' ? fraction : part.value)
    .join('');
}

export function totalCents(offer: Pick<Offer, 'priceCents' | 'shippingCents'>): number {
  if (![offer.priceCents, offer.shippingCents].every((amount) => Number.isSafeInteger(amount) && amount >= 0)) {
    throw appError("errors.priceShippingInvalid");
  }
  const total = offer.priceCents + offer.shippingCents;
  if (!Number.isSafeInteger(total) || total < 0) {
    throw appError("errors.totalPriceTooLarge");
  }
  return total;
}

export function sortOffers(offers: readonly Offer[]): Offer[] {
  return [...offers].sort((a, b) => totalCents(a) - totalCents(b));
}

export function bestOfferIds(offers: readonly Offer[]): Set<string> {
  if (offers.length === 0) return new Set();
  const minimum = offers.reduce((lowest, offer) => Math.min(lowest, totalCents(offer)), Infinity);
  return new Set(offers.filter((offer) => totalCents(offer) === minimum).map((offer) => offer.id));
}

export function validateComparisonName(value: string): string {
  const name = value.trim();
  if (!name) throw appError("errors.productNameRequired");
  if (name.length > 120) throw appError('errors.productNameLength');
  if (/[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/u.test(name)) throw appError('errors.textControls');
  return name;
}

/** Validate before adding or opening a link; never forward credentials or invisible controls. */
export function validateOfferUrl(input: string): string {
  if (typeof input !== 'string' || input.length > 2048 ||
      /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F]/u.test(input)) {
    throw appError('errors.urlHttpNoCredentials');
  }
  const url = input.trim();
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) throw new Error();
    // Open the same normalized address that passed protocol validation.
    const normalized = parsed.toString();
    if (normalized.length > 2048) throw new Error();
    return normalized;
  } catch {
    throw appError("errors.urlInvalidLegacy");
  }
}

export function validateStoreName(input: string): string {
  const store = input.trim();
  if (!store) throw appError("errors.storeNameRequired");
  if (store.length > 120) throw appError('errors.storeNameLength');
  if (/[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/u.test(store)) throw appError('errors.textControls');
  return store;
}

export function validateOffer(input: OfferInput): Omit<Offer, 'id'> {
  const store = validateStoreName(input.store);
  const url = validateOfferUrl(input.url);
  let priceCents: number;
  let shippingCents: number;
  try {
    priceCents = parseAmount(input.price);
  } catch (error) {
    throw appError("errors.pricePrefix", { detail: (error as Error).message });
  }
  try {
    shippingCents = parseAmount(input.shipping);
  } catch (error) {
    throw appError("errors.shippingPrefix", { detail: (error as Error).message });
  }
  totalCents({ priceCents, shippingCents });
  return { store, url, priceCents, shippingCents };
}
