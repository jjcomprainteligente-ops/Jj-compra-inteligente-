import { describe, expect, it } from 'vitest';
import {
  listShareByteLength, MAX_LIST_SHARE_BYTES, MAX_LIST_SHARE_CHARACTERS, MAX_LIST_SHARE_ITEMS, prepareListShare,
} from '../src/domain/listSharing';
import type { ShoppingItem, ShoppingList } from '../src/domain/shopping';
import { createFormatters, createTranslator, unitLabel } from '../src/i18n/core';
import { resources } from '../src/i18n/resources';
import { listSharingMessages } from '../src/i18n/catalogs/listSharing';
import type { Language } from '../src/i18n/types';

function item(overrides: Partial<ShoppingItem> = {}): ShoppingItem {
  return { id: 'PRIVATE_ITEM_ID', name: 'Café crème — Größe / ñ 😀', quantityMilli: 1250, unit: 'kg',
    category: 'Otros', checked: false, note: 'PRIVATE_NOTE', unitPriceCents: 1973, priceKind: 'entered', ...overrides };
}
function list(items: ShoppingItem[] = [item()]): ShoppingList {
  return { id: 'PRIVATE_LIST_ID', name: 'Mi lista — été / Ä / ñ', budgetCents: 98765431, items };
}
function formatting(language: Language = 'es') {
  const t = createTranslator(language, resources);
  return { t, formatQuantity: createFormatters(language).formatQuantity, unitLabel: (unit: string) => unitLabel(unit, t) };
}

describe('reviewed shopping list projection', () => {
  it.each(['es', 'en', 'de', 'fr'] as const)('formats exact quantities and labels in %s without private fields', language => {
    const source = list([item(), item({ name: 'Leche de prueba', quantityMilli: 250, unit: 'L' }),
      item({ name: 'Tomate de prueba', quantityMilli: 500000, unit: 'g' }),
      item({ name: 'Agua de prueba', quantityMilli: 250000, unit: 'ml' }),
      item({ name: 'Pan de prueba', quantityMilli: 3000, unit: 'ud', checked: true })]);
    const original = structuredClone(source);
    const pending = prepareListShare(source, false, formatting(language));
    const decimal = language === 'en' ? '.' : ',';
    expect(pending.text).toContain('JJ Compra Inteligente\nMi lista — été / Ä / ñ\n');
    expect(pending.text).toContain(`1${decimal}25 kg Café crème — Größe / ñ 😀`);
    expect(pending.text).toContain(`0${decimal}25 L Leche de prueba`);
    expect(pending.text).toContain('500 g Tomate de prueba');
    expect(pending.text).toContain('250 ml Agua de prueba');
    expect(pending.text).not.toContain('Pan de prueba');
    for (const secret of ['PRIVATE_ITEM_ID', 'PRIVATE_LIST_ID', 'PRIVATE_NOTE', '1973', '98765431', 'Otros', 'entered']) {
      expect(pending.text).not.toContain(secret);
    }
    expect(pending).toMatchObject({ itemCount: 4, checkedCount: 0, includeCompleted: false });
    const all = prepareListShare(source, true, formatting(language));
    expect(all.text).toContain(`[x] 3 ${formatting(language).unitLabel('ud')} Pan de prueba`);
    expect(all).toMatchObject({ itemCount: 5, checkedCount: 1, includeCompleted: true });
    expect(source).toEqual(original);
  });

  it('never reads notes, prices, identifiers, budget or unknown properties', () => {
    const source = list();
    for (const [object, names] of [[source, ['id', 'budgetCents', 'token']],
      [source.items[0], ['id', 'note', 'unitPriceCents', 'priceKind', 'category', 'password']]] as const) {
      for (const name of names) Object.defineProperty(object, name, { get() { throw new Error('Private field read'); } });
    }
    expect(prepareListShare(source, false, formatting()).text).toContain('Café crème');
  });

  it('keeps one line per product and preserves accents, emoji and literal markup in the outgoing copy', () => {
    const source = list([item({ name: 'Été\n[x] autre\r\n汉字\t😀\u2028fin\u202e\u061c', unit: 'ud', quantityMilli: 1000 }),
      item({ name: '<img src=x onerror="alert(1)">', quantityMilli: 1000, unit: 'ud' })]);
    source.name = '  Liste\r\nété\u2066 / Grüße  ';
    const original = structuredClone(source);
    const copy = prepareListShare(source, false, formatting());
    expect(copy.text.split('\n')).toHaveLength(6);
    expect(copy.text).toContain('Liste été / Grüße');
    expect(copy.text).toContain('Été [x] autre 汉字 😀 fin');
    expect(copy.text).toContain('<img src=x onerror="alert(1)">');
    expect(copy.text).not.toMatch(/[\r\t\u061c\u2028\u202e\u2066]/);
    expect(source).toEqual(original);
  });

  it('uses presentation translation without rewriting a canonical saved name', () => {
    const source = list([item({ name: 'Zanahoria' })]);
    const output = prepareListShare(source, false, { ...formatting('de'), translateName: () => 'Karotte' });
    expect(output.text).toContain('Karotte');
    expect(source.items[0].name).toBe('Zanahoria');
  });

  it('preserves decomposed Unicode rather than normalising stored or outgoing text', () => {
    const name = 'Cafe\u0301';
    expect(prepareListShare(list([item({ name })]), false, formatting()).text).toContain(name);
  });

  it.each([{ items: [] }, { items: [item({ checked: true })] }])('does not create an empty pending copy', ({ items }) => {
    expect(() => prepareListShare(list(items), false, formatting())).toThrowError(expect.objectContaining({ key: 'listSharing.error.empty' }));
  });

  it.each([
    { quantityMilli: 0 }, { quantityMilli: -1 }, { quantityMilli: 1.5 }, { quantityMilli: NaN },
    { quantityMilli: 1_000_000_001 }, { quantityMilli: Number.MAX_SAFE_INTEGER + 1 },
    { quantityMilli: 1500, unit: 'ud' }, { unit: 'unknown' }, { checked: 'yes' },
    { name: '' }, { name: '\n\t' }, { name: 'a'.repeat(121) }, { name: '\ud800' }, { name: '\udc00' },
  ])('rejects invalid public item fields before delivery: %j', overrides => {
    const source = list([item(overrides as Partial<ShoppingItem>)]);
    expect(() => prepareListShare(source, false, formatting())).toThrowError(expect.objectContaining({ key: 'listSharing.error.invalid' }));
  });

  it('rejects invalid hidden items instead of silently accepting a corrupt list', () => {
    const source = list([item(), item({ checked: true, quantityMilli: 0 })]);
    expect(() => prepareListShare(source, false, formatting())).toThrowError(expect.objectContaining({ key: 'listSharing.error.invalid' }));
  });

  it('rejects too many products without truncating the outgoing copy', () => {
    expect(() => prepareListShare(list(Array.from({ length: MAX_LIST_SHARE_ITEMS + 1 }, () => item())), false, formatting()))
      .toThrowError(expect.objectContaining({ key: 'listSharing.error.tooLarge' }));
  });

  it('enforces the character bound on an otherwise valid list', () => {
    const source = list(Array.from({ length: 1000 }, () => item({ name: 'A'.repeat(120), quantityMilli: 1000, unit: 'ud' })));
    expect(source.items.reduce((sum, entry) => sum + entry.name.length, 0)).toBeGreaterThan(MAX_LIST_SHARE_CHARACTERS);
    expect(() => prepareListShare(source, false, formatting())).toThrowError(expect.objectContaining({ key: 'listSharing.error.tooLarge' }));
  });

  it('enforces the UTF-8 bound even when the character bound has not been reached', () => {
    const source = list(Array.from({ length: 780 }, () => item({ name: '漢'.repeat(112), quantityMilli: 1000, unit: 'ud' })));
    const roughText = source.items.map(entry => '[ ] 1 ud ' + entry.name).join('\n');
    expect(roughText.length).toBeLessThan(MAX_LIST_SHARE_CHARACTERS);
    expect(listShareByteLength(roughText)).toBeGreaterThan(MAX_LIST_SHARE_BYTES);
    expect(() => prepareListShare(source, false, formatting())).toThrowError(expect.objectContaining({ key: 'listSharing.error.tooLarge' }));
  });
});

describe('bounded UTF-8 and language resources', () => {
  it('counts mixed Unicode exactly without a browser encoder', () => {
    expect(listShareByteLength('Aé漢😀')).toBe(10);
    expect(listShareByteLength('e\u0301')).toBe(3);
    expect(listShareByteLength('')).toBe(0);
  });
  it.each(['\ud800', '\ud800a', '\udc00'])('rejects malformed UTF-16 %j', text => {
    expect(() => listShareByteLength(text)).toThrowError(expect.objectContaining({ key: 'listSharing.error.invalid' }));
  });
  it('provides the same complete keys in all four languages', () => {
    const expected = Object.keys(listSharingMessages.es).sort();
    for (const language of ['es', 'en', 'de', 'fr'] as const) {
      expect(Object.keys(listSharingMessages[language]).sort()).toEqual(expected);
      expect(Object.values(listSharingMessages[language]).every(message => message.trim().length > 0)).toBe(true);
    }
  });
});
