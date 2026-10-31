import { errorMessages } from './catalogs/errors';
import type { Translator } from './types';

export type ErrorKey = keyof typeof errorMessages.es;
export type ErrorValues = Record<string, string | number>;
const own = (value: object, key: PropertyKey): boolean => Object.prototype.hasOwnProperty.call(value, key);

function valuesSnapshot(values: ErrorValues = {}): Readonly<ErrorValues> {
  const result: ErrorValues = Object.create(null) as ErrorValues;
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))) result[key] = value;
  }
  return Object.freeze(result);
}

/** Domain errors retain their Spanish message for backwards compatibility, never a global UI locale. */
export function errorText(code: ErrorKey, values: ErrorValues = {}): string {
  const template = own(errorMessages.es, code) ? errorMessages.es[code] : errorMessages.es['errors.unexpected'];
  return template.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (placeholder, key: string) =>
    own(values, key) ? String(values[key]) : placeholder);
}

export class AppError extends Error {
  readonly code: ErrorKey;
  readonly params: Readonly<ErrorValues>;

  constructor(code: ErrorKey, values: ErrorValues = {}) {
    const params = valuesSnapshot(values);
    super(errorText(code, params));
    this.name = 'AppError';
    this.code = code;
    this.params = params;
  }
}

export function appError(code: ErrorKey, values: ErrorValues = {}): AppError {
  return new AppError(code, values);
}

const exact = new Map<string, ErrorKey>();
const patterns: { code: ErrorKey; expression: RegExp; names: string[]; specificity: number }[] = [];
const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const [rawCode, template] of Object.entries(errorMessages.es)) {
  const code = rawCode as ErrorKey;
  const names = [...template.matchAll(/\{([A-Za-z][A-Za-z0-9_]*)\}/g)].map(match => match[1]);
  if (!names.length) exact.set(template, code);
  else {
    const parts = template.split(/\{[A-Za-z][A-Za-z0-9_]*\}/g);
    // Expressions are constructed only from this static catalog, fully anchored and length-bounded.
    const source = parts.map(escapeRegex).join('([\\s\\S]{0,4000}?)');
    patterns.push({ code, names, expression: new RegExp(`^${source}$`, 'u'), specificity: parts.join('').length });
  }
}
patterns.sort((left, right) => right.specificity - left.specificity);

function translatedValues(values: Readonly<ErrorValues>, t: Translator, depth: number): ErrorValues {
  const result: ErrorValues = Object.create(null) as ErrorValues;
  for (const [key, value] of Object.entries(values)) {
    if (typeof value !== 'string') result[key] = value;
    else if (key === 'detail' || key === 'reason') result[key] = translateMessage(value, t, depth + 1) ?? value;
    else if (key === 'label') {
      const code = exact.get(value);
      result[key] = code && code.startsWith('errors.label') ? t(code) : value;
    } else result[key] = value;
  }
  return result;
}

function translateMessage(message: string, t: Translator, depth: number): string | undefined {
  if (depth > 4 || message.length > 8000) return undefined;
  const code = exact.get(message);
  if (code) return t(code);
  for (const pattern of patterns) {
    const match = message.match(pattern.expression);
    if (!match) continue;
    const values: ErrorValues = Object.create(null) as ErrorValues;
    pattern.names.forEach((name, index) => { values[name] = match[index + 1]; });
    return t(pattern.code, translatedValues(values, t, depth));
  }
  return undefined;
}

/** Adapts old string error state as well as code-bearing errors; never executes markup or a message. */
export function translateAppError(error: unknown, t: Translator): string {
  if (error instanceof AppError && own(errorMessages.es, error.code)) {
    return t(error.code, translatedValues(error.params, t, 0));
  }
  const message = typeof error === 'string' ? error : error instanceof Error ? error.message : '';
  const known = translateMessage(message, t, 0);
  if (known) return known;
  // UI callers may already hold a translated message. Preserve bounded plain string copy;
  // unknown Error objects use the generic message rather than exposing runtime details.
  if (typeof error === 'string' && message.length > 0 && message.length <= 4000 &&
      !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/u.test(message)) return message;
  return t('errors.unexpected');
}
