import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { LEGACY_RECIPES, RECIPES } from '../src/data/recipes';
import { V3_RECIPES, V3_RECIPE_METADATA } from '../src/data/recipesV3';
import { V83_RECIPES, V83_RECIPE_METADATA } from '../src/data/recipesV83';
import { v83RecipeMessages } from '../src/i18n/catalogs/recipesV83';
import { v3RecipeMessages } from '../src/i18n/catalogs/recipesV3';
import { createMealPlan, scaleRecipe, validateMealPlan } from '../src/domain/menus';
import { defaultMenuFilters, filterRecipes } from '../src/domain/menuFilters';
import { formatQuantity, parseQuantity } from '../src/domain/shopping';
import { createTranslator } from '../src/i18n/core';
import { localizedRecipe, translateIngredientName } from '../src/i18n/recipes';
import { resources } from '../src/i18n/resources';
import { SUPPORTED_LANGUAGES, type Language } from '../src/i18n/types';

interface SourceIngredient { line: number; name: string; quantity: number | null; unit: string | null; quantity_text?: string }
interface SourceView {
  title: string; servings: number; preparation_and_cooking_min: number | null;
  ingredients: SourceIngredient[]; steps: string[]; warnings: string[];
}
interface SourceRecipe {
  recipe_id: string; position: number; source_v83_sha256: string;
  localized: Record<Language | 'bg', SourceView>;
  can_publish_recipe_text: boolean; can_publish_photo: boolean;
  can_claim_allergen_safe: boolean; can_publish_real_price: boolean;
}

const archive = readFileSync(new URL('../referencias/recetas/V3/APP_LIGERO_10MB/JJ_V3_APP_DATOS_150_RECETAS_5_IDIOMAS.zip', import.meta.url));
const archiveSHA256 = 'e5654006ec2c6716b1cac8cdabbdca2f08422d31ba0982e9b3a888c02e874270';
const sourceMember = 'datos/recetas_150_5_idiomas_editorial_comercial_v3.json';

// Independent bounded ZIP fixture reader. It reads one JSON entry; no XLSX,
// scripts, formulas, paths or image data supplied in the archive are executed.
function sourceJSON(bytes: Buffer): SourceRecipe[] {
  if (bytes.length !== 1_994_471 || createHash('sha256').update(bytes).digest('hex') !== archiveSHA256) throw new Error('V3 fixture changed');
  let end = -1;
  for (let at = bytes.length - 22; at >= Math.max(0, bytes.length - 65_557); at--) {
    if (bytes.readUInt32LE(at) === 0x06054b50) { end = at; break; }
  }
  if (end < 0 || bytes.readUInt16LE(end + 4) || bytes.readUInt16LE(end + 6)) throw new Error('Invalid V3 fixture ZIP');
  const count = bytes.readUInt16LE(end + 10);
  if (count < 1 || count > 100) throw new Error('Unexpected V3 fixture count');
  let cursor = bytes.readUInt32LE(end + 16), found: Buffer | undefined;
  for (let index = 0; index < count; index++) {
    if (bytes.readUInt32LE(cursor) !== 0x02014b50) throw new Error('Invalid V3 fixture directory');
    const flags = bytes.readUInt16LE(cursor + 8), method = bytes.readUInt16LE(cursor + 10);
    const compressed = bytes.readUInt32LE(cursor + 20), size = bytes.readUInt32LE(cursor + 24);
    const nameLength = bytes.readUInt16LE(cursor + 28), extraLength = bytes.readUInt16LE(cursor + 30), commentLength = bytes.readUInt16LE(cursor + 32);
    const name = bytes.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8');
    if (name === sourceMember) {
      if (found || flags & 1 || ![0, 8].includes(method) || size > 8 * 1024 * 1024) throw new Error('Invalid V3 fixture JSON');
      const local = bytes.readUInt32LE(cursor + 42);
      if (bytes.readUInt32LE(local) !== 0x04034b50) throw new Error('Invalid V3 fixture local header');
      const start = local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
      if (start + compressed > bytes.length) throw new Error('Truncated V3 fixture');
      const payload = bytes.subarray(start, start + compressed);
      found = method === 0 ? Buffer.from(payload) : inflateRawSync(payload, { maxOutputLength: 8 * 1024 * 1024 });
      if (found.length !== size) throw new Error('V3 fixture size mismatch');
    }
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  if (!found) throw new Error('Missing V3 fixture JSON');
  return JSON.parse(found.toString('utf8')) as SourceRecipe[];
}
const source = sourceJSON(archive);
const sourceByID = new Map(source.map(row => [row.recipe_id, row]));
const historicalIDs = new Set(V83_RECIPES.map(recipe => recipe.id));

function independentMilli(value: number): number {
  const spelling = String(value);
  if (!/^\d+(?:\.\d{1,3})?$/.test(spelling)) throw new Error('Unexpected V3 quantity precision');
  const [whole, decimals = ''] = spelling.split('.');
  return Number(whole) * 1000 + Number(decimals.padEnd(3, '0'));
}

describe('approved V3 catalogue integrates without losing historical recipes', () => {
  it('retains 150 unique source IDs and 750 complete source views with commercial claims disabled', () => {
    expect(source).toHaveLength(150);
    expect(sourceByID.size).toBe(150);
    expect(source.map(row => row.position)).toEqual(Array.from({ length: 150 }, (_, index) => index + 1));
    for (const row of source) {
      expect(Object.keys(row.localized).sort(), row.recipe_id).toEqual(['bg', 'de', 'en', 'es', 'fr']);
      expect(row, row.recipe_id).toMatchObject({ can_publish_recipe_text: true, can_publish_photo: true, can_claim_allergen_safe: false, can_publish_real_price: false });
    }
    expect(SUPPORTED_LANGUAGES).toEqual(['es', 'en', 'de', 'fr']);
  });

  it('extends the active catalogue once to 157 records and preserves all seven legacy records and the default plan', () => {
    expect(V3_RECIPES.map(recipe => recipe.id)).toEqual(source.map(row => row.recipe_id));
    expect(RECIPES.slice(0, 7)).toEqual(LEGACY_RECIPES);
    expect(RECIPES.slice(7)).toEqual(V3_RECIPES);
    expect(RECIPES).toHaveLength(157);
    expect(new Set(RECIPES.map(recipe => recipe.id)).size).toBe(157);
    expect(V3_RECIPES.filter(recipe => !historicalIDs.has(recipe.id))).toHaveLength(30);
    expect(createMealPlan(2).recipeIds).toEqual(['arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate']);
  });

  it('keeps every field, metadata row and translation value of the historical 120 projected recipes', () => {
    const current = new Map(V3_RECIPES.map(recipe => [recipe.id, recipe]));
    for (const recipe of V83_RECIPES) {
      expect(current.get(recipe.id), recipe.id).toEqual(recipe);
      expect(V3_RECIPE_METADATA[recipe.id], recipe.id).toEqual(V83_RECIPE_METADATA[recipe.id]);
    }
    for (const language of SUPPORTED_LANGUAGES) {
      for (const [key, value] of Object.entries(v83RecipeMessages[language])) {
        expect(v3RecipeMessages[language][key], language + '/' + key).toBe(value);
      }
    }
  });

  it.each(SUPPORTED_LANGUAGES)('retains existing saved-list label priorities in %s when new recipes share a Spanish name', language => {
    const t = createTranslator(language, resources);
    // These source labels have differing translations in the newly added
    // recipes. Existing lists retain their previous contextual wording.
    const priorLabels = [
      ['cilantro fresco', 'recipesV83.JJ-E03-022.ingredient.8'],
      ['cebolleta', 'recipesV83.JJ-E03-025.ingredient.5'],
      ['salsa de soja', 'recipesV83.JJ-E03-026.ingredient.6'],
      ['queso feta', 'recipesV83.JJ-E04-205.ingredient.1'],
      ['apio', 'recipesV83.JJ-E04-214.ingredient.3'],
      ['kecap manis', 'recipesV83.JJ-E06-169.ingredient.4'],
      ['aceite de oliva virgen extra', 'recipesV83.JJ-E07-057.ingredient.3'],
    ];
    for (const [name, originalKey] of priorLabels) {
      expect(translateIngredientName(name, t), name).toBe(v83RecipeMessages[language][originalKey]);
    }
  });

  it('preserves each source measure, unknown time, step, warning and unmeasured ingredient for all 150 recipes', () => {
    for (const recipe of V3_RECIPES) {
      const row = sourceByID.get(recipe.id)!, view = row.localized.es, metadata = V3_RECIPE_METADATA[recipe.id];
      const measured = view.ingredients.filter(ingredient => ingredient.quantity !== null);
      const unmeasured = view.ingredients.filter(ingredient => ingredient.quantity === null);
      expect(recipe.baseServings, recipe.id).toBe(view.servings);
      expect(recipe.minutes, recipe.id).toBe(view.preparation_and_cooking_min);
      expect(recipe.steps, recipe.id).toEqual(view.steps);
      expect(recipe.allergenNote, recipe.id).toBe(view.warnings.join('\n\n'));
      expect(metadata.positionCatalog, recipe.id).toBe(row.position);
      expect(metadata.sourceSha256, recipe.id).toBe(row.source_v83_sha256);
      expect(metadata.sourceIngredientLines, recipe.id).toEqual(measured.map(ingredient => ingredient.line));
      expect(recipe.ingredients, recipe.id).toHaveLength(measured.length);
      recipe.ingredients.forEach((ingredient, index) => {
        const supplied = measured[index];
        expect(ingredient.name, recipe.id).toContain(supplied.name);
        expect(ingredient.quantityMilli, recipe.id).toBe(independentMilli(supplied.quantity!));
        expect(ingredient.unit, recipe.id).toBe(supplied.unit === 'l' ? 'L' : ['g', 'kg', 'ml', 'L'].includes(supplied.unit!) ? supplied.unit : 'ud');
        expect(ingredient).not.toHaveProperty('price');
        expect(ingredient).not.toHaveProperty('unitPriceCents');
      });
      expect(recipe.unmeasuredIngredients?.map(ingredient => ingredient.name) ?? [], recipe.id).toEqual(unmeasured.map(ingredient => ingredient.name));
    }
  });

  it.each(SUPPORTED_LANGUAGES)('uses the received contextual 150-recipe translation in %s without mutating canonical data', language => {
    const before = JSON.stringify(V3_RECIPES), t = createTranslator(language, resources);
    expect(Object.keys(v3RecipeMessages[language]).sort()).toEqual(Object.keys(v3RecipeMessages.es).sort());
    for (const recipe of V3_RECIPES) {
      const supplied = sourceByID.get(recipe.id)!.localized[language], view = localizedRecipe(recipe, t);
      expect(view.title, recipe.id).toBe(supplied.title);
      expect(view.steps, recipe.id).toEqual(supplied.steps);
      expect(view.allergenNote, recipe.id).toBe(supplied.warnings.join('\n\n'));
      expect(view.baseServings, recipe.id).toBe(recipe.baseServings);
      expect(view.minutes, recipe.id).toBe(recipe.minutes);
      const measured = supplied.ingredients.filter(ingredient => ingredient.quantity !== null);
      view.ingredients.forEach((ingredient, index) => {
        expect(ingredient.name, recipe.id).toContain(measured[index].name);
        expect(ingredient.quantityMilli, recipe.id).toBe(recipe.ingredients[index].quantityMilli);
        expect(ingredient.unit, recipe.id).toBe(recipe.ingredients[index].unit);
      });
      for (const text of [view.title, ...view.steps, view.allergenNote, ...view.ingredients.map(ingredient => ingredient.name)]) {
        expect(text, recipe.id).not.toContain('\uFFFD');
        expect(text, recipe.id).not.toMatch(/^recipesV83\.[\w.-]+$/);
      }
    }
    expect(JSON.stringify(V3_RECIPES)).toBe(before);
  });

  it.each(Array.from({ length: 12 }, (_, index) => index + 1))('scales every newly available recipe safely for %s people and retains each selected ID', servings => {
    const added = V3_RECIPES.filter(recipe => !historicalIDs.has(recipe.id));
    for (const recipe of added) {
      const scaled = scaleRecipe(recipe, servings);
      expect(scaled).toHaveLength(recipe.ingredients.length);
      for (const ingredient of scaled) {
        expect(Number.isSafeInteger(ingredient.quantityMilli), recipe.id).toBe(true);
        expect(ingredient.quantityMilli, recipe.id).toBeGreaterThan(0);
        expect(parseQuantity(formatQuantity(ingredient.quantityMilli), ingredient.unit), recipe.id).toBe(ingredient.quantityMilli);
      }
    }
    for (let offset = 0; offset < added.length; offset += 5) {
      const ids = added.slice(offset, offset + 5).map(recipe => recipe.id);
      expect(validateMealPlan({ servings, recipeIds: ids }).recipeIds).toEqual(ids);
    }
  });

  it('keeps the new recipes reviewable without inferring dietary suitability or fabricating unknown times', () => {
    const filters = defaultMenuFilters();
    expect(filterRecipes(V3_RECIPES, filters)).toHaveLength(150);
    expect(filterRecipes(V3_RECIPES, { ...filters, preference: 'vegan' })).toEqual([]);
    expect(filterRecipes(V3_RECIPES, { ...filters, preference: 'vegetarian' })).toEqual([]);
    const timed = filterRecipes(V3_RECIPES, { ...filters, maxMinutes: 60 });
    expect(timed.every(recipe => recipe.minutes !== null && recipe.minutes <= 60)).toBe(true);
    expect(V3_RECIPES.filter(recipe => recipe.minutes === null)).toHaveLength(source.filter(row => row.localized.es.preparation_and_cooking_min === null).length);
  });
});
