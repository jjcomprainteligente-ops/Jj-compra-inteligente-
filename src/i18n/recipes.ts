import type { Recipe } from '../domain/menus';
import { recipeMessages } from './catalogs/recipes';
import { v83RecipeMessages } from './catalogs/recipesV83';
import { menusMessages } from './catalogs/menus';
import type { Translator } from './types';

const ingredientKeys = new Map<string, string>(
  Object.entries(recipeMessages.es).filter(([key]) => key.startsWith('recipes.ingredient.')).map(([key, value]) => [value, key]),
);
const noteKeys = new Map<string, string>(
  Object.entries(recipeMessages.es).filter(([key]) => key.startsWith('recipes.note.')).map(([key, value]) => [value, key]),
);
noteKeys.set(menusMessages.es['menus.roundNoteShort'], 'menus.roundNoteShort');

// Legacy labels retain precedence. Individual recipes below use their line ID
// so one Spanish ingredient cannot overwrite another recipe's supplied wording.
for (const [key, value] of Object.entries(v83RecipeMessages.es)) {
  if (/\.ingredient\.\d+$/.test(key) && !ingredientKeys.has(value)) ingredientKeys.set(value, key);
  if (/(?:\.ingredientNote|\.unmeasuredNote)\.\d+$/.test(key) && !noteKeys.has(value)) noteKeys.set(value, key);
}

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
  const importedPrefix = 'recipesV83.' + recipe.id;
  if (Object.prototype.hasOwnProperty.call(v83RecipeMessages.es, importedPrefix + '.title')) {
    return {
      ...recipe,
      title: t(importedPrefix + '.title'),
      ingredients: recipe.ingredients.map((ingredient, index) => ({ ...ingredient,
        name: t(importedPrefix + '.ingredient.' + index),
        ...(ingredient.note ? { note: t(importedPrefix + '.ingredientNote.' + index) } : {}),
      })),
      steps: recipe.steps.map((_, index) => t(importedPrefix + '.step.' + index)),
      allergenNote: t(importedPrefix + '.allergen'),
      ...(recipe.unmeasuredIngredients ? { unmeasuredIngredients: recipe.unmeasuredIngredients.map((ingredient, index) => ({
        name: t(importedPrefix + '.unmeasured.' + index),
        ...(ingredient.note ? { note: t(importedPrefix + '.unmeasuredNote.' + index) } : {}),
      })) } : {}),
      ...(recipe.editorialNotes ? { editorialNotes: recipe.editorialNotes.map((_, index) => t(importedPrefix + '.editorial.' + index)) } : {}),
    };
  }
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

