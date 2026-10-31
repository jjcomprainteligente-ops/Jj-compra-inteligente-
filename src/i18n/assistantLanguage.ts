import { LANGUAGES, PURCHASE_CURRENCY, isLanguage, type Language } from './types';

export interface AssistantLanguageContext {
  language: Language;
  locale: string;
  currency: 'EUR';
  responseInstruction: string;
}

/** Configuration only: no API request, credential, user text, or fabricated source. */
export function assistantLanguageContext(language: Language): Readonly<AssistantLanguageContext> {
  const selected: Language = isLanguage(language) ? language : 'es';
  const instructions: Record<Language, string> = {
    es: 'Responde en español. Mantén la marca JJ Compra Inteligente y usa EUR para compras en Tenerife. No confirmes precios, existencias o acciones sin fuentes y confirmación del usuario.',
    en: 'Respond in English. Keep the JJ Compra Inteligente brand unchanged and use EUR for purchases in Tenerife. Do not confirm prices, stock or actions without sources and user confirmation.',
    de: 'Antworte auf Deutsch. Behalte die Marke JJ Compra Inteligente unverändert bei und verwende EUR für Einkäufe auf Teneriffa. Bestätige keine Preise, Bestände oder Aktionen ohne Quellen und Bestätigung durch den Nutzer.',
    fr: 'Réponds en français. Conserve la marque JJ Compra Inteligente et utilise EUR pour les achats à Tenerife. Ne confirme aucun prix, stock ou action sans sources et confirmation de l’utilisateur.',
  };
  return Object.freeze({ language: selected, locale: LANGUAGES[selected].locale,
    currency: PURCHASE_CURRENCY, responseInstruction: instructions[selected] });
}
