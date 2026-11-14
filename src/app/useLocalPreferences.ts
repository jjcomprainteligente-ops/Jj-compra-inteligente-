import { useCallback, useEffect, useRef, useState } from 'react';
import {
  emptyLocalPreferences, validateLocalPreferences, type LocalPreferences,
} from '../domain/localPreferences';
import { loadLocalPreferences, saveLocalPreferences, STORAGE_KEY } from '../storage/localPreferences';
import { saveIfUnchanged, storageSnapshot } from '../storage/writeCoordinator';

export interface LocalPreferencesStore {
  data: LocalPreferences;
  loading: boolean;
  busy: boolean;
  loadError: string;
  saveError: string;
  reload(): Promise<void>;
  commit(transform: (previous: LocalPreferences) => LocalPreferences): Promise<boolean>;
}

export function useLocalPreferences(): LocalPreferencesStore {
  const [data, setData] = useState<LocalPreferences>(emptyLocalPreferences);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const current = useRef(data);
  const lock = useRef(false);
  const ready = useRef(false);
  const mounted = useRef(true);

  const reload = useCallback(async () => {
    if (lock.current || !mounted.current) return;
    lock.current = true;
    ready.current = false;
    setLoading(true);
    setLoadError('');
    try {
      const loaded = await loadLocalPreferences();
      if (mounted.current) {
        current.current = loaded;
        setData(loaded);
        setSaveError('');
        ready.current = true;
      }
    } catch (error) {
      if (mounted.current) setLoadError(error instanceof Error ? error.message : 'localSettings.error.load');
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

  const commit = useCallback(async (transform: (previous: LocalPreferences) => LocalPreferences) => {
    if (lock.current || !ready.current || !mounted.current) return false;
    lock.current = true;
    setBusy(true);
    setSaveError('');
    const before = current.current;
    try {
      const next = validateLocalPreferences(transform(storageSnapshot(before)));
      const saved = await saveIfUnchanged({
        key: STORAGE_KEY, expected: before, next, read: loadLocalPreferences, write: saveLocalPreferences,
      });
      if (mounted.current) { current.current = saved; setData(saved); }
      return true;
    } catch (error) {
      if (mounted.current) setSaveError(error instanceof Error ? error.message : 'localSettings.error.save');
      return false;
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }, []);

  return { data, loading, busy, loadError, saveError, reload, commit };
}
