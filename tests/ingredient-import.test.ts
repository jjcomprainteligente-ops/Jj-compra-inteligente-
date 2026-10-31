import { describe, expect, it, vi } from 'vitest';
import {
  applyIngredientReview, matchingItems, parseIngredientText,
  type IngredientDraft,
} from '../src/domain/ingredientImport';
import type { Category, ShoppingItem, ShoppingList, Unit } from '../src/domain/shopping';

const item = (overrides: Partial<ShoppingItem> = {}): ShoppingItem => ({
  id: 'existing', name: 'Arroz', quantityMilli: 1000, unit: 'kg', category: 'Despensa', note: 'Mantener esta nota',
  checked: false, unitPriceCents: null, priceKind: null, ...overrides,
});
const list = (items: ShoppingItem[] = []): ShoppingList => ({ id: 'list', name: 'Compra', budgetCents: 3000, items });
const draft = (overrides: Partial<IngredientDraft> = {}): IngredientDraft => ({
  id: 'draft-1', name: 'Arroz', quantity: '500', unit: 'g', category: 'Otros', note: '', included: true, decision: 'pending', ...overrides,
});
const ids = () => { let count = 0; return () => `new-${++count}`; };

describe('interpretación local de texto', () => {
  it('lee cantidades, unidades equivalentes y listas con viñetas sin inventar precio', () => {
    const result = parseIngredientText('Ingredientes:\n- 500 gramos de arroz\n* 1,5 L leche\n3. dos unidades huevos;250ml agua');
    expect(result.issues).toEqual([]);
    expect(result.ingredients.map(value => [value.name, value.quantityMilli, value.unit])).toEqual([
      ['arroz', 500000, 'g'], ['leche', 1500, 'L'], ['huevos', 2000, 'ud'], ['agua', 250000, 'ml'],
    ]);
    expect(result.ingredients.every(value => !('unitPriceCents' in value))).toBe(true);
  });

  it.each(['1/2 kg arroz', '½ kg arroz'])('interpreta la fracción exacta %s', value => {
    expect(parseIngredientText(value)).toMatchObject({ ingredients: [{ name: 'arroz', quantityMilli: 500, unit: 'kg' }], issues: [] });
  });

  it('propone 1 ud para nombres sin medida y lo identifica en la nota', () => {
    const result = parseIngredientText('Plátano de Canarias');
    expect(result.issues).toEqual([]);
    expect(result.ingredients[0]).toMatchObject({ name: 'Plátano de Canarias', quantityMilli: 1000, unit: 'ud', note: 'Cantidad propuesta: revisa antes de añadir.' });
  });

  it('mantiene visible una unidad propuesta cuando hay cantidad sin unidad explícita', () => {
    expect(parseIngredientText('dos barras de pan').ingredients[0]).toMatchObject({ name: 'barras de pan', quantityMilli: 2000, unit: 'ud', note: expect.stringContaining('Unidad propuesta') });
  });

  it('interpreta uno/una completos y no confunde prefijos de nombres con cantidades', () => {
    expect(parseIngredientText('una cebolla').ingredients[0]).toMatchObject({ name: 'cebolla', quantityMilli: 1000 });
    expect(parseIngredientText('uno huevo').ingredients[0]).toMatchObject({ name: 'huevo', quantityMilli: 1000 });
    expect(parseIngredientText('dosificador de aceite').ingredients[0]).toMatchObject({ name: 'dosificador de aceite', quantityMilli: 1000 });
  });

  it('admite la unidad singular y los saltos de línea CR sin unir productos', () => {
    const result = parseIngredientText('1 unidad de huevo\r500 g arroz');
    expect(result.issues).toEqual([]);
    expect(result.ingredients.map(value => [value.name, value.unit])).toEqual([['huevo', 'ud'], ['arroz', 'g']]);
  });

  it('rechaza controles invisibles sin interpretar su contenido', () => {
    expect(parseIngredientText('Arroz\u0000').issues).toHaveLength(1);
    expect(parseIngredientText('Arroz\u202e').issues).toHaveLength(1);
  });

  it.each([
    '0 g arroz', '-2 kg arroz', '2-3 huevos', '2 o 3 huevos', 'sal al gusto', '1.2345 kg arroz',
    '1/3 kg arroz', '1/2 ud huevo', '2 tazas harina', 'leche, pan, huevos', 'sal y pimienta',
    'necesito leche', 'https://example.com/ingrediente', '<img src=x onerror=alert(1)>', '2 euros arroz', '2 kg',
  ])('no adivina una entrada conflictiva: %s', value => {
    const result = parseIngredientText(value);
    expect(result.issues).toHaveLength(1);
    expect(result.ingredients).toHaveLength(0);
  });

  it('informa de la línea conflictiva sin ocultar las válidas para corregir el texto', () => {
    const result = parseIngredientText('500 g arroz\nsal al gusto\n1 L leche');
    expect(result.ingredients).toHaveLength(2);
    expect(result.issues).toMatchObject([{ line: 2, message: expect.stringContaining('cantidad concreta') }]);
  });

  it('limita tamaño y número de entradas sin truncar ni importar parcialmente', () => {
    expect(parseIngredientText('x'.repeat(6001))).toMatchObject({ ingredients: [], issues: [{ line: 0 }] });
    expect(parseIngredientText(Array.from({ length: 51 }, () => 'Arroz').join('\n'))).toMatchObject({ ingredients: [], issues: [{ line: 0 }] });
    expect(parseIngredientText('  \nIngredientes:\n')).toMatchObject({ ingredients: [], issues: [{ line: 0 }] });
  });
});

describe('coincidencias revisables', () => {
  it('normaliza acentos/caso y convierte solo dimensiones compatibles', () => {
    const current = list([item({ name: ' PLÁTANO ' }), item({ id: 'count', name: 'Plátano', unit: 'ud' })]);
    expect(matchingItems(current, 'platano', 'g').map(value => value.id)).toEqual(['existing']);
    expect(matchingItems(current, 'plátano', 'ud').map(value => value.id)).toEqual(['count']);
  });

  it('equipara ml y L, pero no litros con kilos', () => {
    const current = list([item({ name: 'Leche', unit: 'L' })]);
    expect(matchingItems(current, 'leche', 'ml')).toHaveLength(1);
    expect(matchingItems(current, 'leche', 'kg')).toHaveLength(0);
    expect(() => matchingItems(current, 'leche', undefined as unknown as Unit)).toThrow();
  });
});

describe('confirmación atómica de ingredientes', () => {
  it('añade solo después de confirmar y conserva presupuesto, productos y precios anteriores', () => {
    const previous = list([item({ name: 'Leche', unit: 'L', unitPriceCents: 125, priceKind: 'entered', checked: true })]);
    const snapshot = structuredClone(previous);
    const next = applyIngredientReview(previous, [draft()], ids());
    expect(previous).toEqual(snapshot);
    expect(next.id).toBe(previous.id);
    expect(next.budgetCents).toBe(3000);
    expect(next.items[0]).toEqual(previous.items[0]);
    expect(next.items[1]).toMatchObject({ id: 'new-1', name: 'Arroz', quantityMilli: 500000, unit: 'g', checked: false, unitPriceCents: null, priceKind: null });
  });

  it('exige una decisión explícita cuando encuentra un producto', () => {
    const previous = list([item()]);
    expect(() => applyIngredientReview(previous, [draft()], ids())).toThrow('ya aparece');
    expect(previous.items[0].quantityMilli).toBe(1000);
  });

  it('suma g a kg exactamente y preserva nota y categoría existentes', () => {
    const previous = list([item()]);
    const next = applyIngredientReview(previous, [draft({ decision: 'combine', targetId: 'existing', note: 'Nota importada' })], ids());
    expect(next.items).toHaveLength(1);
    expect(next.items[0]).toEqual({ ...previous.items[0], quantityMilli: 1500 });
    expect(previous.items[0].quantityMilli).toBe(1000);
  });

  it('suma litros a mililitros sin coma flotante', () => {
    const previous = list([item({ name: 'Agua', unit: 'ml', quantityMilli: 125000 })]);
    const next = applyIngredientReview(previous, [draft({ name: 'agua', unit: 'L', quantity: '0,5', decision: 'combine', targetId: 'existing' })], ids());
    expect(next.items[0].quantityMilli).toBe(625000);
  });

  it.each([
    { checked: true }, { unitPriceCents: 100, priceKind: 'entered' as const },
    { unitPriceCents: 0, priceKind: 'estimated' as const },
  ])('protege precios y marcado existentes al sumar: %j', overrides => {
    const previous = list([item(overrides)]);
    expect(() => applyIngredientReview(previous, [draft({ decision: 'combine', targetId: 'existing' })], ids())).toThrow('tiene precio o está marcado');
    const next = applyIngredientReview(previous, [draft({ decision: 'separate' })], ids());
    expect(next.items[0]).toEqual(previous.items[0]);
    expect(next.items[1]).toMatchObject({ checked: false, unitPriceCents: null, priceKind: null });
  });

  it('no suma cuando el objetivo cambió o hay varias coincidencias', () => {
    expect(() => applyIngredientReview(list([item()]), [draft({ decision: 'combine', targetId: 'old-id' })], ids())).toThrow('ha cambiado');
    expect(() => applyIngredientReview(list([item(), item({ id: 'other' })]), [draft({ decision: 'combine', targetId: 'existing' })], ids())).toThrow('varias coincidencias');
    expect(() => applyIngredientReview(list(), [draft({ decision: 'combine', targetId: 'existing' })], ids())).toThrow('ha cambiado');
  });

  it('no redondea silenciosamente al sumar ni admite desbordamiento', () => {
    expect(() => applyIngredientReview(list([item()]), [draft({ quantity: '0,001', decision: 'combine', targetId: 'existing' })], ids())).toThrow('sin perder precisión');
    expect(() => applyIngredientReview(list([item({ quantityMilli: 1_000_000_000 })]), [draft({ decision: 'combine', targetId: 'existing' })], ids())).toThrow('demasiado grande');
  });

  it('vuelve a detectar conflictos internos de la revisión antes de devolver cambios', () => {
    const previous = list();
    expect(() => applyIngredientReview(previous, [draft(), draft({ id: 'draft-2', unit: 'kg', quantity: '1' })], ids())).toThrow('ya aparece');
    expect(previous.items).toEqual([]);
    expect(applyIngredientReview(previous, [draft(), draft({ id: 'draft-2', decision: 'separate' })], ids()).items).toHaveLength(2);
  });

  it('valida toda la revisión antes de crear identificadores o devolver resultados', () => {
    const factory = vi.fn(() => 'new');
    const previous = list();
    expect(() => applyIngredientReview(previous, [draft(), draft({ id: 'bad', quantity: '-1' })], factory)).toThrow();
    expect(factory).not.toHaveBeenCalled();
    expect(previous.items).toEqual([]);
  });

  it('permite excluir filas inválidas y rechaza identificadores repetidos o decisiones desconocidas', () => {
    expect(applyIngredientReview(list(), [draft(), draft({ id: 'excluded', included: false, quantity: '-1' })], ids()).items).toHaveLength(1);
    expect(() => applyIngredientReview(list(), [draft(), draft()], ids())).toThrow('datos no válidos');
    expect(() => applyIngredientReview(list(), [draft({ decision: 'automatic' as IngredientDraft['decision'] })], ids())).toThrow('datos no válidos');
    expect(() => applyIngredientReview(list(), [draft({ category: 'Unknown' as Category })], ids())).toThrow('categoría');
    expect(() => applyIngredientReview(list(), [draft({ unit: undefined as unknown as Unit })], ids())).toThrow('unidad');
  });

  it('conserva un existente con precio y marcado aunque su fila descartada tenga cantidad inválida', () => {
    const previous = list([item({ name: 'Leche', unit: 'L', checked: true, unitPriceCents: 0, priceKind: 'entered' })]);
    const next = applyIngredientReview(previous, [
      draft({ name: 'Leche', quantity: '-3', unit: 'L', decision: 'skip', targetId: 'existing' }),
      draft({ id: 'included' }),
    ], ids());
    expect(next.items).toHaveLength(2);
    expect(next.items[0]).toEqual(previous.items[0]);
    expect(next.items[1]).toMatchObject({ name: 'Arroz', checked: false, unitPriceCents: null });
    expect(previous.items).toHaveLength(1);
  });

  it('no guarda una revisión vacía, totalmente excluida o que conserva todo', () => {
    for (const selected of [[], [draft({ included: false })], [draft({ decision: 'skip' })]]) {
      expect(() => applyIngredientReview(list(), selected, ids())).toThrow();
    }
  });

  it('rechaza un id nuevo duplicado con cualquier producto existente', () => {
    const previous = list([item({ name: 'Leche' })]);
    expect(() => applyIngredientReview(previous, [draft()], () => 'existing')).toThrow('identificador único');
  });
});
