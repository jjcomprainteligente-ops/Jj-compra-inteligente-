import { useCallback, useEffect, useRef, useState } from 'react';
import type { ShoppingState } from '../domain/shopping';
import { emptyShoppingState, loadShopping, saveShopping, STORAGE_KEY } from '../storage/shopping';
import { saveIfUnchanged, storageSnapshot } from '../storage/writeCoordinator';
import { appError } from '../i18n/errors';

export function useShopping() {
  const [data, setData] = useState<ShoppingState>(emptyShoppingState);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [undo, setUndo] = useState<{ before: ShoppingState; label: string } | null>(null);
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
      const loaded = await loadShopping();
      if (mounted.current) { current.current = loaded; setData(loaded); setUndo(null); setSaveError(''); ready.current = true; }
    } catch (error) {
      if (mounted.current) setLoadError(error instanceof Error ? error.message : appError('errors.shoppingLoad').message);
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

  const commit = useCallback(async (transform: (previous: ShoppingState) => ShoppingState, undoLabel?: string) => {
    if (lock.current || !ready.current || !mounted.current) return false;
    lock.current = true;
    setBusy(true);
    setSaveError('');
    const before = current.current;
    try {
      // A transform cannot mutate the current state or its undo snapshot in place.
      const next = transform(storageSnapshot(before));
      const saved = await saveIfUnchanged({ key: STORAGE_KEY, expected: before, next, read: loadShopping, write: saveShopping });
      if (mounted.current) {
        current.current = saved;
        setData(saved);
        setUndo(undoLabel ? { before, label: undoLabel } : null);
      }
      return true;
    } catch (error) {
      if (mounted.current) setSaveError(error instanceof Error ? error.message : appError('errors.shoppingSave').message);
      return false;
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }, []);

  const undoLast = async () => undo ? commit(() => undo.before) : false;
  return { data, loading, busy, loadError, saveError, undo, reload, commit, undoLast,
    clearSaveError: () => setSaveError(''), clearUndo: () => setUndo(null) };
}
