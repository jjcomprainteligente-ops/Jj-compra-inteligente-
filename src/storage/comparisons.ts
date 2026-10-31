import { appError } from '../i18n/errors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type Comparison, type Offer, totalCents, validateComparisonName, validateOfferUrl, validateStoreName } from '../domain/comparisons';

export const STORAGE_KEY = 'jjcompraintelwgiemt.comparisons.v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isCents(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function checkOffer(value: unknown): Offer {
  if (!isRecord(value) || !isId(value.id) || typeof value.store !== 'string' ||
      typeof value.url !== 'string' || !isCents(value.priceCents) || !isCents(value.shippingCents)) {
    throw appError("errors.offerInvalid");
  }
  // Preserve the readable legacy shape. New limits must not hide or erase old records.
  // Unsafe old URLs remain visible for editing, but the UI revalidates before opening.
  let url: string;
  try {
    const parsed = new URL(value.url.trim());
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || !value.store.trim()) throw new Error();
    url = parsed.toString();
  } catch { throw appError('errors.offerInvalid'); }
  const offer: Offer = {
    id: value.id,
    store: value.store.trim(),
    url,
    priceCents: value.priceCents,
    shippingCents: value.shippingCents,
  };
  totalCents(offer);
  return offer;
}

function checkComparisons(value: unknown): Comparison[] {
  if (!Array.isArray(value)) throw appError("errors.comparisonsInvalid");
  const ids = new Set<string>();
  return value.map((item: unknown) => {
    if (!isRecord(item) || !isId(item.id) || typeof item.name !== 'string' || !Array.isArray(item.offers)) {
      throw appError("errors.comparisonInvalid");
    }
    if (ids.has(item.id)) throw appError("errors.comparisonIds");
    ids.add(item.id);
    const offers = item.offers.map(checkOffer);
    if (new Set(offers.map((offer) => offer.id)).size !== offers.length) {
      throw appError("errors.offerIds");
    }
    const name = item.name.trim();
    if (!name) throw appError('errors.productNameRequired');
    return { id: item.id, name, offers };
  });
}

export async function loadComparisons(): Promise<Comparison[]> {
  let stored: string | null;
  try {
    stored = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    throw appError("errors.comparisonsLoad");
  }
  if (stored === null) return [];
  try {
    const parsed: unknown = JSON.parse(stored);
    if (!isRecord(parsed) || parsed.version !== 1) throw new Error();
    return checkComparisons(parsed.comparisons);
  } catch {
    throw appError("errors.comparisonsUnreadable");
  }
}

export async function saveComparisons(value: Comparison[]): Promise<void> {
  const comparisons = checkComparisons(value);
  // Validate newly added or edited fields, while retaining unchanged legacy values.
  // Reading first also prevents a direct save from overwriting an unreadable document.
  const previous = await loadComparisons();
  const previousById = new Map(previous.map(item => [item.id, item]));
  const inputById = new Map(value.map(item => [item.id, item]));
  if (comparisons.length > 100 && comparisons.length > previous.length) throw appError('errors.legacyComparisonsLimit');
  const checkNewId = (id: string) => {
    if (id.length > 128 || id.trim() !== id || /[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/u.test(id)) {
      throw appError('errors.legacyIdInvalid');
    }
  };
  for (const comparison of comparisons) {
    const old = previousById.get(comparison.id);
    if (!old) checkNewId(comparison.id);
    if (old?.name !== comparison.name) validateComparisonName(comparison.name);
    if (comparison.offers.length > 2000 && comparison.offers.length > (old?.offers.length ?? 0)) throw appError('errors.legacyOffersLimit');
    const oldOffers = new Map(old?.offers.map(offer => [offer.id, offer]) ?? []);
    const rawOffers = new Map(inputById.get(comparison.id)?.offers.map(offer => [offer.id, offer]) ?? []);
    for (const offer of comparison.offers) {
      const prior = oldOffers.get(offer.id);
      if (!prior) checkNewId(offer.id);
      if (prior?.store !== offer.store) validateStoreName(offer.store);
      const rawUrl = rawOffers.get(offer.id)?.url ?? offer.url;
      if (prior?.url !== rawUrl) validateOfferUrl(rawUrl);
    }
  }
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, comparisons }));
  } catch {
    throw appError("errors.changesSave");
  }
}
