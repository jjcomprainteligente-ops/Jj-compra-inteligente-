import type { Recipe } from '../domain/menus';
import { recipeMessages } from '../i18n/catalogs/recipes';

/** Stable culinary data. The Spanish fallback catalog preserves existing identities and saved lists. */
export const RECIPES: readonly Recipe[] = [
  {
    id: "arroz-verduras", title: recipeMessages.es["recipes.arroz-verduras.title"], minutes: 25, baseServings: 2,
    ingredients: [
      { name: recipeMessages.es["recipes.ingredient.rice"], quantityMilli: 160000, unit: "g", category: "Despensa" },
      { name: recipeMessages.es["recipes.ingredient.courgette"], quantityMilli: 200000, unit: "g", category: "Fruta y verdura" },
      { name: recipeMessages.es["recipes.ingredient.carrot"], quantityMilli: 150000, unit: "g", category: "Fruta y verdura" },
      { name: recipeMessages.es["recipes.ingredient.onion"], quantityMilli: 100000, unit: "g", category: "Fruta y verdura" },
      { name: recipeMessages.es["recipes.ingredient.oliveOil"], quantityMilli: 20000, unit: "ml", category: "Despensa" },
      { name: recipeMessages.es["recipes.ingredient.water"], quantityMilli: 400000, unit: "ml", category: "Otros", note: recipeMessages.es["recipes.note.water"] },
    ],
    steps: [
      recipeMessages.es["recipes.arroz-verduras.step.0"],
      recipeMessages.es["recipes.arroz-verduras.step.1"],
      recipeMessages.es["recipes.arroz-verduras.step.2"],
      recipeMessages.es["recipes.arroz-verduras.step.3"],
    ],
    allergenNote: recipeMessages.es["recipes.arroz-verduras.allergen"],
  },
  {
    id: "lentejas-casa", title: recipeMessages.es["recipes.lentejas-casa.title"], minutes: 40, baseServings: 2,
    ingredients: [
      { name: recipeMessages.es["recipes.ingredient.driedLentils"], quantityMilli: 180000, unit: "g", category: "Despensa" },
      { name: recipeMessages.es["recipes.ingredient.potatoes"], quantityMilli: 250000, unit: "g", category: "Fruta y verdura" },
      { name: recipeMessages.es["recipes.ingredient.carrot"], quantityMilli: 150000, unit: "g", category: "Fruta y verdura" },
      { name: recipeMessages.es["recipes.ingredient.onion"], quantityMilli: 100000, unit: "g", category: "Fruta y verdura" },
      { name: recipeMessages.es["recipes.ingredient.oliveOil"], quantityMilli: 20000, unit: "ml", category: "Despensa" },
      { name: recipeMessages.es["recipes.ingredient.water"], quantityMilli: 700000, unit: "ml", category: "Otros", note: recipeMessages.es["recipes.note.water"] },
    ],
    steps: [
      recipeMessages.es["recipes.lentejas-casa.step.0"],
      recipeMessages.es["recipes.lentejas-casa.step.1"],
      recipeMessages.es["recipes.lentejas-casa.step.2"],
      recipeMessages.es["recipes.lentejas-casa.step.3"],
    ],
    allergenNote: recipeMessages.es["recipes.lentejas-casa.allergen"],
  },
  {
    id: "tortilla-ensalada", title: recipeMessages.es["recipes.tortilla-ensalada.title"], minutes: 30, baseServings: 2,
    ingredients: [
      { name: recipeMessages.es["recipes.ingredient.eggs"], quantityMilli: 3000, unit: "ud", category: "Lácteos y huevos" },
      { name: recipeMessages.es["recipes.ingredient.potatoes"], quantityMilli: 300000, unit: "g", category: "Fruta y verdura" },
      { name: recipeMessages.es["recipes.ingredient.lettuce"], quantityMilli: 100000, unit: "g", category: "Fruta y verdura" },
      { name: recipeMessages.es["recipes.ingredient.tomato"], quantityMilli: 150000, unit: "g", category: "Fruta y verdura" },
      { name: recipeMessages.es["recipes.ingredient.oliveOil"], quantityMilli: 20000, unit: "ml", category: "Despensa" },
    ],
    steps: [
      recipeMessages.es["recipes.tortilla-ensalada.step.0"],
      recipeMessages.es["recipes.tortilla-ensalada.step.1"],
      recipeMessages.es["recipes.tortilla-ensalada.step.2"],
      recipeMessages.es["recipes.tortilla-ensalada.step.3"],
    ],
    allergenNote: recipeMessages.es["recipes.tortilla-ensalada.allergen"],
  },
  {
    id: "garbanzos-calabaza", title: recipeMessages.es["recipes.garbanzos-calabaza.title"], minutes: 25, baseServings: 2,
    ingredients: [
      { name: recipeMessages.es["recipes.ingredient.cookedChickpeas"], quantityMilli: 400000, unit: "g", category: "Despensa", note: recipeMessages.es["recipes.note.drained"] },
      { name: recipeMessages.es["recipes.ingredient.pumpkin"], quantityMilli: 300000, unit: "g", category: "Fruta y verdura" },
      { name: recipeMessages.es["recipes.ingredient.onion"], quantityMilli: 100000, unit: "g", category: "Fruta y verdura" },
      { name: recipeMessages.es["recipes.ingredient.tomato"], quantityMilli: 150000, unit: "g", category: "Fruta y verdura" },
      { name: recipeMessages.es["recipes.ingredient.oliveOil"], quantityMilli: 20000, unit: "ml", category: "Despensa" },
    ],
    steps: [
      recipeMessages.es["recipes.garbanzos-calabaza.step.0"],
      recipeMessages.es["recipes.garbanzos-calabaza.step.1"],
      recipeMessages.es["recipes.garbanzos-calabaza.step.2"],
      recipeMessages.es["recipes.garbanzos-calabaza.step.3"],
    ],
    allergenNote: recipeMessages.es["recipes.garbanzos-calabaza.allergen"],
  },
  {
    id: "pasta-tomate", title: recipeMessages.es["recipes.pasta-tomate.title"], minutes: 25, baseServings: 2,
    ingredients: [
      { name: recipeMessages.es["recipes.ingredient.pasta"], quantityMilli: 180000, unit: "g", category: "Despensa" },
      { name: recipeMessages.es["recipes.ingredient.tomato"], quantityMilli: 300000, unit: "g", category: "Fruta y verdura" },
      { name: recipeMessages.es["recipes.ingredient.onion"], quantityMilli: 100000, unit: "g", category: "Fruta y verdura" },
      { name: recipeMessages.es["recipes.ingredient.oliveOil"], quantityMilli: 20000, unit: "ml", category: "Despensa" },
      { name: recipeMessages.es["recipes.ingredient.gratedCheese"], quantityMilli: 30000, unit: "g", category: "Lácteos y huevos" },
    ],
    steps: [
      recipeMessages.es["recipes.pasta-tomate.step.0"],
      recipeMessages.es["recipes.pasta-tomate.step.1"],
      recipeMessages.es["recipes.pasta-tomate.step.2"],
      recipeMessages.es["recipes.pasta-tomate.step.3"],
    ],
    allergenNote: recipeMessages.es["recipes.pasta-tomate.allergen"],
  },
  {
    id: "pollo-papas", title: recipeMessages.es["recipes.pollo-papas.title"], minutes: 40, baseServings: 2,
    ingredients: [
      { name: recipeMessages.es["recipes.ingredient.chicken"], quantityMilli: 300000, unit: "g", category: "Carne y pescado" },
      { name: recipeMessages.es["recipes.ingredient.potatoes"], quantityMilli: 400000, unit: "g", category: "Fruta y verdura" },
      { name: recipeMessages.es["recipes.ingredient.carrot"], quantityMilli: 150000, unit: "g", category: "Fruta y verdura" },
      { name: recipeMessages.es["recipes.ingredient.onion"], quantityMilli: 100000, unit: "g", category: "Fruta y verdura" },
      { name: recipeMessages.es["recipes.ingredient.oliveOil"], quantityMilli: 20000, unit: "ml", category: "Despensa" },
    ],
    steps: [
      recipeMessages.es["recipes.pollo-papas.step.0"],
      recipeMessages.es["recipes.pollo-papas.step.1"],
      recipeMessages.es["recipes.pollo-papas.step.2"],
      recipeMessages.es["recipes.pollo-papas.step.3"],
    ],
    allergenNote: recipeMessages.es["recipes.pollo-papas.allergen"],
  },
  {
    id: "cuscus-verduras", title: recipeMessages.es["recipes.cuscus-verduras.title"], minutes: 20, baseServings: 2,
    ingredients: [
      { name: recipeMessages.es["recipes.ingredient.couscous"], quantityMilli: 160000, unit: "g", category: "Despensa" },
      { name: recipeMessages.es["recipes.ingredient.courgette"], quantityMilli: 200000, unit: "g", category: "Fruta y verdura" },
      { name: recipeMessages.es["recipes.ingredient.carrot"], quantityMilli: 150000, unit: "g", category: "Fruta y verdura" },
      { name: recipeMessages.es["recipes.ingredient.cookedChickpeas"], quantityMilli: 200000, unit: "g", category: "Despensa", note: recipeMessages.es["recipes.note.drained"] },
      { name: recipeMessages.es["recipes.ingredient.oliveOil"], quantityMilli: 20000, unit: "ml", category: "Despensa" },
      { name: recipeMessages.es["recipes.ingredient.water"], quantityMilli: 200000, unit: "ml", category: "Otros", note: recipeMessages.es["recipes.note.water"] },
    ],
    steps: [
      recipeMessages.es["recipes.cuscus-verduras.step.0"],
      recipeMessages.es["recipes.cuscus-verduras.step.1"],
      recipeMessages.es["recipes.cuscus-verduras.step.2"],
      recipeMessages.es["recipes.cuscus-verduras.step.3"],
    ],
    allergenNote: recipeMessages.es["recipes.cuscus-verduras.allergen"],
  },
];
