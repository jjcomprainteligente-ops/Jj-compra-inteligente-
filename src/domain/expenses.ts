/** Confirmed expenses are independent from list estimates and checked products. */
export interface Expense {
  id: string;
  amountCents: number;
  date: string;
  store: string;
  note: string;
  listId: string | null;
  listName: string | null;
  source: 'user-confirmed';
}

export interface ExpenseInput {
  amount: string;
  date: string;
  store: string;
  note: string;
  listId: string | null;
  listName: string | null;
  confirmed: boolean;
}

export interface ExpensesState { expenses: Expense[] }

export type ExpenseErrorKey =
  | 'money.errors.amount' | 'money.errors.amountTooLarge' | 'money.errors.date'
  | 'money.errors.futureDate' | 'money.errors.confirmation' | 'money.errors.store'
  | 'money.errors.note' | 'money.errors.list' | 'money.errors.record'
  | 'money.errors.recordChanged' | 'money.errors.limit' | 'money.errors.duplicate'
  | 'money.errors.load' | 'money.errors.unreadable' | 'money.errors.version'
  | 'money.errors.save';

export class ExpenseError extends Error {
  constructor(readonly key: ExpenseErrorKey) {
    super(key);
    this.name = 'ExpenseError';
  }
}

export const MAX_EXPENSES = 5000;
const MAX_CENTS = BigInt(Number.MAX_SAFE_INTEGER);
const UNSAFE_TEXT = /[\u0000-\u001F\u007F-\u009F\u200B\u200E\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/;
const UNSAFE_NOTE = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F\u200B\u200E\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cleanText(value: unknown, max: number, error: ExpenseErrorKey, required = false, multiline = false): string {
  if (typeof value !== 'string') throw new ExpenseError(error);
  const cleaned = value.trim();
  if ((required && !cleaned) || cleaned.length > max || (multiline ? UNSAFE_NOTE : UNSAFE_TEXT).test(cleaned)) {
    throw new ExpenseError(error);
  }
  return cleaned;
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1];
}

/** The purchase day uses Tenerife time, regardless of the device's time zone. */
export function expenseToday(now = new Date()): string {
  if (!Number.isFinite(now.getTime())) throw new ExpenseError('money.errors.date');
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Atlantic/Canary', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(now);
    const part = (type: string) => parts.find(value => value.type === type)?.value;
    const formatted = `${part('year')?.padStart(4, '0')}-${part('month')}-${part('day')}`;
    if (isCalendarDate(formatted)) return formatted;
  } catch { /* Older runtimes can lack the IANA time-zone database. */ }

  // Canary follows UTC in winter and UTC+1 between the last Sundays of March
  // and October. Keep the same business day when Intl lacks this time zone.
  const year = now.getUTCFullYear();
  const lastSunday = (month: number) => {
    const lastDay = new Date(Date.UTC(year, month + 1, 0, 1));
    return lastDay.getTime() - lastDay.getUTCDay() * 86400000;
  };
  const timestamp = now.getTime();
  const summer = timestamp >= lastSunday(2) && timestamp < lastSunday(9);
  return new Date(timestamp + (summer ? 3600000 : 0)).toISOString().slice(0, 10);
}

export const todayCanary = expenseToday;

function validateDate(value: unknown, today: string): string {
  if (!isCalendarDate(value) || !isCalendarDate(today)) throw new ExpenseError('money.errors.date');
  if (value > today) throw new ExpenseError('money.errors.futureDate');
  return value;
}

/** Parse decimal EUR without binary floating-point multiplication or rounding. */
export function parseExpenseAmount(value: string): number {
  if (typeof value !== 'string') throw new ExpenseError('money.errors.amount');
  const cleaned = value.trim();
  if (cleaned.length > 32 || !/^\d+(?:[,.]\d{1,2})?$/.test(cleaned)) throw new ExpenseError('money.errors.amount');
  const [euros, decimals = ''] = cleaned.replace(',', '.').split('.');
  const cents = BigInt(euros) * 100n + BigInt(decimals.padEnd(2, '0'));
  if (cents > MAX_CENTS) throw new ExpenseError('money.errors.amountTooLarge');
  return Number(cents);
}

function validateCents(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new ExpenseError('money.errors.amount');
  }
  return value;
}

function listReference(input: Record<string, unknown>): Pick<Expense, 'listId' | 'listName'> {
  if (input.listId === null && input.listName === null) return { listId: null, listName: null };
  return {
    listId: cleanText(input.listId, 128, 'money.errors.list', true),
    listName: cleanText(input.listName, 80, 'money.errors.list', true),
  };
}

/** The UI must ask the user to confirm that this payment already happened. */
export function validateExpenseInput(input: ExpenseInput, today = expenseToday()): Omit<Expense, 'id'> {
  if (!record(input)) throw new ExpenseError('money.errors.record');
  if (input.confirmed !== true) throw new ExpenseError('money.errors.confirmation');
  return {
    amountCents: parseExpenseAmount(input.amount),
    date: validateDate(input.date, today),
    store: cleanText(input.store, 120, 'money.errors.store'),
    note: cleanText(input.note, 500, 'money.errors.note', false, true),
    ...listReference(input),
    source: 'user-confirmed',
  };
}

export function emptyExpensesState(): ExpensesState { return { expenses: [] }; }

/** Undefined selects all expenses; null selects only expenses without a list. */
export function totalExpenses(expenses: readonly Expense[], listId?: string | null): number {
  let total = 0n;
  for (const expense of expenses) {
    if (!record(expense) || expense.source !== 'user-confirmed') throw new ExpenseError('money.errors.record');
    const cents = validateCents(expense.amountCents);
    if (listId === undefined || expense.listId === listId) total += BigInt(cents);
    if (total > MAX_CENTS) throw new ExpenseError('money.errors.amountTooLarge');
  }
  return Number(total);
}

/** Validate and copy stored records; never infer expenses from shopping data. */
export function validateExpensesState(input: unknown, today = expenseToday()): ExpensesState {
  if (!record(input) || !Array.isArray(input.expenses)) throw new ExpenseError('money.errors.record');
  if (input.expenses.length > MAX_EXPENSES) throw new ExpenseError('money.errors.limit');
  const ids = new Set<string>();
  const expenses = input.expenses.map((value: unknown): Expense => {
    if (!record(value) || value.source !== 'user-confirmed') throw new ExpenseError('money.errors.record');
    const id = cleanText(value.id, 128, 'money.errors.record', true);
    if (ids.has(id)) throw new ExpenseError('money.errors.duplicate');
    ids.add(id);
    return {
      id,
      amountCents: validateCents(value.amountCents),
      date: validateDate(value.date, today),
      store: cleanText(value.store, 120, 'money.errors.store'),
      note: cleanText(value.note, 500, 'money.errors.note', false, true),
      ...listReference(value),
      source: 'user-confirmed',
    };
  });
  totalExpenses(expenses);
  return { expenses };
}
