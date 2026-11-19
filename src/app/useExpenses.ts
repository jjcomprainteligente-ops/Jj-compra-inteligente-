import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyExpensesState, type ExpensesState } from '../domain/expenses';
import { loadExpenses, saveExpenses, STORAGE_KEY } from '../storage/expenses';
import { saveIfUnchanged, storageSnapshot } from '../storage/writeCoordinator';

export function useExpenses() {
  const [data, setData] = useState<ExpensesState>(emptyExpensesState);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [undo, setUndo] = useState<{ before: ExpensesState; label: string } | null>(null);
  const current = useRef(data);
  const lock = useRef(false);
  const ready = useRef(false);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    if (lock.current) return;
    lock.current = true;
    ready.current = false;
    setLoading(true);
    setLoadError('');
    try {
      const loaded = await loadExpenses();
      if (mounted.current) {
        current.current = loaded;
        setData(loaded);
        setUndo(null);
        setSaveError('');
        ready.current = true;
      }
    } catch (error) {
      if (mounted.current) setLoadError(error instanceof Error ? error.message : 'money.errors.load');
    } finally {
      lock.current = false;
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => { mounted.current = false; };
  }, [reload]);

  const commit = useCallback(async (transform: (previous: ExpensesState) => ExpensesState, undoLabel?: string): Promise<boolean> => {
    if (lock.current || !ready.current || !mounted.current) return false;
    lock.current = true;
    setBusy(true);
    setSaveError('');
    const before = current.current;
    try {
      const next = transform(storageSnapshot(before));
      const saved = await saveIfUnchanged({ key: STORAGE_KEY, expected: before, next, read: loadExpenses, write: saveExpenses });
      if (mounted.current) {
        current.current = saved;
        setData(saved);
        setUndo(undoLabel ? { before, label: undoLabel } : null);
      }
      return true;
    } catch (error) {
      if (mounted.current) setSaveError(error instanceof Error ? error.message : 'money.errors.save');
      return false;
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }, []);

  const undoLast = async (): Promise<boolean> => undo ? commit(() => undo.before) : false;
  return { data, loading, busy, loadError, saveError, undo, reload, commit, undoLast,
    clearSaveError: () => setSaveError(''), clearUndo: () => setUndo(null) };
}

export type ExpensesStore = ReturnType<typeof useExpenses>;
