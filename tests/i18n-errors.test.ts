import { beforeEach, describe, expect, it, vi } from 'vitest';
import { errorMessages } from '../src/i18n/catalogs/errors';
import { appError, errorText, translateAppError } from '../src/i18n/errors';
import type { Translator } from '../src/i18n/types';
import { validateComparisonName, validateOffer, validateOfferUrl } from '../src/domain/comparisons';
import { parseIngredientText } from '../src/domain/ingredientImport';

const storage = vi.hoisted(() => ({ getItem: vi.fn(), setItem: vi.fn() }));
vi.mock('@react-native-async-storage/async-storage', () => ({ default: storage }));
import { loadComparisons, saveComparisons } from '../src/storage/comparisons';

type Language = keyof typeof errorMessages;
function translator(language: Language): Translator {
  return (key, values = {}) => {
    const table = errorMessages[language] as Record<string, string>;
    const fallback = errorMessages.es as Record<string, string>;
    const text = Object.hasOwn(table, key) ? table[key] : Object.hasOwn(fallback, key) ? fallback[key] : key;
    return text.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (placeholder, name: string) => Object.hasOwn(values, name) ? String(values[name]) : placeholder);
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  storage.getItem.mockResolvedValue(null);
  storage.setItem.mockResolvedValue(undefined);
});

describe('centralized domain errors', () => {
  it('has all four complete catalogs with identical interpolation parameters', () => {
    const keys = Object.keys(errorMessages.es).sort();
    const parameters = (value: string) => [...value.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map(match => match[1]).sort();
    for (const language of ['es', 'en', 'de', 'fr'] as const) {
      expect(Object.keys(errorMessages[language]).sort()).toEqual(keys);
      for (const key of keys as (keyof typeof errorMessages.es)[]) {
        expect(errorMessages[language][key].trim().length).toBeGreaterThan(0);
        expect(parameters(errorMessages[language][key])).toEqual(parameters(errorMessages.es[key]));
      }
    }
  });

  it('preserves Spanish domain messages while translating code-bearing errors', () => {
    const error = appError('errors.ingredientDuplicate', { name: 'My custom ingredient' });
    expect(error.message).toBe('«My custom ingredient» ya aparece en la lista. Elige conservar, añadir por separado o sumar.');
    expect(translateAppError(error, translator('de'))).toContain('„My custom ingredient“ steht bereits auf der Liste');
    expect(translateAppError(error, translator('fr'))).toContain('« My custom ingredient » figure déjà');
  });

  it('translates old stored message strings, nested reasons and field labels', () => {
    const nested = appError('errors.pricePrefix', { detail: errorText('errors.amountInvalid') });
    expect(translateAppError(nested.message, translator('en'))).toBe('Price: Enter an amount of zero or more, with up to two decimal places.');
    const warning = errorText('errors.referenceUnfit', { reason: errorText('errors.reasonStale', { days: 7 }) });
    expect(translateAppError(warning, translator('de'))).toBe('Die Referenz ist für den Vergleich ungeeignet. Veraltete Beobachtung: älter als 7 Tage.');
    const label = appError('errors.fieldRequired', { label: errorText('errors.labelBrand') });
    expect(translateAppError(label, translator('en'))).toBe('Enter the brand.');
  });

  it('snapshots interpolation values and does not expose unknown runtime errors', () => {
    const params = { name: 'Original' };
    const error = appError('errors.ingredientChanged', params);
    params.name = 'Changed later';
    expect(translateAppError(error, translator('en'))).toContain('“Original”');
    expect(translateAppError(new Error('runtime detail that should not be shown'), translator('fr'))).toBe(errorMessages.fr['errors.unexpected']);
    expect(translateAppError('Message déjà traduit', translator('fr'))).toBe('Message déjà traduit');
    expect(translateAppError('x'.repeat(9000), translator('en'))).toBe(errorMessages.en['errors.unexpected']);
  });

  it('uses own properties and leaves product data as plain text', () => {
    const values = JSON.parse('{"__proto__":"bad","name":"<script>user text</script>"}') as Record<string, string>;
    const result = translateAppError(appError('errors.ingredientChanged', values), translator('en'));
    expect(result).toContain('<script>user text</script>');
    expect(({} as { bad?: boolean }).bad).toBeUndefined();
    expect(errorText('__proto__' as never)).toBe(errorMessages.es['errors.unexpected']);
  });
});

describe('multilingual bounded ingredient parser', () => {
  it.each([
    ['Ingredients\ntwo eggs\n500 grams rice', 2000, 'eggs', 'g'],
    ['Zutaten:\nzwei Stück Eier\n500 Gramm Reis', 2000, 'Eier', 'g'],
    ['Ingrédients\ndeux unités œufs\n500 grammes riz', 2000, 'œufs', 'g'],
    ['Ingredientes\ndos huevos\n500 gramos arroz', 2000, 'huevos', 'g'],
  ])('accepts concrete quantities without translating user food names: %s', (text, quantity, name, unit) => {
    const parsed = parseIngredientText(String(text));
    expect(parsed.issues).toEqual([]);
    expect(parsed.ingredients[0]).toMatchObject({ quantityMilli: quantity, name });
    expect(parsed.ingredients[1].unit).toBe(unit);
  });

  it.each(['2 cups rice', '2 Tassen Reis', '2 cuillères riz', '2 tazas arroz', '2 eggs and milk', '2 Eier und Milch', '2 œufs et lait'])('rejects ambiguous or unsupported measures: %s', text => {
    expect(parseIngredientText(text).issues.length).toBeGreaterThan(0);
  });
});

describe('legacy comparison write and open validation', () => {
  const offer = { id: 'o1', store: 'Shop', url: 'https://example.com/product', priceCents: 100, shippingCents: 0 };
  const comparison = { id: 'c1', name: 'Product', offers: [offer] };

  it.each(['https://person:password@example.com/', 'https:\n//example.com/', 'https://example.com/\u202Efile', 'https://example.com/' + 'a'.repeat(2048)])('rejects unsafe newly entered or opened URL: %s', url => {
    expect(() => validateOfferUrl(url)).toThrow();
    expect(() => validateOffer({ store: 'Shop', url, price: '1', shipping: '0' })).toThrow();
  });

  it('retains safe URL normalization and rejects oversized new names', () => {
    expect(validateOfferUrl(' HTTPS://EXAMPLE.COM/a b ')).toBe('https://example.com/a%20b');
    expect(() => validateComparisonName('x'.repeat(121))).toThrow();
    expect(() => validateOffer({ store: 's'.repeat(121), url: offer.url, price: '1', shipping: '0' })).toThrow();
  });

  it('keeps old over-limit names and credential URLs readable and editable without silently removing them', async () => {
    const legacy = { ...comparison, name: 'Old '.repeat(1000), offers: [{ ...offer, url: 'https://person:password@example.com/product' }] };
    const normalized = { ...legacy, name: legacy.name.trim() };
    storage.getItem.mockResolvedValue(JSON.stringify({ version: 1, comparisons: [legacy] }));
    await expect(loadComparisons()).resolves.toEqual([normalized]);
    expect(() => validateOfferUrl(legacy.offers[0].url)).toThrow();
    await saveComparisons([normalized, { id: 'c2', name: 'New', offers: [] }]);
    const saved = JSON.parse(storage.setItem.mock.calls[0][1]);
    expect(saved.comparisons[0]).toEqual(normalized);
  });

  it('does not let normalization bypass control checks on new persisted URLs', async () => {
    await expect(saveComparisons([{ ...comparison, offers: [{ ...offer, url: 'https:\n//example.com/product' }] }])).rejects.toThrow();
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('blocks oversized new collections and preserves unreadable storage on save', async () => {
    const items = Array.from({ length: 101 }, (_, index) => ({ id: `c${index}`, name: `Product ${index}`, offers: [] }));
    await expect(saveComparisons(items)).rejects.toThrow('100');
    expect(storage.setItem).not.toHaveBeenCalled();
    storage.getItem.mockResolvedValue('{bad json');
    await expect(saveComparisons([comparison])).rejects.toThrow('No se han modificado');
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
