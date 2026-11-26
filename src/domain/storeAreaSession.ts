import { isSupportedTenerifePoint, parseStoreRadiusKm, type GeoPoint } from './storeGeography';
import type { DeviceLocationRequester, DeviceLocationStatus } from '../services/deviceLocation';

export type StoreArea = {
  readonly kind: 'postal';
  readonly referenceId: string;
  readonly radiusKm: number;
} | {
  readonly kind: 'device';
  readonly point: GeoPoint;
  readonly accuracyMeters: number;
  readonly capturedAt: number;
  readonly radiusKm: number;
};

export interface StoreAreaSessionSnapshot {
  readonly area: StoreArea | null;
  readonly gpsBusy: boolean;
  readonly gpsError: DeviceLocationStatus | null;
}

export interface StoreAreaSession {
  getSnapshot(): StoreAreaSessionSnapshot;
  subscribe(listener: () => void): () => void;
  applyPostal(referenceId: string, radiusKm: number): boolean;
  updateRadius(radiusKm: number): boolean;
  requestDevice(ownerId: string, radiusKm: number): void;
  cancelDevice(ownerId?: string): void;
  clear(): void;
}

/** A provider owns one instance. There is no storage, URL, server or singleton. */
export function createStoreAreaSession(options: {
  readonly resolvePostalReference: (referenceId: string) => GeoPoint | null;
  readonly requestLocation: DeviceLocationRequester;
}): StoreAreaSession {
  let snapshot: StoreAreaSessionSnapshot = Object.freeze({ area: null, gpsBusy: false, gpsError: null });
  const listeners = new Set<() => void>();
  let revision = 0;
  let pending: { readonly revision: number; readonly ownerId: string } | null = null;

  const publish = (area: StoreArea | null, gpsBusy = false, gpsError: DeviceLocationStatus | null = null) => {
    if (snapshot.area === area && snapshot.gpsBusy === gpsBusy && snapshot.gpsError === gpsError) return;
    snapshot = Object.freeze({ area, gpsBusy, gpsError });
    for (const listener of listeners) listener();
  };
  const invalidate = () => { ++revision; pending = null; };
  const current = (requestRevision: number) => pending?.revision === requestRevision;

  return {
    getSnapshot: () => snapshot,
    subscribe: listener => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    applyPostal: (referenceId, radiusKm) => {
      invalidate();
      const radius = parseStoreRadiusKm(radiusKm);
      let point: GeoPoint | null = null;
      try {
        if (typeof referenceId === 'string' && referenceId.length > 0 && referenceId.length <= 80) {
          point = options.resolvePostalReference(referenceId);
        }
      } catch { /* A failed catalogue lookup cannot install a fallback area. */ }
      if (radius === null || !isSupportedTenerifePoint(point)) { publish(snapshot.area); return false; }
      publish(Object.freeze({ kind: 'postal', referenceId, radiusKm: radius }));
      return true;
    },
    updateRadius: radiusKm => {
      invalidate();
      const radius = parseStoreRadiusKm(radiusKm);
      if (radius === null || snapshot.area === null) { publish(snapshot.area); return false; }
      publish(Object.freeze({ ...snapshot.area, radiusKm: radius }));
      return true;
    },
    requestDevice: (ownerId, radiusKm) => {
      invalidate();
      const radius = parseStoreRadiusKm(radiusKm);
      if (radius === null || typeof ownerId !== 'string' || ownerId.length === 0 || ownerId.length > 200) {
        publish(snapshot.area, false, 'invalid'); return;
      }
      const requestRevision = revision;
      pending = { revision: requestRevision, ownerId };
      publish(snapshot.area, true);
      void (async () => {
        try {
          const result = await options.requestLocation(() => !current(requestRevision));
          // A superseded result is ignored before any field is read.
          if (!current(requestRevision)) return;
          if (result.status !== 'ok') {
            const status = result.status;
            pending = null; publish(snapshot.area, false, status); return;
          }
          const area = Object.freeze({ kind: 'device' as const, point: Object.freeze({ ...result.point }),
            accuracyMeters: result.accuracyMeters, capturedAt: result.capturedAt, radiusKm: radius });
          pending = null; publish(area);
        } catch {
          if (!current(requestRevision)) return;
          pending = null;
          publish(snapshot.area, false, 'unavailable');
        }
      })();
    },
    cancelDevice: ownerId => {
      if (pending === null || ownerId !== undefined && ownerId !== pending.ownerId) return;
      invalidate();
      publish(snapshot.area, false, 'cancelled');
    },
    clear: () => { invalidate(); publish(null); },
  };
}
