import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { LEGACY_RECIPES, RECIPES } from '../src/data/recipes';
import { V83_RECIPES, V83_RECIPE_METADATA } from '../src/data/recipesV83';
import { combineIngredients, createMealPlan, normalizeIngredientName, scaleRecipe, validateMealPlan } from '../src/domain/menus';
import { defaultMenuFilters, filterRecipes } from '../src/domain/menuFilters';
import { formatQuantity, parseQuantity } from '../src/domain/shopping';
import { createTranslator } from '../src/i18n/core';
import { localizedRecipe } from '../src/i18n/recipes';
import { resources } from '../src/i18n/resources';
import { SUPPORTED_LANGUAGES, type Language } from '../src/i18n/types';

// CI reads the public source subset, whose records preserve the supplied source
// values. The complete 150-record original remains private because it contains
// held recipes; its separate local audit is not claimed as a CI fixture check.
// No importer or application code is executed to read this bounded archive.
const sourceArchive = new URL('../referencias/recetas-v83/fuente-publica/JJ_V83_120_RECETAS_FUENTE_PUBLICA.zip', import.meta.url);
const sourceArchiveSha256 = '5b310f4111b6b1a7bd21a32560b0283518e9d8bdb4e169da2715c51d69778b62';
const originalArchiveSha256 = '151e4fed4021e8e15b2a7b51a74dd3dfa342be8f1294fa33d8745c597ec00034';
const sourceJsonPath = '120_RECETAS_FUENTE_ORIGINAL.json';
const legacyDigest = '2361d9fc72d0dd8f728df489a0cdececb1b1fd854bd709ab841c7846f0b26c81';
const digest = (value: Uint8Array | string) => createHash('sha256').update(value).digest('hex');
function stableJSON(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(stableJSON).join(',') + ']';
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return '{' + Object.keys(record).sort().map(key => JSON.stringify(key) + ':' + stableJSON(record[key])).join(',') + '}';
  }
  return JSON.stringify(value);
}

/** Read the fixed, small fixture in memory; no extraction, paths or subprocesses. */
function members(bytes: Buffer): Map<string, Buffer> {
  if (bytes.length > 2_000_000) throw new Error('Unexpected fixture size');
  let end = -1;
  for (let cursor = bytes.length - 22; cursor >= Math.max(0, bytes.length - 65_557); cursor--) {
    if (bytes.readUInt32LE(cursor) === 0x06054b50) { end = cursor; break; }
  }
  if (end < 0 || bytes.readUInt16LE(end + 4) || bytes.readUInt16LE(end + 6)) throw new Error('Unsupported fixture archive');
  const count = bytes.readUInt16LE(end + 10);
  if (count > 50 || count !== bytes.readUInt16LE(end + 8)) throw new Error('Unexpected fixture entries');
  let cursor = bytes.readUInt32LE(end + 16);
  const found = new Map<string, Buffer>();
  for (let index = 0; index < count; index++) {
    if (bytes.readUInt32LE(cursor) !== 0x02014b50) throw new Error('Invalid fixture directory');
    const flags = bytes.readUInt16LE(cursor + 8), method = bytes.readUInt16LE(cursor + 10);
    const compressed = bytes.readUInt32LE(cursor + 20), size = bytes.readUInt32LE(cursor + 24);
    const nameLength = bytes.readUInt16LE(cursor + 28), extraLength = bytes.readUInt16LE(cursor + 30);
    const commentLength = bytes.readUInt16LE(cursor + 32), local = bytes.readUInt32LE(cursor + 42);
    const name = bytes.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8');
    if (flags & 1 || ![0, 8].includes(method) || size > 6_000_000 || found.has(name)) throw new Error('Unsafe fixture member');
    if (name.startsWith('/') || name.split('/').includes('..') || name.includes('\\')) throw new Error('Unsafe fixture path');
    if (bytes.readUInt32LE(local) !== 0x04034b50) throw new Error('Invalid fixture local entry');
    const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
    if (start + compressed > bytes.length) throw new Error('Truncated fixture entry');
    const payload = bytes.subarray(start, start + compressed);
    const decoded = method === 0 ? Buffer.from(payload) : inflateRawSync(payload, { maxOutputLength: 6_000_000 });
    if (decoded.length !== size) throw new Error('Invalid fixture member size');
    found.set(name, decoded);
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return found;
}

interface SourceIngredient {
  line: number; name: string; quantity: number | null; unit: string | null;
  source_name_es: string; source_unit_es: string | null; optional?: boolean;
}
interface SourceTranslation {
  recipe_id: string; language: string; title: string; servings: number;
  preparation_and_cooking_min: number | null; ingredients: SourceIngredient[];
  steps: string[]; warnings: string[];
  optional_serving_accompaniments?: { explanation: string; add_to_shopping_list: boolean };
}
interface SourceRecipe {
  id: string; position_catalog: number; source_sha256: string;
  translations: Record<Language | 'bg', SourceTranslation>;
}

interface PublicProvenance {
  schemaVersion: number;
  originalIntegrity: { archiveSha256: string; catalogSha256: string; embeddedWorkbookSha256: string };
  originalSourceRecipes: number;
  originalSourceLocalizedRecords: number;
  sourceLanguages: string[];
  selectedRecipes: { id: string; positionCatalog: number; recordSha256: string }[];
  reservedRecipes: { id: string; positionCatalog: number; reason: string; recordSha256: string }[];
}

const originalBytes = readFileSync(sourceArchive);
const originalMembers = members(originalBytes);
const sourceRecipes = JSON.parse(originalMembers.get(sourceJsonPath)!.toString('utf8')) as SourceRecipe[];
const provenance = JSON.parse(originalMembers.get('PROVENIENCIA.json')!.toString('utf8')) as PublicProvenance;
const sourceById = new Map(sourceRecipes.map(recipe => [recipe.id, recipe]));
const heldPosition = (position: number) => position >= 11 && position <= 20 || position >= 31 && position <= 40 || position >= 111 && position <= 120;
const expectedAvailable = sourceRecipes.filter(recipe => !heldPosition(recipe.position_catalog));

// Decimal conversion independent of application parsing, scaling and import code.
function sourceMilli(quantity: number): number {
  const text = String(quantity);
  if (!/^\d+(?:\.\d{1,3})?$/.test(text)) throw new Error('Unexpected source precision');
  const [whole, fraction = ''] = text.split('.');
  return Number(whole) * 1000 + Number(fraction.padEnd(3, '0'));
}

describe('V83 source provenance and conservative availability', () => {
  it('pins the public source archive and records the original audit provenance without exposing held recipe content', () => {
    expect(digest(originalBytes)).toBe(sourceArchiveSha256);
    expect([...originalMembers.keys()].sort()).toEqual(['120_RECETAS_FUENTE_ORIGINAL.json', 'PROVENIENCIA.json']);
    expect(provenance).toMatchObject({ schemaVersion: 1, originalSourceRecipes: 150, originalSourceLocalizedRecords: 750 });
    expect(provenance.originalIntegrity).toMatchObject({
      archiveSha256: originalArchiveSha256,
      catalogSha256: '57d209dc52ea9488477fde89c04ee6e21f8d36d8f793702990a0087eb59bb94e',
      embeddedWorkbookSha256: 'dfa8e15c6471c862933eb5f6cd81fd1f9e00489f889088cf41f6fa18280c09a1',
    });
    expect(provenance.sourceLanguages).toEqual(['es', 'en', 'de', 'fr', 'bg']);
    expect(provenance.selectedRecipes.map(entry => [entry.id, entry.positionCatalog]))
      .toEqual(sourceRecipes.map(recipe => [recipe.id, recipe.position_catalog]));
    for (const recipe of sourceRecipes) {
      const record = provenance.selectedRecipes.find(entry => entry.id === recipe.id)!;
      expect(digest(stableJSON(recipe)), recipe.id).toBe(record.recordSha256);
    }
    const reservedPositions = Array.from({ length: 150 }, (_, index) => index + 1).filter(heldPosition);
    expect(provenance.reservedRecipes.map(entry => entry.positionCatalog)).toEqual(reservedPositions);
    expect(new Set(provenance.reservedRecipes.map(entry => entry.id)).size).toBe(30);
    for (const entry of provenance.reservedRecipes) {
      expect(Object.keys(entry).sort()).toEqual(['id', 'positionCatalog', 'reason', 'recordSha256']);
      expect(entry.reason.trim()).not.toBe('');
      expect(entry.recordSha256).toMatch(/^[a-f0-9]{64}$/);
      expect(sourceById.has(entry.id), entry.id).toBe(false);
    }
  });

  it('retains all 120 selected source records in five complete languages, including Bulgarian in reserve', () => {
    expect(sourceRecipes).toHaveLength(120);
    expect(new Set(sourceRecipes.map(recipe => recipe.id)).size).toBe(120);
    expect(sourceRecipes.map(recipe => recipe.position_catalog))
      .toEqual(Array.from({ length: 150 }, (_, index) => index + 1).filter(position => !heldPosition(position)));
    for (const recipe of sourceRecipes) {
      expect(Object.keys(recipe.translations).sort(), recipe.id).toEqual(['bg', 'de', 'en', 'es', 'fr']);
      for (const [language, translation] of Object.entries(recipe.translations)) {
        expect(translation, recipe.id + '/' + language).toMatchObject({ recipe_id: recipe.id, language });
        expect(translation.title.trim()).not.toBe('');
        expect(translation.steps.length).toBeGreaterThan(0);
        expect(translation.warnings.length).toBeGreaterThan(0);
      }
    }
    expect(SUPPORTED_LANGUAGES).toEqual(['es', 'en', 'de', 'fr']);
  });

  it('exposes precisely the 120 eligible positions while retaining the seven previous identities unchanged', () => {
    expect(V83_RECIPES.map(recipe => recipe.id)).toEqual(expectedAvailable.map(recipe => recipe.id));
    expect(V83_RECIPES).toHaveLength(120);
    expect(Object.keys(V83_RECIPE_METADATA).sort()).toEqual(expectedAvailable.map(recipe => recipe.id).sort());
    expect(LEGACY_RECIPES).toHaveLength(7);
    expect(digest(JSON.stringify(LEGACY_RECIPES))).toBe(legacyDigest);
    expect(RECIPES.slice(0, 7)).toEqual(LEGACY_RECIPES);
    expect(RECIPES).toHaveLength(127);
    expect(new Set(RECIPES.map(recipe => recipe.id)).size).toBe(127);
    for (const source of provenance.reservedRecipes) {
      expect(RECIPES.some(recipe => recipe.id === source.id), source.id).toBe(false);
      expect(Object.keys(resources.es).some(key => key.startsWith('recipesV83.' + source.id + '.')), source.id).toBe(false);
    }
    expect(createMealPlan(2).recipeIds).toEqual(['arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate']);
    expect(validateMealPlan({ servings: 4, recipeIds: V83_RECIPES.slice(0, 5).map(recipe => recipe.id) }).recipeIds)
      .toEqual(V83_RECIPES.slice(0, 5).map(recipe => recipe.id));
  });
});

describe('V83 culinary transfer without invented measurements, times or claims', () => {
  it('preserves every measured source line and quantity, and records source units independently of shopping units', () => {
    for (const recipe of V83_RECIPES) {
      const source = sourceById.get(recipe.id)!, translation = source.translations.es;
      const metadata = V83_RECIPE_METADATA[recipe.id];
      const measured = translation.ingredients.filter(ingredient => ingredient.quantity !== null);
      expect(metadata.positionCatalog, recipe.id).toBe(source.position_catalog);
      expect(metadata.sourceSha256, recipe.id).toBe(source.source_sha256);
      expect(metadata.sourceIngredientLines, recipe.id).toEqual(measured.map(ingredient => ingredient.line));
      expect(metadata.sourceUnits, recipe.id).toEqual(measured.map(ingredient => ingredient.source_unit_es));
      expect(recipe.baseServings, recipe.id).toBe(translation.servings);
      expect(recipe.minutes, recipe.id).toBe(translation.preparation_and_cooking_min);
      expect(recipe.ingredients, recipe.id).toHaveLength(measured.length);
      recipe.ingredients.forEach((ingredient, index) => {
        const original = measured[index];
        expect(ingredient.quantityMilli, recipe.id + ':' + original.line).toBe(sourceMilli(original.quantity!));
        expect(ingredient.unit).toBe(original.unit === 'l' ? 'L' : ['g', 'kg', 'ml', 'L'].includes(original.unit!) ? original.unit : 'ud');
        expect(ingredient).not.toHaveProperty('price');
        expect(ingredient).not.toHaveProperty('unitPriceCents');
        expect(ingredient).not.toHaveProperty('priceKind');
      });
    }
  });

  it('displays all three unmeasured salts but never adds an invented unit to the shopping proposal', () => {
    for (const id of ['JJ-E03-004', 'JJ-E03-007', 'JJ-E03-010']) {
      const recipe = V83_RECIPES.find(recipe => recipe.id === id)!;
      const unmeasured = sourceById.get(id)!.translations.es.ingredients.filter(ingredient => ingredient.quantity === null);
      expect(unmeasured).toHaveLength(1);
      expect(V83_RECIPE_METADATA[id].unmeasuredIngredientLines).toEqual(unmeasured.map(ingredient => ingredient.line));
      expect(recipe.unmeasuredIngredients?.map(ingredient => ingredient.name)).toEqual(['sal']);
      expect(scaleRecipe(recipe, 4).some(ingredient => normalizeIngredientName(ingredient.name) === 'sal')).toBe(false);
    }
    const almogrote = V83_RECIPES.find(recipe => recipe.id === 'JJ-E03-001')!;
    expect(almogrote.editorialNotes).toContain(sourceById.get(almogrote.id)!.translations.es.optional_serving_accompaniments!.explanation);
    expect(almogrote.ingredients).toHaveLength(6);
    expect(almogrote.ingredients.some(ingredient => /pan|papas/i.test(ingredient.name))).toBe(false);
  });

  it('retains explicit fraction precision and the four 250 g osso-buco pieces as pieces', () => {
    const paella = V83_RECIPES.find(recipe => recipe.id === 'JJ-E03-004')!;
    expect(paella.ingredients.find(ingredient => ingredient.name.toLocaleLowerCase('es') === 'azafrán')).toMatchObject({ quantityMilli: 200, unit: 'g' });
    expect(scaleRecipe(paella, 1).find(ingredient => ingredient.name.toLocaleLowerCase('es') === 'azafrán')).toMatchObject({ quantityMilli: 50, unit: 'g' });
    const osso = V83_RECIPES.find(recipe => recipe.id === 'JJ-E13-137')!;
    expect(osso.ingredients[0]).toMatchObject({ quantityMilli: 4000, unit: 'ud' });
    expect(osso.ingredients[0].name).toContain('250 g');
    expect(scaleRecipe(osso, 1)[0]).toMatchObject({ quantityMilli: 1000, unit: 'ud' });
  });

  it('keeps a garlic clove distinct from a whole-item manual garlic suggestion', () => {
    const recipe = V83_RECIPES.find(recipe => recipe.id === 'JJ-E03-001')!;
    const clove = scaleRecipe(recipe, recipe.baseServings).find(ingredient => ingredient.name.startsWith('ajo'))!;
    expect(clove.unit).toBe('ud');
    expect(clove.name).toContain('diente');
    const wholeGarlic = { ...clove, name: 'ajo', quantityMilli: 1000, rounded: false };
    const combined = combineIngredients([clove, wholeGarlic]);
    expect(combined).toHaveLength(2);
    expect(combined.map(ingredient => ingredient.name)).toEqual([clove.name, 'ajo']);
  });

  it.each([1, 2, 4, 12])('scales every available source recipe for %s people into valid nonzero shopping quantities without mutation', servings => {
    const before = JSON.stringify(V83_RECIPES);
    for (const recipe of V83_RECIPES) {
      const scaled = scaleRecipe(recipe, servings);
      expect(scaled, recipe.id).toHaveLength(recipe.ingredients.length);
      scaled.forEach(ingredient => {
        expect(Number.isSafeInteger(ingredient.quantityMilli), recipe.id + '/' + ingredient.name).toBe(true);
        expect(ingredient.quantityMilli).toBeGreaterThan(0);
        expect(parseQuantity(formatQuantity(ingredient.quantityMilli), ingredient.unit)).toBe(ingredient.quantityMilli);
        expect(ingredient).not.toHaveProperty('unitPriceCents');
      });
    }
    expect(JSON.stringify(V83_RECIPES)).toBe(before);
  });

  it('does not infer dietary suitability or pass an unknown cooking time through a timed filter', () => {
    const any = defaultMenuFilters();
    expect(filterRecipes(V83_RECIPES, any)).toHaveLength(120);
    expect(filterRecipes(V83_RECIPES, { ...any, preference: 'vegan' })).toEqual([]);
    expect(filterRecipes(V83_RECIPES, { ...any, preference: 'vegetarian' })).toEqual([]);
    const unknown = new Set(V83_RECIPES.filter(recipe => recipe.minutes === null).map(recipe => recipe.id));
    expect(unknown.size).toBeGreaterThan(0);
    for (const recipe of filterRecipes(V83_RECIPES, { ...any, maxMinutes: 60 })) {
      expect(unknown.has(recipe.id), recipe.id).toBe(false);
      expect(recipe.minutes).not.toBeNull();
      expect(recipe.minutes!).toBeLessThanOrEqual(60);
    }
  });

  it('rejects missing unmeasured ingredient entries through the catalogue validation error', () => {
    const incomplete = { ...V83_RECIPES[0], unmeasuredIngredients: Array(2) };
    expect(() => filterRecipes([incomplete], defaultMenuFilters())).toThrow('menuFilters.catalogInvalid');
  });
});

describe('V83 translations are contextual and preserve the received culinary information', () => {
  it.each(SUPPORTED_LANGUAGES)('localizes all 120 recipes in %s from the received translation without changing canonical objects', language => {
    const before = JSON.stringify(RECIPES), t = createTranslator(language, resources);
    for (const recipe of V83_RECIPES) {
      const source = sourceById.get(recipe.id)!.translations[language];
      const view = localizedRecipe(recipe, t), metadata = V83_RECIPE_METADATA[recipe.id];
      expect(view.id, recipe.id).toBe(recipe.id);
      expect(view.title, recipe.id).toBe(source.title);
      expect(view.steps, recipe.id).toEqual(source.steps);
      expect(view.allergenNote, recipe.id).toBe(source.warnings.join('\n\n'));
      expect(view.minutes, recipe.id).toBe(recipe.minutes);
      expect(view.baseServings, recipe.id).toBe(source.servings);
      view.ingredients.forEach((ingredient, index) => {
        const original = source.ingredients.find(ingredient => ingredient.line === metadata.sourceIngredientLines[index])!;
        expect(ingredient.name, recipe.id + ':' + original.line).toContain(original.name);
        expect(ingredient.quantityMilli).toBe(recipe.ingredients[index].quantityMilli);
        expect(ingredient.unit).toBe(recipe.ingredients[index].unit);
      });
      const unmeasured = source.ingredients.filter(ingredient => ingredient.quantity === null);
      expect(view.unmeasuredIngredients?.map(ingredient => ingredient.name) ?? [], recipe.id).toEqual(unmeasured.map(ingredient => ingredient.name));
      for (const text of [view.title, view.allergenNote, ...view.steps, ...view.ingredients.map(ingredient => ingredient.name), ...(view.editorialNotes ?? [])]) {
        expect(text, recipe.id).not.toMatch(/^(?:recipesV83|menus|recipes)\.[\w.-]+$/);
        expect(text, recipe.id).not.toContain('\uFFFD');
      }
    }
    expect(JSON.stringify(RECIPES)).toBe(before);
  });

  it('falls back to the original Spanish title if a selected-language resource is absent', () => {
    const recipe = V83_RECIPES[0], key = 'recipesV83.' + recipe.id + '.title';
    const selected = Object.fromEntries(Object.entries(resources.de).filter(([name]) => name !== key));
    const t = createTranslator('de', { ...resources, de: selected });
    expect(localizedRecipe(recipe, t).title).toBe(sourceById.get(recipe.id)!.translations.es.title);
  });
});
