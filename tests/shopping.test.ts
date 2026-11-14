import { describe, expect, it } from 'vitest';
import {
  findDuplicate, formatQuantity, itemTotalCents, parseQuantity, summarizeList,
  validateBudget, validateItemInput, validateListName,
  type Category, type ItemInput, type ShoppingItem, type ShoppingList, type Unit,
} from '../src/domain/shopping';

const item = (overrides: Partial<ShoppingItem> = {}): ShoppingItem => ({
  id: 'item-1', name: 'Leche', quantityMilli: 1000, unit: 'L', category: 'Lácteos y huevos',
  note: '', checked: false, unitPriceCents: null, priceKind: null, ...overrides,
});
const list = (items: ShoppingItem[], budgetCents: number | null = null): ShoppingList => ({
  id: 'list-1', name: 'Compra', items, budgetCents,
});
const input = (overrides: Partial<ItemInput> = {}): ItemInput => ({
  name: ' Leche ', quantity: '2', unit: 'L', category: 'Lácteos y huevos', note: ' Entera ',
  price: '', priceKind: 'entered', ...overrides,
});

describe('cantidades exactas', () => {
  it.each([
    ['1', 'ud', 1000], ['001', 'ud', 1000], ['1.000', 'ud', 1000],
    ['0,125', 'kg', 125], ['1.25', 'L', 1250], ['250', 'g', 250000],
    ['0.001', 'ml', 1], ['1000000', 'g', 1_000_000_000],
  ] as const)('interpreta %s %s en milésimas', (value, unit, expected) => {
    expect(parseQuantity(value, unit)).toBe(expected);
  });

  it.each(['', '0', '-1', '+1', 'NaN', 'Infinity', '1e3', '.5', '1,', '1.2345', '1 000', '1,2.3', '1000000.001', '9'.repeat(100)])('rechaza cantidad inválida %s', value => {
    expect(() => parseQuantity(value, 'kg')).toThrow();
  });

  it('exige unidades enteras y enum conocido', () => {
    expect(() => parseQuantity('1,5', 'ud')).toThrow('entera');
    expect(() => parseQuantity('1', 'caja' as Unit)).toThrow('unidad válida');
    for (const invalid of [undefined, null] as unknown as Unit[]) {
      expect(() => parseQuantity('1', invalid)).toThrow('unidad válida');
      expect(() => itemTotalCents(item({ unit: invalid }))).toThrow('unidad válida');
      expect(() => validateItemInput(input({ unit: invalid }))).toThrow('unidad válida');
    }
  });

  it('formatea sin agrupación y permite volver a editar sin perder precisión', () => {
    for (const quantity of [1, 125, 1000, 1250, 100_001, 1_000_000_000]) {
      expect(parseQuantity(formatQuantity(quantity), 'kg')).toBe(quantity);
    }
    expect(formatQuantity(1250)).toBe('1,25');
    expect(formatQuantity(1_000_000_000)).toBe('1000000');
    expect(() => formatQuantity(0)).toThrow();
  });
});

describe('producto y precio por unidad', () => {
  it('distingue precio pendiente de cero introducido y cero estimado', () => {
    expect(validateItemInput(input())).toMatchObject({ name: 'Leche', note: 'Entera', quantityMilli: 2000, unitPriceCents: null, priceKind: null });
    expect(validateItemInput(input({ price: '0' }))).toMatchObject({ unitPriceCents: 0, priceKind: 'entered' });
    expect(validateItemInput(input({ price: '0,00', priceKind: 'estimated' }))).toMatchObject({ unitPriceCents: 0, priceKind: 'estimated' });
    expect(validateItemInput(input({ price: ' ', priceKind: 'estimated' }))).toMatchObject({ unitPriceCents: null, priceKind: null });
  });

  it('mantiene los céntimos exactos y multiplica por cantidad', () => {
    const validated = validateItemInput(input({ price: '1,29', quantity: '2' }));
    expect(itemTotalCents(validated)).toBe(258);
    expect(itemTotalCents(item({ unit: 'kg', quantityMilli: 1250, unitPriceCents: 199 }))).toBe(249);
  });

  it('redondea medias unidades de céntimo hacia arriba, una vez por línea', () => {
    expect(itemTotalCents(item({ quantityMilli: 500, unitPriceCents: 1 }))).toBe(1);
    expect(itemTotalCents(item({ quantityMilli: 499, unitPriceCents: 1 }))).toBe(0);
    expect(itemTotalCents(item({ quantityMilli: 1500, unitPriceCents: 1 }))).toBe(2);
  });

  it('acepta el mayor céntimo seguro sin división por coma flotante', () => {
    expect(itemTotalCents(item({ unitPriceCents: Number.MAX_SAFE_INTEGER }))).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => itemTotalCents(item({ quantityMilli: 1001, unitPriceCents: Number.MAX_SAFE_INTEGER }))).toThrow('demasiado grande');
  });

  it.each(['-1', '1.234', '1e2', 'Infinity', '9'.repeat(100)])('rechaza precio inválido %s', price => {
    expect(() => validateItemInput(input({ price }))).toThrow();
  });

  it('limita textos y valida categoría y procedencia', () => {
    expect(() => validateItemInput(input({ name: ' ' }))).toThrow('nombre');
    expect(() => validateItemInput(input({ name: 'x'.repeat(121) }))).toThrow('120');
    expect(() => validateItemInput(input({ note: 'x'.repeat(501) }))).toThrow('500');
    expect(() => validateItemInput(input({ category: 'Desconocida' as Category }))).toThrow('categoría');
    expect(() => validateItemInput(input({ priceKind: 'verified' as ItemInput['priceKind'] }))).toThrow('introducido o estimado');
  });

  it('rechaza componentes numéricos inválidos incluso si podrían sumarse', () => {
    expect(() => itemTotalCents(item({ unitPriceCents: -1 }))).toThrow();
    expect(() => itemTotalCents(item({ unitPriceCents: 0.5 }))).toThrow();
    expect(() => itemTotalCents(item({ unitPriceCents: Number.MAX_SAFE_INTEGER + 1 }))).toThrow();
    expect(() => itemTotalCents(item({ quantityMilli: 1.5 }))).toThrow();
  });
});

describe('resumen: presupuesto, gasto, estimación y desconocidos', () => {
  it('separa lo comprado de lo introducido y nunca trata ausentes como gasto cero', () => {
    const summary = summarizeList(list([
      item({ id: 'entered-checked', unitPriceCents: 129, quantityMilli: 2000, priceKind: 'entered', checked: true }),
      item({ id: 'entered-pending', unitPriceCents: 300, priceKind: 'entered' }),
      item({ id: 'estimate-checked', unitPriceCents: 99, priceKind: 'estimated', checked: true }),
      item({ id: 'missing-checked', checked: true }),
      item({ id: 'zero-entered', unitPriceCents: 0, priceKind: 'entered', checked: true }),
    ], 600));
    expect(summary).toEqual({
      itemCount: 5, checkedCount: 4, missingPriceCount: 1,
      enteredTotalCents: 558, estimatedTotalCents: 99, knownTotalCents: 657,
      spentCents: 258, spentIncompleteCount: 2, excessCents: 57,
    });
  });

  it('maneja presupuesto ausente, cero y lista vacía como estados distintos', () => {
    expect(summarizeList(list([]))).toMatchObject({ itemCount: 0, knownTotalCents: 0, excessCents: 0 });
    const priced = item({ unitPriceCents: 150, priceKind: 'entered' });
    expect(summarizeList(list([priced]))).toMatchObject({ excessCents: 0 });
    expect(summarizeList(list([priced], 0))).toMatchObject({ excessCents: 150 });
    expect(validateBudget('')).toBeNull();
    expect(validateBudget('0')).toBe(0);
    expect(validateBudget('60,50')).toBe(6050);
    expect(() => validateBudget('-1')).toThrow('Presupuesto');
  });

  it('impide que varias líneas desborden un total aunque individualmente sean seguras', () => {
    const max = item({ unitPriceCents: Number.MAX_SAFE_INTEGER, priceKind: 'entered' });
    const extra = item({ id: 'extra', unitPriceCents: 1, priceKind: 'estimated' });
    expect(() => summarizeList(list([max, extra]))).toThrow('demasiado grande');
  });

  it('rechaza precios que no concuerdan con su procedencia', () => {
    expect(() => summarizeList(list([item({ priceKind: 'entered' })]))).toThrow('coherentes');
    expect(() => summarizeList(list([item({ unitPriceCents: 10 })]))).toThrow('coherentes');
    expect(() => summarizeList(list([], -1))).toThrow();
  });
});

describe('nombres y repetidos', () => {
  it('valida nombres de lista sin perder el nombre introducido', () => {
    expect(validateListName('  Compra semanal  ')).toBe('Compra semanal');
    expect(() => validateListName(' ')).toThrow();
    expect(() => validateListName('x'.repeat(81))).toThrow('80');
  });

  it('detecta mayúsculas, acentos y espacios sin unir ni mutar artículos', () => {
    const original = item({ name: 'Plátano   de Canarias', unit: 'ud' });
    const items = [original];
    expect(findDuplicate(items, ' plAtano de canarias ', 'ud')).toBe(original);
    expect(findDuplicate(items, 'Plátano de Canarias', 'kg')).toBeUndefined();
    expect(findDuplicate(items, 'Plátano de Canarias', 'ud', original.id)).toBeUndefined();
    expect(items).toEqual([original]);
    expect(original.name).toBe('Plátano   de Canarias');
  });

  it.each([['g', 'kg'], ['kg', 'g'], ['ml', 'L'], ['L', 'ml']] as const)(
    'avisa de productos equivalentes entre %s y %s sin sumar cantidades', (storedUnit, addedUnit) => {
      const original = Object.freeze(item({ name: '  Arroz   integral ', unit: storedUnit, quantityMilli: 500000 }));
      const items = Object.freeze([original]);
      expect(findDuplicate(items, 'arroz integral', addedUnit)).toBe(original);
      expect(original.quantityMilli).toBe(500000);
      expect(original.unit).toBe(storedUnit);
      expect(items).toEqual([original]);
    },
  );

  it.each([['ud', 'g'], ['ud', 'kg'], ['ud', 'ml'], ['ud', 'L'], ['g', 'L'], ['kg', 'ml']] as const)(
    'mantiene separadas las dimensiones %s y %s', (storedUnit, addedUnit) => {
      expect(findDuplicate([item({ name: 'Tomate', unit: storedUnit })], 'Tomate', addedUnit)).toBeUndefined();
      expect(findDuplicate([item({ name: 'Tomate', unit: addedUnit })], 'Tomate', storedUnit)).toBeUndefined();
    },
  );

  it('excluye el artículo editado y encuentra otro equivalente sin confundir nombres', () => {
    const first = item({ id: 'first', name: 'Arroz', unit: 'g' });
    const second = item({ id: 'second', name: 'Arroz', unit: 'kg' });
    expect(findDuplicate([first, second], 'arroz', 'kg', first.id)).toBe(second);
    expect(findDuplicate([first], 'arroz', 'kg', first.id)).toBeUndefined();
    expect(findDuplicate([first, second], 'Arroz integral', 'g')).toBeUndefined();
  });
});
