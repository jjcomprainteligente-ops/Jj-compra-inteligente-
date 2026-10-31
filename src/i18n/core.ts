import { DEFAULT_LANGUAGE, LANGUAGES, PURCHASE_CURRENCY, SUPPORTED_LANGUAGES, isLanguage,
  type Language, type MessageCatalog, type Messages, type Translator } from './types';

const own = (value: object, key: string): boolean => Object.prototype.hasOwnProperty.call(value, key);

/** Only known language IDs ever reach Intl or persisted preferences. */
export function languageFromTag(value: unknown): Language | null {
  if (typeof value !== 'string' || value.length > 128) return null;
  const tag = value.trim().replace(/_/g, '-');
  if (!/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(tag)) return null;
  const base = tag.split('-')[0].toLowerCase();
  return isLanguage(base) ? base : null;
}

export function detectLanguage(preferredTags: readonly unknown[]): Language {
  for (const tag of preferredTags) {
    const language = languageFromTag(tag);
    if (language) return language;
  }
  return DEFAULT_LANGUAGE;
}

export function resolveLanguage(preferredTags: readonly unknown[], manualLanguage?: unknown): Language {
  return isLanguage(manualLanguage) ? manualLanguage : detectLanguage(preferredTags);
}

export function mergeMessageCatalogs(...catalogs: readonly MessageCatalog[]): MessageCatalog {
  const merged: Record<Language, Record<string, string>> = { es: {}, en: {}, de: {}, fr: {} };
  for (const language of SUPPORTED_LANGUAGES) {
    for (const catalog of catalogs) {
      for (const key of Object.keys(catalog[language])) {
        if (own(merged[language], key)) throw new Error('Duplicate translation key: ' + key);
        if (key === '__proto__' || key === 'prototype' || key === 'constructor') throw new Error('Unsafe translation key.');
        Object.defineProperty(merged[language], key, { value: catalog[language][key], enumerable: true });
      }
    }
    Object.freeze(merged[language]);
  }
  return Object.freeze(merged);
}

export function createTranslator(language: Language, catalog: MessageCatalog): Translator {
  const selected = isLanguage(language) ? language : DEFAULT_LANGUAGE;
  const numbers = new Intl.NumberFormat(LANGUAGES[selected].locale, { maximumFractionDigits: 20 });
  return (key, values) => {
    const local: Messages = catalog[selected];
    const fallback: Messages = catalog[DEFAULT_LANGUAGE];
    const template = own(local, key) && typeof local[key] === 'string' && local[key].length > 0
      ? local[key] : own(fallback, key) && typeof fallback[key] === 'string' ? fallback[key] : key;
    return template.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (_match, name: string) => {
      if (!values || !own(values, name)) return '—';
      const value = values[name];
      if (typeof value === 'string') return value;
      return typeof value === 'number' && Number.isFinite(value) ? numbers.format(value) : '—';
    });
  };
}

export function createFormatters(language: Language) {
  const locale = LANGUAGES[isLanguage(language) ? language : DEFAULT_LANGUAGE].locale;
  const currency = new Intl.NumberFormat(locale, {
    style: 'currency', currency: PURCHASE_CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
  const quantityInteger = new Intl.NumberFormat(locale, { maximumFractionDigits: 0, useGrouping: false });
  const decimal = new Intl.NumberFormat(locale).formatToParts(1.5).find(part => part.type === 'decimal')?.value ?? ',';
  return {
    locale,
    formatMoney(cents: number): string {
      if (!Number.isSafeInteger(cents)) throw new RangeError('Currency requires integer cents.');
      const raw = BigInt(cents);
      const absolute = raw < 0n ? -raw : raw;
      const integer = absolute / 100n;
      const fraction = (absolute % 100n).toString().padStart(2, '0');
      const negative = raw < 0n;
      const exemplar = negative ? (integer === 0n ? -1n : -integer) : integer;
      // Build from integer parts so even large safe-integer cent amounts retain every cent.
      return currency.formatToParts(exemplar).map(part => {
        if (part.type === 'fraction') return fraction;
        if (negative && integer === 0n && part.type === 'integer') return '0';
        return part.value;
      }).join('');
    },
    formatMoneyInput(cents: number | null): string {
      if (cents === null) return '';
      if (!Number.isSafeInteger(cents)) throw new RangeError('Currency requires integer cents.');
      const raw = BigInt(cents);
      const absolute = raw < 0n ? -raw : raw;
      return (raw < 0n ? '-' : '') + (absolute / 100n).toString() + decimal + (absolute % 100n).toString().padStart(2, '0');
    },
    formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
      if (!Number.isFinite(value)) throw new RangeError('A finite number is required.');
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 20, ...options }).format(value);
    },
    formatQuantity(quantityMilli: number): string {
      if (!Number.isSafeInteger(quantityMilli)) throw new RangeError('Quantity requires integer thousandths.');
      const raw = BigInt(quantityMilli);
      const absolute = raw < 0n ? -raw : raw;
      const integer = absolute / 1000n;
      const fraction = (absolute % 1000n).toString().padStart(3, '0').replace(/0+$/, '');
      return (raw < 0n ? '-' : '') + quantityInteger.format(integer) + (fraction ? decimal + fraction : '');
    },
    formatDate(value: string | Date): string {
      let date: Date;
      let dateOnly = false;
      if (typeof value === 'string') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError('A valid ISO calendar date is required.');
        date = new Date(value + 'T12:00:00.000Z');
        if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new RangeError('A valid ISO calendar date is required.');
        dateOnly = true;
      } else {
        date = value;
        if (!(date instanceof Date) || !Number.isFinite(date.getTime())) throw new RangeError('A valid date is required.');
      }
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric', month: '2-digit', day: '2-digit', ...(dateOnly ? { timeZone: 'UTC' } : {}),
      }).format(date);
    },
  };
}

const categoryKeys: Readonly<Record<string, string>> = Object.freeze({
  'Fruta y verdura': 'common.category.fruitVegetables',
  Despensa: 'common.category.pantry',
  'Lácteos y huevos': 'common.category.dairyEggs',
  'Carne y pescado': 'common.category.meatFish',
  Panadería: 'common.category.bakery', Hogar: 'common.category.household', Otros: 'common.category.other',
});

export function categoryLabel(category: string, t: Translator): string {
  return own(categoryKeys, category) ? t(categoryKeys[category]) : category;
}

export function unitLabel(unit: string, t: Translator): string {
  return unit === 'ud' ? t('common.unit.ud') : unit;
}
