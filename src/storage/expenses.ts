import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyExpensesState, ExpenseError, validateExpensesState, type ExpensesState } from '../domain/expenses';

export const STORAGE_KEY = 'jjcompraintelwgiemt.expenses.v1';
const MAX_DOCUMENT_LENGTH = 8 * 1024 * 1024;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function parseExpenses(serialized: string, today?: string): ExpensesState {
  if (typeof serialized !== 'string' || serialized.length > MAX_DOCUMENT_LENGTH) throw new ExpenseError('money.errors.unreadable');
  let parsed: unknown;
  try { parsed = JSON.parse(serialized); }
  catch { throw new ExpenseError('money.errors.unreadable'); }
  if (record(parsed) && typeof parsed.version === 'number' && parsed.version !== 1) {
    throw new ExpenseError('money.errors.version');
  }
  try {
    if (!record(parsed) || parsed.version !== 1) throw new Error();
    return validateExpensesState(parsed.data, today);
  } catch { throw new ExpenseError('money.errors.unreadable'); }
}

export function serializeExpenses(state: ExpensesState, today?: string): string {
  return JSON.stringify({ version: 1, data: validateExpensesState(state, today) });
}

/** No expense document means no confirmed payments; reading never writes. */
export async function loadExpenses(): Promise<ExpensesState> {
  let serialized: string | null;
  try { serialized = await AsyncStorage.getItem(STORAGE_KEY); }
  catch { throw new ExpenseError('money.errors.load'); }
  return serialized === null ? emptyExpensesState() : parseExpenses(serialized);
}

/** Validation completes before the atomic write to the separate expense key. */
export async function saveExpenses(state: ExpensesState): Promise<void> {
  const serialized = serializeExpenses(state);
  try { await AsyncStorage.setItem(STORAGE_KEY, serialized); }
  catch { throw new ExpenseError('money.errors.save'); }
}
