import { appError, errorText } from '../i18n/errors';
import { canonicalMeasure, normalizeIngredientName } from './menus';
import {
  formatQuantity, parseQuantity, validateItemInput,
  type Category, type ShoppingItem, type ShoppingList, type Unit,
} from './shopping';

export interface ParsedIngredient {
  name: string;
  quantityMilli: number;
  unit: Unit;
  category: Category;
  note: string;
  rounded?: boolean;
}

export interface IngredientDraft {
  id: string;
  name: string;
  quantity: string;
  unit: Unit;
  category: Category;
  note: string;
  included: boolean;
  decision: 'pending' | 'skip' | 'separate' | 'combine';
  targetId?: string;
}

export interface ImportIssue { line: number; message: string }
export interface IngredientParseResult { ingredients: ParsedIngredient[]; issues: ImportIssue[] }

const MAX_TEXT_LENGTH = 6000;
const MAX_INGREDIENTS = 50;
const MAX_QUANTITY_MILLI = 1_000_000_000n;
const numberWords: Record<string, string> = {
  un: '1', uno: '1', una: '1', dos: '2', tres: '3', cuatro: '4', cinco: '5',
  seis: '6', siete: '7', ocho: '8', nueve: '9', diez: '10', once: '11', doce: '12',
  one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7',
  eight: '8', nine: '9', ten: '10', eleven: '11', twelve: '12',
  ein: '1', eine: '1', einen: '1', eins: '1', zwei: '2', drei: '3', vier: '4',
  fünf: '5', fuenf: '5', sechs: '6', sieben: '7', acht: '8', neun: '9', zehn: '10',
  elf: '11', zwölf: '12', zwoelf: '12',
  une: '1', deux: '2', trois: '3', quatre: '4', cinq: '5', sept: '7', huit: '8',
  neuf: '9', dix: '10', onze: '11', douze: '12',
};
const fractions: Record<string, string> = { '1/2': '0,5', '1/4': '0,25', '3/4': '0,75', '¼': '0,25', '½': '0,5', '¾': '0,75' };
const unitPrefix = /^(kilogramos?|kilograms?|kilogramm|kilogrammes?|kgs?|kilos?|gramos?|grams?|gramm|grammes?|grs?|g|mililitros?|milliliters?|millilitres?|ml|litros?|liters?|litres?|lts?|l|unidad(?:es)?|units?|pieces?|pièces?|pcs?|stück|stueck|stk|unités?|uds?)(?=\s|\.|$)\.?\s*(?:de\s+)?(.*)$/iu;
const quantityPrefix = /^((?:\d+(?:[,.]\d+)?(?:\/\d+)?|[¼½¾])(?=\s|\p{L}|$)|(?:uno|una|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|ein|eine|einen|eins|zwei|drei|vier|fünf|fuenf|sechs|sieben|acht|neun|zehn|elf|zwölf|zwoelf|une|deux|trois|quatre|cinq|sept|huit|neuf|dix|onze|douze)(?=\s|$))\s*(.*)$/iu;

function unitFor(value: string): Unit {
  const normalized = value.toLocaleLowerCase('es');
  if (/^(kg|kil)/.test(normalized)) return 'kg';
  if (/^(g|gr)/.test(normalized)) return 'g';
  if (/^(ml|mili|milli)/.test(normalized)) return 'ml';
  if (/^(l|lt|litro)/.test(normalized)) return 'L';
  return 'ud';
}

function ingredientFromLine(line: string): ParsedIngredient {
  if (/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(line)) {
    throw appError("errors.ingredientControls");
  }
  if (/[<>\[\]{}]|https?:\/\/|www\.|```/iu.test(line)) {
    throw appError("errors.ingredientCode");
  }
  if (/[€$£]|\b(?:euros?|dolares?|dólares?)\b/iu.test(line)) {
    throw appError("errors.ingredientPrices");
  }
  if (/\b(?:al gusto|a gusto|cantidad necesaria|c\s*\/\s*n|to taste|as needed|nach Geschmack|nach Bedarf|au goût|à volonté)\b/iu.test(line) ||
      /(?:^|\s)[+-]\s*\d|\d\s*[-–—]\s*\d|\b\d+\s+(?:o|or|oder|ou)\s+\d+\b/iu.test(line)) {
    throw appError("errors.ingredientConcrete");
  }
  const prefix = line.match(quantityPrefix);
  let quantity = '1';
  let name = line;
  let unit: Unit = 'ud';
  let note = errorText("errors.quantityProposed");
  if (prefix) {
    const token = prefix[1].toLocaleLowerCase('es');
    quantity = numberWords[token] ?? fractions[token] ?? token;
    name = prefix[2].trim();
    const measure = name.match(unitPrefix);
    if (measure) {
      unit = unitFor(measure[1]);
      name = measure[2].trim();
      note = '';
    } else {
      if (/^(?:tazas?|cucharadas?|cucharaditas?|cdas?|cditas?|pizcas?|vasos?|onzas?|oz|libras?|lbs?|cups?|tablespoons?|teaspoons?|tbsp|tsp|pinch|pinches|tassen?|esslöffel|teelöffel|el|tl|prise[n]?|tasses?|cuillères?|pincées?|mg|cl|dl)\b/iu.test(name)) {
        throw appError("errors.measureConvert");
      }
      note = errorText("errors.unitProposed");
    }
  }
  if (!name || !/\p{L}/u.test(name)) throw appError("errors.ingredientMissingName");
  if (/[,;]|\b(?:y|o|and|or|und|oder|et|ou)\b/iu.test(name) || /\d/.test(name)) {
    throw appError("errors.ingredientPerLine");
  }
  // Unknown measurements and free-form sentences stay visible as issues instead of guesses.
  if (/^(?:necesito|necesitamos|compra|comprar|añade|añadir|quiero|quiero comprar|i need|we need|buy|add|ich brauche|wir brauchen|kaufe|hinzufügen|acheter|ajouter|je veux|il faut)\b/iu.test(name) || /[:=]/.test(name)) {
    throw appError("errors.ingredientOnly");
  }
  const validated = validateItemInput({ name, quantity, unit, category: 'Otros', note, price: '', priceKind: 'entered' });
  return { name: validated.name, quantityMilli: validated.quantityMilli, unit: validated.unit, category: validated.category, note: validated.note };
}

/** A bounded local parser. The caller must resolve every issue before opening confirmation. */
export function parseIngredientText(text: string): IngredientParseResult {
  if (typeof text !== 'string' || text.length > MAX_TEXT_LENGTH) {
    return { ingredients: [], issues: [{ line: 0, message: errorText("errors.importTextLength") }] };
  }
  const lines = text.split(/\r\n?|\n|\u2028|\u2029/).flatMap((line, index) => line.split(';').map(part => ({
    line: index + 1,
    text: part.trim().replace(/^(?:[-*•]\s+|\d+[.)]\s+)/u, '').trim(),
  }))).filter(value => value.text && !/^#{0,6}\s*(?:ingredientes?|lista(?: de compra)?|ingredients?|shopping list|zutaten|einkaufsliste|ingrédients?|liste de courses)\s*:?(?:\s*)$/iu.test(value.text));
  if (!lines.length) return { ingredients: [], issues: [{ line: 0, message: errorText("errors.importEmpty") }] };
  if (lines.length > MAX_INGREDIENTS) {
    return { ingredients: [], issues: [{ line: 0, message: errorText("errors.importCount") }] };
  }
  const ingredients: ParsedIngredient[] = [];
  const issues: ImportIssue[] = [];
  for (const line of lines) {
    try { ingredients.push(ingredientFromLine(line.text)); }
    catch (error) { issues.push({ line: line.line, message: error instanceof Error ? error.message : errorText("errors.importUnknown") }); }
  }
  return { ingredients, issues };
}

export function matchingItems(list: ShoppingList, name: string, unit: Unit): ShoppingItem[] {
  const normalized = normalizeIngredientName(name);
  const dimension = canonicalMeasure(1000, unit).dimension;
  return list.items.filter(item => normalizeIngredientName(item.name) === normalized && canonicalMeasure(item.quantityMilli, item.unit).dimension === dimension);
}

function validId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 128 && value.trim() === value;
}

function checkedDrafts(drafts: IngredientDraft[]) {
  if (!Array.isArray(drafts) || drafts.length > MAX_INGREDIENTS) throw appError("errors.importCount");
  const ids = new Set<string>();
  const validated = drafts.flatMap(draft => {
    if (!draft || !validId(draft.id) || ids.has(draft.id) || typeof draft.included !== 'boolean' ||
        !['pending', 'skip', 'separate', 'combine'].includes(draft.decision) ||
        (draft.targetId !== undefined && !validId(draft.targetId))) {
      throw appError("errors.reviewInvalid");
    }
    ids.add(draft.id);
    if (!draft.included || draft.decision === 'skip') return [];
    if (typeof draft.name !== 'string' || typeof draft.quantity !== 'string' || typeof draft.note !== 'string') {
      throw appError("errors.ingredientFields");
    }
    const item = validateItemInput({ ...draft, price: '', priceKind: 'entered' });
    return [{ draft, item }];
  });
  if (!validated.length) throw appError("errors.ingredientSelect");
  return validated;
}

/** Validates a complete review against the current list, producing an immutable result. */
export function applyIngredientReview(list: ShoppingList, drafts: IngredientDraft[], idFactory: () => string): ShoppingList {
  const validated = checkedDrafts(drafts);
  if (typeof idFactory !== 'function') throw appError("errors.ingredientCreate");
  let next: ShoppingList = { ...list, items: list.items.map(item => ({ ...item })) };
  const ids = new Set(list.items.map(item => item.id));
  let changed = false;
  for (const { draft, item } of validated) {
    const matches = matchingItems(next, item.name, item.unit);
    if (matches.length && draft.decision === 'pending') {
      throw appError("errors.ingredientDuplicate", { name: item.name });
    }
    if (draft.decision === 'combine') {
      const target = matches.length === 1 ? matches[0] : undefined;
      if (!target || target.id !== draft.targetId) {
        throw appError("errors.ingredientChanged", { name: item.name });
      }
      if (target.checked || target.unitPriceCents !== null || target.priceKind !== null) {
        throw appError("errors.ingredientProtected", { name: item.name });
      }
      const oldBase = BigInt(canonicalMeasure(target.quantityMilli, target.unit).quantityMilli);
      const addedBase = BigInt(canonicalMeasure(item.quantityMilli, item.unit).quantityMilli);
      const factor = target.unit === 'kg' || target.unit === 'L' ? 1000n : 1n;
      const baseTotal = oldBase + addedBase;
      if (baseTotal % factor !== 0n) {
        throw appError("errors.ingredientPrecision", { name: item.name, unit: target.unit });
      }
      const quantityMilli = baseTotal / factor;
      if (quantityMilli > MAX_QUANTITY_MILLI) throw appError("errors.ingredientCombinedTooLarge", { name: item.name });
      // Reuse the shopping constraints; existing notes, category, price and checked state stay intact.
      parseQuantity(formatQuantity(Number(quantityMilli)), target.unit);
      next = { ...next, items: next.items.map(previous => previous.id === target.id ? { ...previous, quantityMilli: Number(quantityMilli) } : previous) };
    } else {
      const id = idFactory();
      if (!validId(id) || ids.has(id)) throw appError("errors.idUnique");
      ids.add(id);
      next.items.push({ ...item, id, checked: false });
    }
    changed = true;
  }
  if (!changed) throw appError("errors.ingredientNone");
  return next;
}
