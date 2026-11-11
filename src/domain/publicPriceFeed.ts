/**
 * Public, attributed retail price indicators. Not a live retailer feed.
 * tuTándem (CC BY 4.0): https://tutandem.es/datos
 * Prices represent median price per standard unit, not an individual SKU,
 * a Tenerife-specific basket, inventory, or a contractual retail quote.
 */
import type { ShoppingItem } from './shopping';

export const PUBLIC_PRICE_DATA_URL = 'https://tutandem.es/datos/cesta-diaria.csv';
export const PUBLIC_PRICE_ATTRIBUTION_URL = 'https://tutandem.es/datos';
export type PublicPriceChain = 'hiperdino' | 'mercadona';
export type StandardUnit = 'kg' | 'L' | 'ud';

export interface PublicPrice {
  id: string;
  date: string;
  productId: string;
  product: string;
  category: string;
  unit: StandardUnit;
  chain: PublicPriceChain;
  centsPerUnit: number;
}

/** CSV reader respects quoted commas and double-quote escaping. */
function csvLines(input: string): string[][] {
  const result: string[][] = [];
  let cells: string[] = [], cell = '', quoted = false;
  const normalized = input.replace(/^\uFEFF/, '');
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (char === '"' && quoted && normalized[i + 1] === '"') { cell += '"'; i++; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === ',' && !quoted) { cells.push(cell); cell = ''; continue; }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && normalized[i + 1] === '\n') i++;
      cells.push(cell); cell = '';
      if (cells.some(v => v.trim())) result.push(cells);
      cells = [];
      continue;
    }
    cell += char;
  }
  if (quoted) throw new Error('Invalid CSV quotation');
  cells.push(cell);
  if (cells.some(v => v.trim())) result.push(cells);
  return result;
}

export function normalizePublicName(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}

function normalizeChain(input: string): PublicPriceChain | null {
  const key = normalizePublicName(input).replace(/ /g, '');
  return key === 'hiperdino' ? 'hiperdino' : key === 'mercadona' ? 'mercadona' : null;
}

function normalizeUnit(input: string): StandardUnit | null {
  const key = normalizePublicName(input).replace(/ /g, '');
  if (['kg', 'kilo', 'kilogramo', 'kilogramos'].includes(key)) return 'kg';
  if (['l', 'litro', 'litros'].includes(key)) return 'L';
  if (['ud', 'unidad', 'unidades', 'u'].includes(key)) return 'ud';
  return null;
}

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const REQUIRED_COLUMNS = ['fecha', 'producto', 'nombre', 'unidad', 'cadena', 'precio_por_unidad_eur'] as const;

export function parsePublicPrices(csv: string): PublicPrice[] {
  if (csv.length > 2_000_000) throw new Error('Public price source exceeds size limit');
  const rows = csvLines(csv);
  if (!rows.length) throw new Error('Public price source is empty');
  const headers = rows[0].map(value => value.trim().toLowerCase());
  if (!REQUIRED_COLUMNS.every(column => headers.includes(column))) {
    throw new Error('Public price source schema has changed');
  }
  const at = (cells: string[], name: string) => (cells[headers.indexOf(name)] ?? '').trim();
  const latest = new Map<string, PublicPrice>();
  for (const cells of rows.slice(1)) {
    const chain = normalizeChain(at(cells, 'cadena'));
    const unit = normalizeUnit(at(cells, 'unidad'));
    const date = at(cells, 'fecha');
    const id = at(cells, 'producto');
    const product = at(cells, 'nombre');
    const euroAmount = at(cells, 'precio_por_unidad_eur');
    const euros = Number(euroAmount);
    const cents = Math.round(euros * 100);
    if (!chain || !unit || !DATE_FORMAT.test(date) || !id || !product ||
      !euroAmount || !Number.isFinite(euros) || euros <= 0 ||
      !Number.isSafeInteger(cents) || cents <= 0 || cents > 10_000_000) continue;
    if (Number.isNaN(Date.parse(date + 'T00:00:00Z'))) continue;
    const record: PublicPrice = {
      id: chain + ':' + id + ':' + unit, date, productId: id, product,
      category: at(cells, 'grupo'), unit, chain, centsPerUnit: cents,
    };
    const key = chain + ':' + normalizePublicName(id) + ':' + unit;
    const previous = latest.get(key);
    if (!previous || record.date > previous.date) latest.set(key, record);
  }
  return [...latest.values()].sort((a, b) =>
    a.product.localeCompare(b.product, 'es') || a.chain.localeCompare(b.chain));
}

export function priceAgeDays(date: string, now = new Date()): number {
  const timestamp = Date.parse(date + 'T00:00:00Z');
  if (!Number.isFinite(timestamp)) return Infinity;
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.floor((todayUtc - timestamp) / 86_400_000);
}

export function isComparablePublicPrice(entry: PublicPrice, now = new Date()): boolean {
  const age = priceAgeDays(entry.date, now);
  return age >= 0 && age <= 7;
}

export function publicPriceGroups(records: readonly PublicPrice[]): Array<{
  key: string; product: string; unit: StandardUnit; prices: PublicPrice[];
}> {
  const groups = new Map<string, { key: string; product: string; unit: StandardUnit; prices: PublicPrice[] }>();
  for (const record of records) {
    const key = normalizePublicName(record.product) + ':' + record.unit;
    const previous = groups.get(key);
    if (previous) previous.prices.push(record);
    else groups.set(key, { key, product: record.product, unit: record.unit, prices: [record] });
  }
  return [...groups.values()];
}

/** Conservative match: never equate variants, brands or incompatible dimensions. */
export function estimateListLine(item: ShoppingItem, group: ReturnType<typeof publicPriceGroups>[number]): number | null {
  const itemName = normalizePublicName(item.name);
  const publicName = normalizePublicName(group.product);
  if (!itemName || !(itemName === publicName || (itemName.length >= 5 && publicName.startsWith(itemName + ' ')))) return null;
  let quantity: number;
  if (group.unit === 'kg') {
    if (item.unit !== 'kg' && item.unit !== 'g') return null;
    quantity = item.quantityMilli / (item.unit === 'kg' ? 1000 : 1_000_000);
  } else if (group.unit === 'L') {
    if (item.unit !== 'L' && item.unit !== 'ml') return null;
    quantity = item.quantityMilli / (item.unit === 'L' ? 1000 : 1_000_000);
  } else {
    if (item.unit !== 'ud') return null;
    quantity = item.quantityMilli / 1000;
  }
  return Number.isFinite(quantity) && quantity > 0 ? quantity : null;
}
