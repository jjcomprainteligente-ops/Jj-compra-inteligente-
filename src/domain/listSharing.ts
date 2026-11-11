import type { Translator } from '../i18n/types';
import { UNITS, type ShoppingList } from './shopping';

export const MAX_LIST_SHARE_CHARACTERS = 100_000;
export const MAX_LIST_SHARE_BYTES = 256 * 1024;
export const MAX_LIST_SHARE_ITEMS = 2000;

export type ListSharingErrorKey = 'listSharing.error.invalid' | 'listSharing.error.empty' | 'listSharing.error.tooLarge';
export class ListSharingError extends Error {
  constructor(readonly key: ListSharingErrorKey) { super(key); this.name = 'ListSharingError'; }
}

export interface ListShareFormatting {
  t: Translator;
  formatQuantity(quantityMilli: number): string;
  unitLabel(unit: string): string;
  translateName?(name: string): string;
}

export interface PreparedListShare {
  text: string;
  itemCount: number;
  checkedCount: number;
  includeCompleted: boolean;
}

/** Counts UTF-8 bytes without depending on TextEncoder in a native runtime. */
export function listShareByteLength(text: string): number {
  let bytes = 0;
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);
    if (code <= 0x7f) bytes++;
    else if (code <= 0x7ff) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff) {
      const low = text.charCodeAt(++index);
      if (!(low >= 0xdc00 && low <= 0xdfff)) throw new ListSharingError('listSharing.error.invalid');
      bytes += 4;
    } else if (code >= 0xdc00 && code <= 0xdfff) throw new ListSharingError('listSharing.error.invalid');
    else bytes += 3;
  }
  return bytes;
}

function singleLine(value: unknown, maximum: number): string {
  if (typeof value !== 'string' || value.length > maximum) throw new ListSharingError('listSharing.error.invalid');
  listShareByteLength(value);
  // Only the outgoing copy changes: stored names, accents and emoji stay intact.
  const clean = value.replace(/[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069]/g, ' ')
    .replace(/\s+/g, ' ').trim();
  if (!clean.length) throw new ListSharingError('listSharing.error.invalid');
  return clean;
}

/** Projects a reviewed list into plain text. Private fields are never read. */
export function prepareListShare(list: ShoppingList, includeCompleted: boolean, format: ListShareFormatting): PreparedListShare {
  if (!list || typeof list !== 'object' || typeof includeCompleted !== 'boolean' || !Array.isArray(list.items)) {
    throw new ListSharingError('listSharing.error.invalid');
  }
  if (list.items.length > MAX_LIST_SHARE_ITEMS) throw new ListSharingError('listSharing.error.tooLarge');
  const name = singleLine(list.name, 80);
  const lines = ['JJ Compra Inteligente', name, '', format.t(includeCompleted ? 'listSharing.allHeading' : 'listSharing.pendingHeading')];
  let count = 0;
  let checkedCount = 0;
  for (const item of list.items) {
    if (!item || typeof item !== 'object' || typeof item.checked !== 'boolean' ||
      !Number.isSafeInteger(item.quantityMilli) || item.quantityMilli <= 0 || item.quantityMilli > 1_000_000_000 ||
      !(UNITS as readonly unknown[]).includes(item.unit) || (item.unit === 'ud' && item.quantityMilli % 1000 !== 0)) {
      throw new ListSharingError('listSharing.error.invalid');
    }
    const originalName = singleLine(item.name, 120);
    if (!includeCompleted && item.checked) continue;
    const productName = singleLine(format.translateName ? format.translateName(originalName) : originalName, 1000);
    lines.push(format.t('listSharing.line', {
      marker: item.checked ? '[x]' : '[ ]',
      quantity: singleLine(format.formatQuantity(item.quantityMilli), 64),
      unit: singleLine(format.unitLabel(item.unit), 64), name: productName,
    }));
    count++;
    if (item.checked) checkedCount++;
  }
  if (!count) throw new ListSharingError('listSharing.error.empty');
  const text = lines.join('\n');
  if (text.length > MAX_LIST_SHARE_CHARACTERS || listShareByteLength(text) > MAX_LIST_SHARE_BYTES) {
    throw new ListSharingError('listSharing.error.tooLarge');
  }
  return { text, itemCount: count, checkedCount, includeCompleted };
}
