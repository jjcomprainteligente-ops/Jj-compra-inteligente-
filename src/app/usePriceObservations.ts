import { useCallback, useEffect, useRef, useState } from 'react';
import type { PriceObservation } from '../domain/priceObservations';
import {
  loadPriceObservations, savePriceObservations, validateObservations, STORAGE_KEY,
} from '../storage/priceObservations';
import { saveIfUnchanged } from '../storage/writeCoordinator';
import { appError } from '../i18n/errors';

interface UndoObservationChange {
  before: PriceObservation[];
  label: string;
}

/** Writes are serialized, and displayed observations change only after persistence. */
export function usePriceObservations() {
  const [observations, setObservations] = useState<PriceObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [undo, setUndo] = useState<UndoObservationChange | null>(null);
  const current = useRef(observations);
  const lock = useRef(false);
  const ready = useRef(false);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    if (lock.current || !mounted.current) return;
    lock.current = true;
    ready.current = false;
    setLoading(true);
    setLoadError('');
    setSaveError('');
    setUndo(null);
    try {
      const restored = await loadPriceObservations();
      if (mounted.current) {
        current.current = restored;
        setObservations(restored);
        ready.current = true;
      }
    } catch (error) {
      if (mounted.current) setLoadError(error instanceof Error ? error.message : appError('errors.observationsLoad').message);
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

  const commit = useCallback(async (
    transform: (previous: PriceObservation[]) => PriceObservation[], undoLabel?: string,
  ): Promise<boolean> => {
    if (lock.current || !ready.current || !mounted.current) return false;
    lock.current = true;
    setBusy(true);
    setSaveError('');
    const before = current.current;
    try {
      // A transform receives its own snapshot; even an accidental mutation cannot
      // change the visible state or the undo snapshot before the write succeeds.
      const next = validateObservations(transform(validateObservations(before)));
      const saved = await saveIfUnchanged({ key: STORAGE_KEY, expected: before, next, read: loadPriceObservations, write: savePriceObservations });
      if (!mounted.current) return false;
      current.current = saved;
      setObservations(saved);
      setUndo(undoLabel ? { before, label: undoLabel } : null);
      return true;
    } catch (error) {
      if (mounted.current) setSaveError(error instanceof Error ? error.message : appError('errors.observationsSave').message);
      return false;
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }, []);

  const undoLast = useCallback(async (): Promise<boolean> => undo ? commit(() => undo.before) : false, [commit, undo]);

  return { observations, loading, busy, loadError, saveError, reload, commit, undo, undoLast };
}
