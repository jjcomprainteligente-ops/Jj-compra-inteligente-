import { describe, expect, it } from 'vitest';
import { RECIPES } from '../src/data/recipes';
import {
  canonicalMeasure, combineIngredients, createMealPlan, normalizeIngredientName,
  planIngredients, replaceMeal, scaleRecipe, validateMealPlan,
  type Recipe, type ScaledIngredient,
} from '../src/domain/menus';
import { type Category, type Unit, validateItemInput, formatQuantity } from '../src/domain/shopping';

const ingredient = (overrides: Partial<ScaledIngredient> = {}): ScaledIngredient => ({
  name: 'Tomate', quantityMilli: 250000, unit: 'g', category: 'Fruta y verdura', rounded: false, ...overrides,
});
const recipe = (ingredients: ScaledIngredient[], baseServings = 2): Recipe => ({
  id: 'test', title: 'Receta de prueba', minutes: 20, baseServings, ingredients,
  steps: ['Cocinar los ingredientes.'], allergenNote: 'Revisar etiquetas.',
});

describe('catálogo local y menú de cinco cenas', () => {
  it('contiene siete recetas originales con cantidades editables y sin campos de precio', () => {
    expect(RECIPES).toHaveLength(7);
    expect(new Set(RECIPES.map(entry => entry.id)).size).toBe(7);
    for (const entry of RECIPES) {
      expect(entry.baseServings).toBe(2);
      expect(entry.ingredients.length).toBeGreaterThanOrEqual(4);
      expect(entry.ingredients.length).toBeLessThanOrEqual(7);
      expect(entry.steps.length).toBeGreaterThanOrEqual(3);
      expect(entry.allergenNote.length).toBeGreaterThan(0);
      for (const value of scaleRecipe(entry, 12)) {
        expect(validateItemInput({ name: value.name, quantity: formatQuantity(value.quantityMilli), unit: value.unit,
          category: value.category, note: value.note ?? '', price: '', priceKind: 'entered' })).toMatchObject({ unitPriceCents: null, priceKind: null });
        expect(value).not.toHaveProperty('price');
        expect(value).not.toHaveProperty('unitPriceCents');
      }
    }
  });

  it('genera determinísticamente sin escribir, mutar el catálogo ni compartir el array', () => {
    const before = JSON.stringify(RECIPES);
    const first = createMealPlan(3);
    expect(createMealPlan(3)).toEqual(first);
    expect(first.recipeIds).toHaveLength(5);
    first.recipeIds.reverse();
    expect(createMealPlan(3).recipeIds).toEqual(RECIPES.slice(0, 5).map(value => value.id));
    expect(JSON.stringify(RECIPES)).toBe(before);
  });

  it.each([0, -1, 1.5, 13, NaN, Infinity, '2', null, undefined])('rechaza personas inválidas %s', value => {
    expect(() => createMealPlan(value as number)).toThrow('entre 1 y 12');
    expect(() => validateMealPlan({ servings: value, recipeIds: createMealPlan(2).recipeIds })).toThrow();
  });

  it.each([null, [], {}, { servings: 2, recipeIds: [] },
    { servings: 2, recipeIds: Array(5).fill('arroz-verduras') },
    { servings: 2, recipeIds: [...RECIPES.slice(0, 4).map(value => value.id), 'no-disponible'] },
    { servings: 2, recipeIds: [1, 2, 3, 4, 5] }])('rechaza menú corrupto o no disponible %j', value => {
    expect(() => validateMealPlan(value)).toThrow();
  });

  it('permite sustituir una cena, pero nunca duplica ni muta el plan anterior', () => {
    const before = createMealPlan(2);
    const original = [...before.recipeIds];
    const replacement = RECIPES[5].id;
    expect(replaceMeal(before, 0, replacement).recipeIds[0]).toBe(replacement);
    expect(before.recipeIds).toEqual(original);
    expect(() => replaceMeal(before, 0, before.recipeIds[1])).toThrow('distintas');
    expect(() => replaceMeal(before, 5, replacement)).toThrow('cena válida');
    expect(() => replaceMeal(before, 0.5, replacement)).toThrow();
    expect(() => replaceMeal(before, 0, 'desconocida')).toThrow('disponible');
    const cloned = validateMealPlan(before);
    cloned.recipeIds.reverse();
    expect(before.recipeIds).toEqual(original);
  });

  it('devuelve todas las cantidades para revisión, sin fusionar todavía ni añadir precios', () => {
    const plan = createMealPlan(2);
    const values = planIngredients(plan);
    expect(values).toHaveLength(RECIPES.slice(0, 5).reduce((count, value) => count + value.ingredients.length, 0));
    expect(values.filter(value => value.name === 'Aceite de oliva')).toHaveLength(5);
    expect(values.every(value => value.rounded === false && !('unitPriceCents' in value))).toBe(true);
  });
});

describe('raciones y redondeo explícito', () => {
  it('multiplica gramos y mililitros exactamente, manteniendo los originales', () => {
    const original = ingredient({ quantityMilli: 250000 });
    const scaled = scaleRecipe(recipe([original]), 3)[0];
    expect(scaled).toMatchObject({ quantityMilli: 375000, rounded: false });
    expect(original.quantityMilli).toBe(250000);
    expect(scaleRecipe(recipe([ingredient({ unit: 'ml', quantityMilli: 15000 })]), 1)[0]).toMatchObject({ quantityMilli: 7500, rounded: false });
  });

  it('redondea las unidades comprables hacia arriba y lo marca para revisar', () => {
    const eggRecipe = recipe([ingredient({ name: 'Huevos', quantityMilli: 3000, unit: 'ud' })]);
    expect(scaleRecipe(eggRecipe, 1)[0]).toMatchObject({ quantityMilli: 2000, rounded: true });
    expect(scaleRecipe(eggRecipe, 2)[0]).toMatchObject({ quantityMilli: 3000, rounded: false });
    expect(scaleRecipe(eggRecipe, 3)[0]).toMatchObject({ quantityMilli: 5000, rounded: true });
  });

  it('redondea solo al final en milésimas y nunca oculta un ingrediente pequeño con cero', () => {
    expect(scaleRecipe(recipe([ingredient({ quantityMilli: 1000 })], 3), 1)[0]).toMatchObject({ quantityMilli: 333, rounded: true });
    expect(scaleRecipe(recipe([ingredient({ quantityMilli: 1 })]), 1)[0]).toMatchObject({ quantityMilli: 1, rounded: true });
  });

  it('rechaza cantidades que exceden los límites y entradas de unidad ausente', () => {
    expect(() => scaleRecipe(recipe([ingredient({ quantityMilli: 1_000_000_000 })]), 12)).toThrow('no cabe');
    for (const unit of [undefined, null, 'caja'] as unknown as Unit[]) {
      expect(() => scaleRecipe(recipe([ingredient({ unit })]), 2)).toThrow('ingrediente');
      expect(() => canonicalMeasure(1000, unit)).toThrow('unidad válida');
    }
    expect(() => scaleRecipe(recipe([ingredient({ unit: 'ud', quantityMilli: 1500 })]), 2)).toThrow('entera');
    expect(() => scaleRecipe(recipe([ingredient({ category: 'inventada' as Category })]), 2)).toThrow('ingrediente');
    expect(() => scaleRecipe(recipe([ingredient({ quantityMilli: -1 })]), 2)).toThrow();
    expect(() => scaleRecipe(recipe([ingredient()], 0), 2)).toThrow();
  });

  it('no transmite campos externos de precio a los ingredientes escalados', () => {
    const tainted = { ...ingredient(), unitPriceCents: 999, priceKind: 'entered' };
    expect(scaleRecipe(recipe([tainted]), 2)[0]).not.toHaveProperty('unitPriceCents');
  });
});

describe('equivalencias limitadas y combinación de propuestas', () => {
  it('normaliza Unicode, mayúsculas y espacios; aplica solo alias explícitos', () => {
    expect(normalizeIngredientName('  Pla\u0301tanos  ')).toBe('platano');
    expect(normalizeIngredientName(' ACEITE   OLIVA ')).toBe('aceite de oliva');
    expect(normalizeIngredientName('Tomates')).toBe('tomates');
    expect(normalizeIngredientName('Tomate triturado')).not.toBe(normalizeIngredientName('Tomate'));
    expect(normalizeIngredientName('__proto__')).toBe('__proto__');
    expect(normalizeIngredientName('constructor')).toBe('constructor');
  });

  it('usa milésimas de g/ml y mantiene ud como dimensión independiente', () => {
    expect(canonicalMeasure(1250, 'kg')).toEqual({ dimension: 'mass', quantityMilli: 1_250_000, unit: 'g' });
    expect(canonicalMeasure(500, 'L')).toEqual({ dimension: 'volume', quantityMilli: 500000, unit: 'ml' });
    expect(canonicalMeasure(2000, 'ud')).toEqual({ dimension: 'count', quantityMilli: 2000, unit: 'ud' });
    expect(() => canonicalMeasure(500, 'ud')).toThrow('entera');
  });

  it('une g y kg conservando la primera unidad y suma sin coma flotante', () => {
    const values = [ingredient({ quantityMilli: 999000 }), ingredient({ name: ' TOMATE ', quantityMilli: 1000, unit: 'kg', rounded: true })];
    expect(combineIngredients(values)).toEqual([ingredient({ quantityMilli: 1_999_000, note: undefined, rounded: true })]);
    expect(values[0].quantityMilli).toBe(999000);
    expect(values).toHaveLength(2);
    expect(combineIngredients([...values].reverse())[0]).toMatchObject({ quantityMilli: 1999, unit: 'kg', rounded: true });
  });

  it('conserva adiciones muy pequeñas cambiando a la unidad base cuando hace falta', () => {
    expect(combineIngredients([ingredient({ quantityMilli: 1000, unit: 'kg' }), ingredient({ quantityMilli: 1 })])[0])
      .toMatchObject({ quantityMilli: 1_000_001, unit: 'g', rounded: false });
  });

  it('une litros y mililitros pero nunca asume equivalencia de unidades y peso', () => {
    const oil = ingredient({ name: 'Aceite de oliva', quantityMilli: 500, unit: 'L', category: 'Despensa' });
    expect(combineIngredients([oil, ingredient({ name: 'Aceite oliva', quantityMilli: 250000, unit: 'ml' })])[0])
      .toMatchObject({ quantityMilli: 750, unit: 'L' });
    expect(combineIngredients([ingredient(), ingredient({ unit: 'ud', quantityMilli: 1000 }), ingredient({ unit: 'ml', quantityMilli: 1000 })])).toHaveLength(3);
  });

  it('mantiene diferencias de producto y conserva notas únicas, categoría y redondeo', () => {
    const values = [ingredient({ note: ' Madura ', category: 'Otros' }), ingredient({ note: 'Maduro para salsa', rounded: true }), ingredient({ note: 'Maduro para salsa' }), ingredient({ name: 'Tomate triturado' })];
    const output = combineIngredients(values);
    expect(output).toHaveLength(2);
    expect(output[0]).toMatchObject({ quantityMilli: 750000, category: 'Otros', note: 'Madura · Maduro para salsa', rounded: true });
    expect(values[0].note).toBe(' Madura ');
  });

  it('rechaza sumas o notas que no caben en la lista en vez de truncarlas', () => {
    expect(() => combineIngredients([ingredient({ quantityMilli: 1_000_000_000 }), ingredient()])).toThrow('no cabe');
    expect(() => combineIngredients([ingredient({ note: 'a'.repeat(300) }), ingredient({ note: 'b'.repeat(300) })])).toThrow('notas combinadas');
    expect(() => combineIngredients([ingredient({ rounded: undefined as unknown as boolean })])).toThrow('redondeo');
    expect(combineIngredients([])).toEqual([]);
  });
});
