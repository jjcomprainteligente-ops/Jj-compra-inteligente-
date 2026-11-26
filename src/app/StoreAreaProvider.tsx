import React, { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import { postalReferenceCatalog } from '../data/postalReferences';
import { postalReferenceById, validatePostalReferenceCatalog } from '../domain/postalReferences';
import { createStoreAreaSession, type StoreArea, type StoreAreaSession, type StoreAreaSessionSnapshot } from '../domain/storeAreaSession';
import type { GeoPoint } from '../domain/storeGeography';
import { createDeviceLocationRequester } from '../services/deviceLocation';

const Context = createContext<StoreAreaSession | null>(null);

function postalPoint(referenceId: string): GeoPoint | null {
  if (!validatePostalReferenceCatalog(postalReferenceCatalog)) return null;
  const reference = postalReferenceById(postalReferenceCatalog, referenceId);
  return reference ? Object.freeze({ latitude: reference.latitude, longitude: reference.longitude }) : null;
}

/** Postal coordinates always come from the validated static catalogue. */
export function getStoreAreaPoint(area: StoreArea | null): GeoPoint | null {
  return area === null ? null : area.kind === 'device' ? area.point : postalPoint(area.referenceId);
}

export function StoreAreaProvider({ children }: { children: React.ReactNode }) {
  const session = useMemo(() => createStoreAreaSession({ resolvePostalReference: postalPoint,
    requestLocation: createDeviceLocationRequester(Platform.OS === 'web' ? 'web' : 'native') }), []);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      // Native permission dialogs may briefly be inactive; only backgrounding
      // cancels pending work. An already applied area lasts for this session.
      if (state === 'background') session.cancelDevice();
    });
    return () => { subscription.remove(); session.clear(); };
  }, [session]);
  return <Context.Provider value={session}>{children}</Context.Provider>;
}

export interface StoreAreaContextValue extends StoreAreaSessionSnapshot {
  applyPostal: StoreAreaSession['applyPostal'];
  updateRadius: StoreAreaSession['updateRadius'];
  requestDevice: StoreAreaSession['requestDevice'];
  cancelDevice: StoreAreaSession['cancelDevice'];
  clear: StoreAreaSession['clear'];
}

export function useStoreArea(): StoreAreaContextValue {
  const session = useContext(Context);
  if (!session) throw new Error('useStoreArea must be used inside StoreAreaProvider.');
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  return useMemo(() => ({ ...snapshot, applyPostal: session.applyPostal, updateRadius: session.updateRadius,
    requestDevice: session.requestDevice, cancelDevice: session.cancelDevice, clear: session.clear }), [snapshot, session]);
}

export type { StoreArea };
