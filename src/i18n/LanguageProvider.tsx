import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { getLocales } from 'expo-localization';
import { categoryLabel, createFormatters, createTranslator, detectLanguage, resolveLanguage, unitLabel } from './core';
import { translateAppError } from './errors';
import { resources } from './resources';
import { createPreferencesStore, emptyPreferences, parsePreferences, PreferenceError, PREFERENCES_STORAGE_KEY,
  type LanguagePreferences, type PreferenceErrorKey } from './preferences';
import { isLanguage, type Language, type Translator } from './types';

function deviceTags(): string[] {
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.languages?.length) return [...navigator.languages];
  try {
    const tags = getLocales().map(locale => locale.languageTag);
    if (tags.length) return tags;
  } catch { /* Older native hosts still have Intl; no preference is overwritten. */ }
  try { return [Intl.DateTimeFormat().resolvedOptions().locale]; } catch { return ['es']; }
}

type Formatters = ReturnType<typeof createFormatters>;
export interface I18nContextValue extends Formatters {
  language: Language;
  t: Translator;
  translateError(error: unknown): string;
  categoryLabel(category: string): string;
  unitLabel(unit: string): string;
  ready: boolean;
  busy: boolean;
  preferenceError: string;
  source: 'manual' | 'device';
  setLanguage(language: Language): Promise<boolean>;
  followDevice(): Promise<boolean>;
  welcomeComplete: boolean;
  completeWelcome(): Promise<boolean>;
  retryPreferences(): Promise<void>;
  dismissWelcomeForSession(): void;
}

const Context = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [preferredTags, setPreferredTags] = useState(deviceTags);
  const [preferences, setPreferences] = useState<LanguagePreferences>(emptyPreferences);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<PreferenceErrorKey | null>(null);
  const [sessionWelcomeDismissed, setSessionWelcomeDismissed] = useState(false);
  const mounted = useRef(true);
  const mutationLock = useRef(false);
  const writable = useRef(false);
  const loadRevision = useRef(0);
  const externalRevision = useRef(0);
  const externalDirty = useRef(false);
  const mutationError = useRef<PreferenceErrorKey | null>(null);
  const store = useMemo(() => createPreferencesStore(), []);
  const language = resolveLanguage(preferredTags, preferences.language);
  const t = useMemo(() => createTranslator(language, resources), [language]);
  const formatters = useMemo(() => createFormatters(language), [language]);

  // A storage event may arrive while our own write is still resolving. Read the
  // latest document afterwards rather than dropping a newer selection.
  const refreshExternal = useCallback(async () => {
    if (mutationLock.current) { externalDirty.current = true; return; }
    const revision = externalRevision.current;
    externalDirty.current = false;
    try {
      const latest = await store.load();
      if (!mounted.current || revision !== externalRevision.current) return;
      if (mutationLock.current) { externalDirty.current = true; return; }
      setPreferences(latest); writable.current = true; setErrorKey(mutationError.current);
    } catch (error) {
      if (!mounted.current || revision !== externalRevision.current) return;
      writable.current = false;
      setErrorKey(error instanceof PreferenceError ? error.key : 'common.preferencesLoadError');
    }
  }, [store]);

  const retryPreferences = useCallback(async () => {
    if (mutationLock.current) return;
    mutationLock.current = true;
    ++externalRevision.current;
    const revision = ++loadRevision.current;
    mutationError.current = null;
    writable.current = false;
    // ready is an initialisation gate, not a reason to unmount open forms.
    setBusy(true);
    setErrorKey(null);
    try {
      const restored = await store.load();
      if (mounted.current && revision === loadRevision.current) {
        setPreferences(restored); writable.current = true;
      }
    } catch (error) {
      if (mounted.current && revision === loadRevision.current) {
        setErrorKey(error instanceof PreferenceError ? error.key : 'common.preferencesLoadError');
      }
    } finally {
      mutationLock.current = false;
      if (mounted.current && revision === loadRevision.current) { setReady(true); setBusy(false); }
      if (externalDirty.current && mounted.current) void refreshExternal();
    }
  }, [store, refreshExternal]);

  useEffect(() => {
    mounted.current = true;
    void retryPreferences();
    // StrictMode may clean up and re-run this effect while the first read is
    // still pending. Its mounted guard is enough for a real unmount; invalidating
    // that read here would leave the second setup waiting behind its own lock.
    return () => { mounted.current = false; ++externalRevision.current; };
  }, [retryPreferences]);

  useEffect(() => {
    const refreshDevice = () => setPreferredTags(deviceTags());
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') refreshDevice(); });
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.addEventListener('languagechange', refreshDevice);
    return () => {
      subscription.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.removeEventListener('languagechange', refreshDevice);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const changed = (event: StorageEvent) => {
      if (event.key !== PREFERENCES_STORAGE_KEY && event.key !== null) return;
      ++externalRevision.current;
      if (mutationLock.current) { externalDirty.current = true; return; }
      try {
        setPreferences(parsePreferences(event.newValue)); writable.current = true; setErrorKey(mutationError.current);
      } catch (error) {
        writable.current = false;
        setErrorKey(error instanceof PreferenceError ? error.key : 'common.preferencesCorrupt');
      }
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') document.documentElement.lang = language;
  }, [language]);

  const mutate = useCallback(async (operation: () => Promise<LanguagePreferences>): Promise<boolean> => {
    if (mutationLock.current || !writable.current || !mounted.current) return false;
    mutationLock.current = true;
    ++externalRevision.current;
    mutationError.current = null;
    setBusy(true); setErrorKey(null);
    try {
      const next = await operation();
      if (!mounted.current) return false;
      setPreferences(next);
      return true;
    } catch (error) {
      if (mounted.current) {
        mutationError.current = error instanceof PreferenceError ? error.key : 'common.preferencesWriteError';
        setErrorKey(mutationError.current);
      }
      return false;
    } finally {
      mutationLock.current = false;
      if (mounted.current) setBusy(false);
      if (externalDirty.current && mounted.current) void refreshExternal();
    }
  }, [refreshExternal]);

  const setLanguage = useCallback(async (selected: Language) => {
    if (!isLanguage(selected)) { setErrorKey('common.preferencesInvalidLanguage'); return false; }
    return mutate(() => store.setLanguage(selected));
  }, [mutate, store]);
  const followDevice = useCallback(async () => {
    setPreferredTags(deviceTags());
    return mutate(() => store.setLanguage(null));
  }, [mutate, store]);
  const completeWelcome = useCallback(() => mutate(() => store.completeWelcome()), [mutate, store]);

  const value = useMemo<I18nContextValue>(() => ({
    ...formatters, language, t, translateError: error => translateAppError(error, t),
    categoryLabel: category => categoryLabel(category, t), unitLabel: unit => unitLabel(unit, t),
    ready, busy, preferenceError: errorKey ? t(errorKey) : '', source: preferences.language === null ? 'device' : 'manual',
    setLanguage, followDevice, welcomeComplete: preferences.welcomeCompleted || sessionWelcomeDismissed,
    completeWelcome, retryPreferences, dismissWelcomeForSession: () => setSessionWelcomeDismissed(true),
  }), [formatters, language, t, ready, busy, errorKey, preferences, sessionWelcomeDismissed,
    setLanguage, followDevice, completeWelcome, retryPreferences]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(Context);
  if (!context) throw new Error('useI18n must be used inside LanguageProvider.');
  return context;
}

export { detectLanguage };
