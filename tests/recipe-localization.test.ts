import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { RECIPES } from '../src/data/recipes';
import { createMealPlan, planIngredients, scaleRecipe } from '../src/domain/menus';
import { parseIngredientText } from '../src/domain/ingredientImport';
import { createTranslator, mergeMessageCatalogs } from '../src/i18n/core';
import { menusMessages } from '../src/i18n/catalogs/menus';
import { recipeMessages } from '../src/i18n/catalogs/recipes';
import { localizedRecipe, translateIngredientName, translateIngredientNote } from '../src/i18n/recipes';
import { SUPPORTED_LANGUAGES } from '../src/i18n/types';

describe('localized recipe views with stable shopping identities', () => {
  it('preserves the complete pre-i18n Spanish catalogue byte-for-byte when serialized', () => {
    // Approved preservation baseline: includes all quantities, notes, safety instructions and IDs.
    expect(createHash('sha256').update(JSON.stringify(RECIPES)).digest('hex'))
      .toBe('2361d9fc72d0dd8f728df489a0cdececb1b1fd854bd709ab841c7846f0b26c81');
  });

  it.each(SUPPORTED_LANGUAGES)('contains every recipe and menu message in %s with matching placeholders', language => {
    for (const catalog of [recipeMessages, menusMessages]) {
      expect(Object.keys(catalog[language]).sort()).toEqual(Object.keys(catalog.es).sort());
      for (const key of Object.keys(catalog.es)) {
        const selected = catalog[language] as Record<string, string>;
        const spanish = catalog.es as Record<string, string>;
        expect(selected[key].trim().length).toBeGreaterThan(0);
        const placeholders = (value: string) => [...value.matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)].map(match => match[1]).sort();
        expect(placeholders(selected[key]), key).toEqual(placeholders(spanish[key]));
      }
    }
  });

  it.each(SUPPORTED_LANGUAGES)('translates all recipe text in %s without changing measurements or canonical objects', language => {
    const t = createTranslator(language, recipeMessages);
    const before = JSON.stringify(RECIPES);
    const originalPlan = planIngredients(createMealPlan(2));
    for (const recipe of RECIPES) {
      const view = localizedRecipe(recipe, t);
      expect(view.id).toBe(recipe.id);
      expect(view.minutes).toBe(recipe.minutes);
      expect(view.baseServings).toBe(recipe.baseServings);
      expect(view.title).toBe(t('recipes.' + recipe.id + '.title'));
      expect(view.allergenNote).toBe(t('recipes.' + recipe.id + '.allergen'));
      expect(view.steps).toHaveLength(recipe.steps.length);
      expect(view.steps).toEqual(recipe.steps.map((_, index) => t('recipes.' + recipe.id + '.step.' + index)));
      expect(view.steps.every(step => step.length > 0)).toBe(true);
      view.ingredients.forEach((ingredient, index) => {
        const canonical = recipe.ingredients[index];
        expect(ingredient.quantityMilli).toBe(canonical.quantityMilli);
        expect(ingredient.unit).toBe(canonical.unit);
        expect(ingredient.category).toBe(canonical.category);
        expect(ingredient.name).toBe(translateIngredientName(canonical.name, t));
        if (canonical.note) expect(ingredient.note).toBe(translateIngredientNote(canonical.note, t));
      });
      expect(scaleRecipe(recipe, 3).map(ingredient => ingredient.name))
        .toEqual(recipe.ingredients.map(ingredient => ingredient.name));
    }
    expect(JSON.stringify(RECIPES)).toBe(before);
    expect(planIngredients(createMealPlan(2))).toEqual(originalPlan);
  });

  it('translates known catalogue labels only and keeps user-entered text literal', () => {
    const t = createTranslator('de', recipeMessages);
    expect(translateIngredientName('Arroz', t)).toBe('Reis');
    expect(translateIngredientName('Arroz integral de mi tienda', t)).toBe('Arroz integral de mi tienda');
    expect(translateIngredientName('__proto__', t)).toBe('__proto__');
    expect(translateIngredientName('constructor', t)).toBe('constructor');
    expect(translateIngredientNote('Mi nota personal', t)).toBe('Mi nota personal');
    expect(translateIngredientNote(undefined, t)).toBe('');
  });

  it('keeps an external or user-defined recipe unchanged instead of showing unknown translation keys', () => {
    const recipe = { ...RECIPES[0], id: 'external', title: 'My own dish' };
    expect(localizedRecipe(recipe, createTranslator('fr', recipeMessages))).toBe(recipe);
  });

  it('translates combined catalogue notes while leaving mixed user notes untouched', () => {
    const t = createTranslator('fr', mergeMessageCatalogs(recipeMessages, menusMessages));
    const note = recipeMessages.es['recipes.note.water'] + ' · ' + menusMessages.es['menus.roundNoteShort'];
    expect(translateIngredientNote(note, t)).toBe(recipeMessages.fr['recipes.note.water'] + ' · ' + menusMessages.fr['menus.roundNoteShort']);
    const personal = recipeMessages.es['recipes.note.water'] + ' · Mi nota personal';
    expect(translateIngredientNote(personal, t)).toBe(personal);
  });

  it.each(SUPPORTED_LANGUAGES)('keeps the example ingredient syntax valid in %s', language => {
    const parsed = parseIngredientText(createTranslator(language, menusMessages)('menus.textPlaceholder'));
    expect(parsed.issues).toEqual([]);
    expect(parsed.ingredients).toHaveLength(3);
    expect(parsed.ingredients.map(value => [value.quantityMilli, value.unit]))
      .toEqual([[500000, 'g'], [2000, 'L'], [3000, 'ud']]);
  });
});

