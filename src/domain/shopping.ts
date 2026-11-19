import { appError } from '../i18n/errors';
import { parseAmount } from './comparisons';

export const UNITS = ['ud', 'g', 'kg', 'ml', 'L'] as const;
export type Unit = typeof UNITS[number];

export const CATEGORIES = [
  'Fruta y verdura', 'Despensa', 'Lácteos y huevos', 'Carne y pescado',
  'Panadería', 'Hogar', 'Otros',
] as const;
export type Category = typeof CATEGORIES[number];
export type PriceKind = 'entered' | 'estimated';

export interface ShoppingItem {
  id: string;
  name: string;
  quantityMilli: number;
  unit: Unit;
  category: Category;
  note: string;
  checked: boolean;
  unitPriceCents: number | null;
  priceKind: PriceKind | null;
}

export interface ShoppingList {
  id: string;
  name: string;
  budgetCents: number | null;
  items: ShoppingItem[];
}

export interface ShoppingState {
  lists: ShoppingList[];
  activeListId: string | null;
}

export interface ItemInput {
  name: string;
  quantity: string;
  unit: Unit;
  category: Category;
  note: string;
  price: string;
  priceKind: PriceKind;
}

export interface ShoppingSummary {
  itemCount: number;
  checkedCount: number;
  missingPriceCount: number;
  enteredTotalCents: number;
  estimatedTotalCents: number;
  knownTotalCents: number;
  spentCents: number;
  spentIncompleteCount: number;
  excessCents: number;
}

const MAX_QUANTITY_MILLI = 1_000_000_000;
const MAX_CENTS = BigInt(Number.MAX_SAFE_INTEGER);

function checkQuantity(quantityMilli: number, unit?: Unit): void {
  if (!Number.isSafeInteger(quantityMilli) || quantityMilli <= 0 || quantityMilli > MAX_QUANTITY_MILLI) {
    throw appError("errors.quantityRange");
  }
  if (unit !== undefined && !(UNITS as readonly string[]).includes(unit)) {
    throw appError("errors.unitInvalid");
  }
  if (unit === 'ud' && quantityMilli % 1000 !== 0) {
    throw appError("errors.wholeUnits");
  }
}

function checkCents(cents: number): void {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw appError("errors.centsInvalid");
  }
}

function safeCents(value: bigint): number {
  if (value < 0n || value > MAX_CENTS) throw appError("errors.totalAmountTooLarge");
  return Number(value);
}

function addCents(left: number, right: number): number {
  return safeCents(BigInt(left) + BigInt(right));
}

/** Quantities use thousandths, so kg/litre fractions never need floating-point arithmetic. */
export function parseQuantity(input: string, unit: Unit): number {
  if (!(UNITS as readonly unknown[]).includes(unit)) throw appError("errors.unitInvalid");
  const value = input.trim();
  if (value.length > 32 || !/^\d+(?:[,.]\d{1,3})?$/.test(value)) {
    throw appError("errors.quantityDecimals");
  }
  const [whole, fraction = ''] = value.replace(',', '.').split('.');
  const quantity = BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, '0'));
  if (quantity > BigInt(MAX_QUANTITY_MILLI)) {
    throw appError("errors.quantityTooLarge");
  }
  const quantityMilli = Number(quantity);
  checkQuantity(quantityMilli, unit);
  return quantityMilli;
}

export function formatQuantity(quantityMilli: number): string {
  checkQuantity(quantityMilli);
  const whole = Math.floor(quantityMilli / 1000).toString();
  const fraction = (quantityMilli % 1000).toString().padStart(3, '0').replace(/0+$/, '');
  return fraction ? `${whole},${fraction}` : whole;
}

export function validateListName(input: string): string {
  const name = input.trim();
  if (!name) throw appError("errors.listNameRequired");
  if (name.length > 80) throw appError("errors.listNameLength");
  return name;
}

export function validateBudget(input: string): number | null {
  if (!input.trim()) return null;
  if (input.trim().length > 32) throw appError("errors.budgetTooLarge");
  try { return parseAmount(input); }
  catch (error) { throw appError("errors.budgetPrefix", { detail: (error as Error).message }); }
}

export function validateItemInput(input: ItemInput): Omit<ShoppingItem, 'id' | 'checked'> {
  const name = input.name.trim();
  const note = input.note.trim();
  if (!name) throw appError("errors.productNameRequired");
  if (name.length > 120) throw appError("errors.productNameLength");
  if (note.length > 500) throw appError("errors.noteLength");
  if (!(CATEGORIES as readonly string[]).includes(input.category)) {
    throw appError("errors.categoryInvalid");
  }
  if (!['entered', 'estimated'].includes(input.priceKind)) {
    throw appError("errors.priceKindInvalid");
  }
  const quantityMilli = parseQuantity(input.quantity, input.unit);
  const price = input.price.trim();
  let unitPriceCents: number | null = null;
  if (price) {
    if (price.length > 32) throw appError("errors.priceTooLarge");
    try { unitPriceCents = parseAmount(price); }
    catch (error) { throw appError("errors.pricePrefix", { detail: (error as Error).message }); }
  }
  const item = {
    name, quantityMilli, unit: input.unit, category: input.category, note,
    unitPriceCents, priceKind: unitPriceCents === null ? null : input.priceKind,
  };
  itemTotalCents(item);
  return item;
}

function duplicateName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('es');
}

/** The caller asks the user what to do; detecting a duplicate never merges it. */
export function findDuplicate(items: readonly ShoppingItem[], name: string, unit: Unit, excludeId?: string): ShoppingItem | undefined {
  const normalized = duplicateName(name);
  const dimension = (value: Unit) => value === 'g' || value === 'kg' ? 'mass'
    : value === 'ml' || value === 'L' ? 'volume' : 'count';
  return items.find(item => item.id !== excludeId && dimension(item.unit) === dimension(unit) && duplicateName(item.name) === normalized);
}

/** Per-line total, half-up to the nearest cent after multiplying quantity by unit price. */
export function itemTotalCents(item: Pick<ShoppingItem, 'quantityMilli' | 'unit' | 'unitPriceCents'>): number | null {
  if (!(UNITS as readonly unknown[]).includes(item.unit)) throw appError("errors.unitInvalid");
  checkQuantity(item.quantityMilli, item.unit);
  if (item.unitPriceCents === null) return null;
  checkCents(item.unitPriceCents);
  return safeCents((BigInt(item.quantityMilli) * BigInt(item.unitPriceCents) + 500n) / 1000n);
}

export function summarizeList(list: ShoppingList): ShoppingSummary {
  if (list.budgetCents !== null) checkCents(list.budgetCents);
  const result: ShoppingSummary = {
    itemCount: list.items.length, checkedCount: 0, missingPriceCount: 0,
    enteredTotalCents: 0, estimatedTotalCents: 0, knownTotalCents: 0,
    spentCents: 0, spentIncompleteCount: 0, excessCents: 0,
  };
  for (const item of list.items) {
    const total = itemTotalCents(item);
    if ((total === null) !== (item.priceKind === null) ||
        (item.priceKind !== null && item.priceKind !== 'entered' && item.priceKind !== 'estimated')) {
      throw appError("errors.priceOriginMismatch");
    }
    if (item.checked) result.checkedCount++;
    if (total === null) result.missingPriceCount++;
    else if (item.priceKind === 'entered') result.enteredTotalCents = addCents(result.enteredTotalCents, total);
    else result.estimatedTotalCents = addCents(result.estimatedTotalCents, total);
    if (item.checked && item.priceKind === 'entered' && total !== null) {
      result.spentCents = addCents(result.spentCents, total);
    } else if (item.checked) result.spentIncompleteCount++;
  }
  result.knownTotalCents = addCents(result.enteredTotalCents, result.estimatedTotalCents);
  result.excessCents = list.budgetCents === null ? 0 : Math.max(0, result.knownTotalCents - list.budgetCents);
  return result;
}
