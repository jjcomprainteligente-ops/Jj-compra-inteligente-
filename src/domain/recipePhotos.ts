import { V3_RECIPES } from '../data/recipesV3';

/** Public catalogue availability only; image loading errors are presentation state. */
export type RecipePhotoStatus = 'DISPONIBLE' | 'NO_LOCALIZADA' | 'PENDIENTE';

// This catalogue is generated from the pinned, fully verified 150-photo delivery.
// Resources live in a separate Metro-only module, never in saved documents.
const availableIds: ReadonlySet<string> = new Set(V3_RECIPES.map(recipe => recipe.id));
const legacyIds: ReadonlySet<string> = new Set([
  'arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza',
  'pasta-tomate', 'pollo-papas', 'cuscus-verduras',
]);

/** Exact identity lookup. Unknown IDs never form a path or gain a fallback image. */
export function recipePhotoStatus(recipeId: string): RecipePhotoStatus | undefined {
  if (availableIds.has(recipeId)) return 'DISPONIBLE';
  return legacyIds.has(recipeId) ? 'NO_LOCALIZADA' : undefined;
}
