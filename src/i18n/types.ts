export const LANGUAGES = {
  es: { locale: 'es-ES', name: 'Español' },
  en: { locale: 'en-GB', name: 'English' },
  de: { locale: 'de-DE', name: 'Deutsch' },
  fr: { locale: 'fr-FR', name: 'Français' },
} as const;

export type Language = keyof typeof LANGUAGES;
export const SUPPORTED_LANGUAGES = Object.freeze(Object.keys(LANGUAGES) as Language[]);
export const LANGUAGE_NAMES: Readonly<Record<Language, string>> = Object.freeze({
  es: LANGUAGES.es.name, en: LANGUAGES.en.name, de: LANGUAGES.de.name, fr: LANGUAGES.fr.name,
});
export const DEFAULT_LANGUAGE: Language = 'es';
export const PURCHASE_CURRENCY = 'EUR' as const;
export type TranslationValues = Readonly<Record<string, string | number>>;
export type Translator = (key: string, values?: TranslationValues) => string;
export type Messages = Readonly<Record<string, string>>;
export type MessageCatalog = Readonly<Record<Language, Messages>>;

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(LANGUAGES, value);
}
