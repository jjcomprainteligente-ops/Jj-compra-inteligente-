import { appError } from '../i18n/errors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CATEGORIES, UNITS, formatQuantity, itemTotalCents, summarizeList,
  validateItemInput, validateListName,
  type Category, type PriceKind, type ShoppingItem, type ShoppingList,
  type ShoppingState, type Unit,
} from '../domain/shopping';

export const STORAGE_KEY = 'jjcompraintelwgiemt.shopping.v1';

export function emptyShoppingState(): ShoppingState {
  return { lists: [], activeListId: null };
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function identifier(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 128 && value.trim() === value;
}

function cents(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function checkItem(value: unknown, itemIds: Set<string>): ShoppingItem {
  if (!record(value) || !identifier(value.id) || itemIds.has(value.id) ||
      typeof value.name !== 'string' || typeof value.note !== 'string' ||
      typeof value.checked !== 'boolean' || typeof value.quantityMilli !== 'number' ||
      !(UNITS as readonly unknown[]).includes(value.unit) ||
      !(CATEGORIES as readonly unknown[]).includes(value.category) ||
      (value.unitPriceCents !== null && !cents(value.unitPriceCents)) ||
      (value.priceKind !== null && value.priceKind !== 'entered' && value.priceKind !== 'estimated') ||
      ((value.unitPriceCents === null) !== (value.priceKind === null))) {
    throw appError("errors.storedItem");
  }
  // Validate text and quantities without turning stored integer cents into floats.
  const validated = validateItemInput({
    name: value.name, note: value.note, quantity: formatQuantity(value.quantityMilli),
    unit: value.unit as Unit, category: value.category as Category, price: '', priceKind: 'entered',
  });
  const item: ShoppingItem = {
    ...validated, id: value.id, checked: value.checked,
    unitPriceCents: value.unitPriceCents as number | null, priceKind: value.priceKind as PriceKind | null,
  };
  itemTotalCents(item);
  itemIds.add(item.id);
  return item;
}

function checkState(value: unknown): ShoppingState {
  if (!record(value) || !Array.isArray(value.lists) || value.lists.length > 100 ||
      (value.activeListId !== null && !identifier(value.activeListId))) {
    throw appError("errors.shoppingState");
  }
  const listIds = new Set<string>();
  const itemIds = new Set<string>();
  const lists: ShoppingList[] = value.lists.map((entry: unknown) => {
    if (!record(entry) || !identifier(entry.id) || listIds.has(entry.id) ||
        typeof entry.name !== 'string' || !Array.isArray(entry.items) || entry.items.length > 2000 ||
        (entry.budgetCents !== null && !cents(entry.budgetCents))) {
      throw appError("errors.storedList");
    }
    const list: ShoppingList = {
      id: entry.id, name: validateListName(entry.name), budgetCents: entry.budgetCents as number | null,
      items: entry.items.map(item => checkItem(item, itemIds)),
    };
    summarizeList(list);
    listIds.add(list.id);
    return list;
  });
  if (value.activeListId !== null && !listIds.has(value.activeListId as string)) {
    throw appError("errors.activeList");
  }
  return { lists, activeListId: value.activeListId as string | null };
}

export async function loadShopping(): Promise<ShoppingState> {
  let serialized: string | null;
  try { serialized = await AsyncStorage.getItem(STORAGE_KEY); }
  catch { throw appError("errors.shoppingLoad"); }
  if (serialized === null) return emptyShoppingState();
  let parsed: unknown;
  try { parsed = JSON.parse(serialized); }
  catch { throw appError("errors.shoppingUnreadable"); }
  if (record(parsed) && typeof parsed.version === 'number' && parsed.version !== 1) {
    throw appError("errors.shoppingVersion");
  }
  try {
    if (!record(parsed) || parsed.version !== 1) throw new Error();
    return checkState(parsed.state);
  } catch {
    throw appError("errors.shoppingUnreadable");
  }
}

export async function saveShopping(state: ShoppingState): Promise<void> {
  const validated = checkState(state);
  try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, state: validated })); }
  catch { throw appError("errors.shoppingSave"); }
}
