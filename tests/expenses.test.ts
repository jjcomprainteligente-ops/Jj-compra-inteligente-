import { describe, expect, it, vi } from 'vitest';
import {
  emptyExpensesState, ExpenseError, expenseToday, MAX_EXPENSES, parseExpenseAmount,
  totalExpenses, validateExpenseInput, validateExpensesState, type Expense, type ExpenseInput,
} from '../src/domain/expenses';

const TODAY = '2026-07-17';
const input = (overrides: Partial<ExpenseInput> = {}): ExpenseInput => ({
  amount: '12,34', date: TODAY, store: 'Mercado', note: '',
  listId: null, listName: null, confirmed: true, ...overrides,
});
const expense = (overrides: Partial<Expense> = {}): Expense => ({
  id: 'expense-1', ...validateExpenseInput(input(), TODAY), ...overrides,
});

describe('importes de pagos confirmados en céntimos exactos', () => {
  it.each([
    ['0', 0], ['0,01', 1], ['0.10', 10], [' 0012,3 ', 1230],
    ['12.34', 1234], ['90071992547409.91', Number.MAX_SAFE_INTEGER],
  ])('lee %s sin redondeo binario', (amount, cents) => {
    expect(parseExpenseAmount(amount)).toBe(cents);
  });

  it.each(['', ' ', '-1', '+1', '1e3', 'Infinity', 'NaN', '1,000.00', '1.000,00', '1 000', '1.', '.5', '1.001', '€1', '1\n2'])('rechaza el importe ambiguo %j', amount => {
    expect(() => parseExpenseAmount(amount)).toThrow('money.errors.amount');
  });

  it('rechaza los céntimos que exceden el rango entero seguro', () => {
    expect(() => parseExpenseAmount('90071992547409.92')).toThrow('money.errors.amountTooLarge');
    expect(() => validateExpensesState({ expenses: [expense({ amountCents: Number.MAX_SAFE_INTEGER + 1 })] }, TODAY)).toThrow('money.errors.amount');
    expect(() => validateExpensesState({ expenses: [expense({ amountCents: 0.5 })] }, TODAY)).toThrow('money.errors.amount');
  });

  it.each([false, undefined, 'true', 1])('exige una confirmación booleana explícita: %s', confirmed => {
    expect(() => validateExpenseInput({ ...input(), confirmed } as ExpenseInput, TODAY)).toThrow('money.errors.confirmation');
  });

  it('normaliza la entrada y conserva solo campos de un pago ya confirmado', () => {
    const original = { ...input({ store: '  Mercado  ', note: '  Compra semanal\nCon ticket  ', listId: 'list-1', listName: '  Semana  ' }), checked: true, priceKind: 'estimated' };
    const snapshot = JSON.stringify(original);
    const validated = validateExpenseInput(original, TODAY);
    expect(validated).toEqual({ amountCents: 1234, date: TODAY, store: 'Mercado', note: 'Compra semanal\nCon ticket', listId: 'list-1', listName: 'Semana', source: 'user-confirmed' });
    expect(validated).not.toHaveProperty('confirmed');
    expect(validated).not.toHaveProperty('checked');
    expect(JSON.stringify(original)).toBe(snapshot);
  });
});

describe('fechas reales según el día de Tenerife', () => {
  it.each(['2026-02-29', '2024-02-30', '1900-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-01-00', '0000-01-01', '26-01-01', '17/07/2026', '2026-7-17', '2026-07-17T00:00:00Z'])('rechaza la fecha inválida %s', date => {
    expect(() => validateExpenseInput(input({ date }), TODAY)).toThrow('money.errors.date');
  });

  it.each(['2024-02-29', '2000-02-29', '2026-07-17'])('acepta el día real no futuro %s', date => {
    expect(validateExpenseInput(input({ date }), TODAY).date).toBe(date);
  });

  it('rechaza fechas futuras de entrada y de almacenamiento sin cambiar el día', () => {
    expect(() => validateExpenseInput(input({ date: '2026-07-18' }), TODAY)).toThrow('money.errors.futureDate');
    expect(() => validateExpensesState({ expenses: [expense({ date: '2026-07-18' })] }, TODAY)).toThrow('money.errors.futureDate');
  });

  it('usa el día canario al cruzar medianoche de verano y de invierno', () => {
    expect(expenseToday(new Date('2026-07-17T23:30:00Z'))).toBe('2026-07-18');
    expect(expenseToday(new Date('2026-01-17T23:30:00Z'))).toBe('2026-01-17');
    expect(expenseToday(new Date('2026-03-29T00:30:00Z'))).toBe('2026-03-29');
    expect(expenseToday(new Date('2026-10-25T23:30:00Z'))).toBe('2026-10-25');
  });

  it('mantiene el día canario cuando el runtime no admite su zona horaria', () => {
    const formatter = vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => { throw new RangeError('Missing time zone'); });
    try {
      expect(expenseToday(new Date('2026-07-17T23:30:00Z'))).toBe('2026-07-18');
      expect(expenseToday(new Date('2026-01-17T23:30:00Z'))).toBe('2026-01-17');
      expect(expenseToday(new Date('2026-10-25T23:30:00Z'))).toBe('2026-10-25');
    } finally { formatter.mockRestore(); }
  });

  it('rechaza un reloj inválido en vez de guardar una fecha inventada', () => {
    expect(() => expenseToday(new Date('invalid'))).toThrow('money.errors.date');
  });
});

describe('integridad del historial local', () => {
  it('parte sin pagos, aunque exista una compra marcada o estimada ajena', () => {
    const state = validateExpensesState({ expenses: [], checked: true, totalCents: 9999, lists: [{ items: [{ checked: true, amountCents: 9999 }] }] }, TODAY);
    expect(state).toEqual(emptyExpensesState());
    expect(totalExpenses(state.expenses)).toBe(0);
    expect(() => totalExpenses([{ checked: true, amountCents: 9999 } as unknown as Expense])).toThrow('money.errors.record');
    expect(() => totalExpenses([expense({ source: 'estimated' as Expense['source'] })])).toThrow('money.errors.record');
  });

  it('suma solo registros confirmados y filtra por lista sin mezclar gastos independientes', () => {
    const expenses = [
      expense({ id: 'a', amountCents: 10, listId: 'a', listName: 'Lista A' }),
      expense({ id: 'b', amountCents: 20, listId: 'b', listName: 'Lista B' }),
      expense({ id: 'c', amountCents: 30, listId: 'a', listName: 'Lista A anterior' }),
      expense({ id: 'd', amountCents: 40 }),
    ];
    expect(totalExpenses(expenses)).toBe(100);
    expect(totalExpenses(expenses, 'a')).toBe(40);
    expect(totalExpenses(expenses, 'b')).toBe(20);
    expect(totalExpenses(expenses, null)).toBe(40);
    expect(totalExpenses(expenses, 'missing')).toBe(0);
  });

  it('detecta desbordamiento de la suma sin depender del orden o de floats', () => {
    const expenses = [expense({ id: 'large', amountCents: Number.MAX_SAFE_INTEGER }), expense({ id: 'small', amountCents: 1 })];
    expect(() => totalExpenses(expenses)).toThrow('money.errors.amountTooLarge');
    expect(() => validateExpensesState({ expenses }, TODAY)).toThrow('money.errors.amountTooLarge');
    expect(totalExpenses([expense({ amountCents: Number.MAX_SAFE_INTEGER })])).toBe(Number.MAX_SAFE_INTEGER);
  });

  it.each([
    { listId: null, listName: 'Lista' }, { listId: 'list', listName: null },
    { listId: '', listName: 'Lista' }, { listId: 'list', listName: '' },
  ])('exige referencias de lista completas: %j', reference => {
    expect(() => validateExpenseInput(input(reference), TODAY)).toThrow('money.errors.list');
  });

  it.each([
    { id: '' }, { id: '\u202Efake' }, { source: 'estimated' }, { source: 'checked' },
    { amountCents: -1 }, { amountCents: '100' }, { store: 'x'.repeat(121) },
    { note: 'x'.repeat(501) }, { store: 'Mi\nTienda' }, { note: 'nota\u0000' },
  ])('rechaza registros incompletos o engañosos: %j', change => {
    expect(() => validateExpensesState({ expenses: [{ ...expense(), ...change }] }, TODAY)).toThrow(ExpenseError);
  });

  it('detecta identificadores duplicados incluso tras normalizarlos', () => {
    expect(() => validateExpensesState({ expenses: [expense(), expense({ id: ' expense-1 ' })] }, TODAY)).toThrow('money.errors.duplicate');
  });

  it('limita el historial a 5000 registros y no elimina los sobrantes automáticamente', () => {
    const expenses = Array.from({ length: MAX_EXPENSES }, (_, index) => expense({ id: `expense-${index}`, amountCents: 1 }));
    expect(validateExpensesState({ expenses }, TODAY).expenses).toHaveLength(MAX_EXPENSES);
    expenses.push(expense({ id: 'one-too-many' }));
    expect(() => validateExpensesState({ expenses }, TODAY)).toThrow('money.errors.limit');
    expect(expenses).toHaveLength(MAX_EXPENSES + 1);
  });

  it('devuelve una copia independiente que omite campos extra y conserva nombres históricos', () => {
    const original = { expenses: [{ ...expense({ listId: 'deleted-list', listName: 'Nombre original' }), token: 'do not retain', confirmed: true }], shopping: 'do not retain' };
    const clean = validateExpensesState(original, TODAY);
    expect(clean).toEqual({ expenses: [expense({ listId: 'deleted-list', listName: 'Nombre original' })] });
    clean.expenses[0].note = 'Changed';
    expect(original.expenses[0].note).toBe('');
  });
});
