import { useCallback, useEffect, useRef, useState } from 'react';
import { validateMealPlan, type MealPlan } from '../domain/menus';
import { loadMealPlan, saveMealPlan, STORAGE_KEY } from '../storage/menus';
import { saveIfUnchanged } from '../storage/writeCoordinator';
import { appError } from '../i18n/errors';

/** A failed menu load blocks menu writes, without affecting the independent shopping store. */
export function useMealPlan() {
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const lock = useRef(false);
  const ready = useRef(false);
  const mounted = useRef(true);
  const current = useRef<MealPlan | null>(null);

  const reload = useCallback(async () => {
    if (lock.current) return;
    lock.current = true;
    ready.current = false;
    setLoading(true);
    setLoadError('');
    setSaveError('');
    try {
      const restored = await loadMealPlan();
      if (mounted.current) { current.current = restored; setPlan(restored); ready.current = true; }
    } catch (error) {
      if (mounted.current) setLoadError(error instanceof Error ? error.message : appError('errors.menuLoad').message);
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

  const save = useCallback(async (next: MealPlan | null): Promise<boolean> => {
    if (lock.current || !ready.current || !mounted.current) return false;
    lock.current = true;
    setBusy(true);
    setSaveError('');
    try {
      // Snapshot before awaiting, so callers cannot change the displayed plan during a write.
      const validated = next === null ? null : validateMealPlan(next);
      const saved = await saveIfUnchanged({ key: STORAGE_KEY, expected: current.current, next: validated, read: loadMealPlan, write: saveMealPlan });
      if (!mounted.current) return false;
      current.current = saved;
      setPlan(saved);
      return true;
    } catch (error) {
      if (mounted.current) setSaveError(error instanceof Error ? error.message : appError('errors.menuSave').message);
      return false;
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }, []);

  return { plan, loading, busy, loadError, saveError, reload, save };
}
