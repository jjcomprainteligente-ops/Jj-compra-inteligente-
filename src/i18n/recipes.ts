import type { Recipe } from '../domain/menus';
import { recipeMessages } from './catalogs/recipes';
import { menusMessages } from './catalogs/menus';
import type { Translator } from './types';

const ingredientKeys = new Map<string, string>(
  Object.entries(recipeMessages.es).filter(([key]) => key.startsWith('recipes.ingredient.')).map(([key, value]) => [value, key]),
);
const noteKeys = new Map<string, string>(
  Object.entries(recipeMessages.es).filter(([key]) => key.startsWith('recipes.note.')).map(([key, value]) => [value, key]),
);
noteKeys.set(menusMessages.es['menus.roundNoteShort'], 'menus.roundNoteShort');

/** Presentation only: never rewrite a saved name or infer equivalence between user-entered foods. */
export function translateIngredientName(name: string, t: Translator): string {
  const key = ingredientKeys.get(name);
  return key ? t(key) : name;
}

/** Unknown notes and user edits remain literal. */
export function translateIngredientNote(note: string | undefined, t: Translator): string {
  if (!note) return '';
  const key = noteKeys.get(note);
  if (key) return t(key);
  const parts = note.split(' · ');
  // Combined, unedited catalogue notes keep their provenance; arbitrary user notes stay literal.
  return parts.length > 1 && parts.every(part => noteKeys.has(part))
    ? parts.map(part => t(noteKeys.get(part)!)).join(' · ')
    : note;
}

/** A separate view model: all calculations and transfers keep using the canonical recipe. */
export function localizedRecipe(recipe: Recipe, t: Translator): Recipe {
  const titleKey = 'recipes.' + recipe.id + '.title';
  if (!Object.prototype.hasOwnProperty.call(recipeMessages.es, titleKey)) return recipe;
  return {
    ...recipe,
    title: t(titleKey),
    ingredients: recipe.ingredients.map(ingredient => ({
      ...ingredient,
      name: translateIngredientName(ingredient.name, t),
      ...(ingredient.note ? { note: translateIngredientNote(ingredient.note, t) } : {}),
    })),
    steps: recipe.steps.map((_, index) => t('recipes.' + recipe.id + '.step.' + index)),
    allergenNote: t('recipes.' + recipe.id + '.allergen'),
  };
}

