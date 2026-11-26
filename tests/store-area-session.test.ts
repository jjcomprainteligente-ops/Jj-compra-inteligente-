import { describe, expect, it, vi } from 'vitest';
import { createStoreAreaSession } from '../src/domain/storeAreaSession';
import type { DeviceLocationResult } from '../src/services/deviceLocation';

const POINT = Object.freeze({ latitude: 28.24, longitude: -16.84 });
const NOW = Date.parse('2026-11-26T12:00:00Z');
const SUCCESS: DeviceLocationResult = Object.freeze({ status: 'ok', point: POINT, accuracyMeters: 25, capturedAt: NOW });
function harness() {
  const requests: { cancelled: () => boolean; resolve: (result: DeviceLocationResult) => void;
    reject: (error: unknown) => void }[] = [];
  const requestLocation = vi.fn((cancelled: () => boolean) => new Promise<DeviceLocationResult>((resolve, reject) => {
    requests.push({ cancelled, resolve, reject });
  }));
  const resolvePostalReference = vi.fn((id: string) => id === 'reviewed-postal' ? POINT : null);
  const session = createStoreAreaSession({ requestLocation, resolvePostalReference });
  return { session, requests, requestLocation, resolvePostalReference };
}
async function settle() { await Promise.resolve(); await Promise.resolve(); }

describe('independent session-only store area', () => {
  it('starts empty without location work, with a cached immutable snapshot', () => {
    const { session, requestLocation } = harness();
    const snapshot = session.getSnapshot();
    expect(snapshot).toEqual({ area: null, gpsBusy: false, gpsError: null });
    expect(session.getSnapshot()).toBe(snapshot);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(requestLocation).not.toHaveBeenCalled();
  });

  it('accepts only a resolved postal reference and a bounded radius, without fallback', () => {
    const { session, requestLocation } = harness();
    expect(session.applyPostal('missing', 10)).toBe(false);
    expect(session.applyPostal('reviewed-postal', 0)).toBe(false);
    expect(session.applyPostal('reviewed-postal', 101)).toBe(false);
    expect(session.getSnapshot().area).toBeNull();
    expect(session.applyPostal('reviewed-postal', 10)).toBe(true);
    expect(session.getSnapshot()).toEqual({ area: { kind: 'postal', referenceId: 'reviewed-postal', radiusKm: 10 },
      gpsBusy: false, gpsError: null });
    expect(Object.isFrozen(session.getSnapshot().area)).toBe(true);
    expect(requestLocation).not.toHaveBeenCalled();
  });

  it('rejects a failed or outside-scope postal resolver without throwing', () => {
    const unavailable = createStoreAreaSession({ resolvePostalReference: () => { throw new Error('Unavailable.'); },
      requestLocation: async () => SUCCESS });
    expect(unavailable.applyPostal('reviewed-postal', 10)).toBe(false);
    const outside = createStoreAreaSession({ resolvePostalReference: () => ({ latitude: 0, longitude: 0 }),
      requestLocation: async () => SUCCESS });
    expect(outside.applyPostal('reviewed-postal', 10)).toBe(false);
  });

  it('publishes one fix and keeps it frozen until explicit clear', async () => {
    const { session, requests } = harness();
    session.requestDevice('sheet-a', 20);
    expect(session.getSnapshot()).toEqual({ area: null, gpsBusy: true, gpsError: null });
    requests[0].resolve(SUCCESS); await settle();
    const { area } = session.getSnapshot();
    expect(area).toEqual({ kind: 'device', point: POINT, radiusKm: 20, accuracyMeters: 25, capturedAt: NOW });
    expect(Object.isFrozen(area)).toBe(true);
    expect(area?.kind === 'device' && Object.isFrozen(area.point)).toBe(true);
    session.cancelDevice('sheet-a');
    expect(session.getSnapshot().area).toBe(area);
    session.clear();
    expect(session.getSnapshot()).toEqual({ area: null, gpsBusy: false, gpsError: null });
  });

  it('keeps an applied area after coded request failure and raw rejection', async () => {
    const { session, requests } = harness();
    session.applyPostal('reviewed-postal', 10);
    const area = session.getSnapshot().area;
    session.requestDevice('sheet-a', 5);
    requests[0].resolve({ status: 'denied' }); await settle();
    expect(session.getSnapshot()).toEqual({ area, gpsBusy: false, gpsError: 'denied' });
    session.requestDevice('sheet-a', 5);
    requests[1].reject(new Error('Private raw native message.')); await settle();
    expect(session.getSnapshot()).toEqual({ area, gpsBusy: false, gpsError: 'unavailable' });
  });

  it('manual postal apply invalidates pending GPS before reading its result', async () => {
    const { session, requests } = harness();
    session.requestDevice('sheet-a', 20);
    expect(session.applyPostal('reviewed-postal', 5)).toBe(true);
    const snapshot = session.getSnapshot(), read = vi.fn();
    expect(requests[0].cancelled()).toBe(true);
    requests[0].resolve({ get status() { return read(); } } as unknown as DeviceLocationResult);
    await settle();
    expect(read).not.toHaveBeenCalled();
    expect(session.getSnapshot()).toBe(snapshot);
  });

  it('clear invalidates pending work and prevents a late callback restoring GPS', async () => {
    const { session, requests } = harness();
    session.requestDevice('sheet-a', 20);
    session.clear();
    expect(requests[0].cancelled()).toBe(true);
    requests[0].resolve(SUCCESS); await settle();
    expect(session.getSnapshot()).toEqual({ area: null, gpsBusy: false, gpsError: null });
  });

  it('new requests replace old requests even if old callbacks finish first', async () => {
    const { session, requests } = harness();
    session.requestDevice('sheet-a', 5);
    session.requestDevice('sheet-b', 20);
    expect(requests[0].cancelled()).toBe(true);
    expect(requests[1].cancelled()).toBe(false);
    requests[0].resolve(SUCCESS); await settle();
    expect(session.getSnapshot()).toEqual({ area: null, gpsBusy: true, gpsError: null });
    requests[1].resolve(SUCCESS); await settle();
    expect(session.getSnapshot().area?.radiusKm).toBe(20);
  });

  it('an old sheet cleanup cannot cancel a request owned by a newer sheet', async () => {
    const { session, requests } = harness();
    session.requestDevice('sheet-a', 5);
    session.requestDevice('sheet-b', 10);
    const waiting = session.getSnapshot();
    session.cancelDevice('sheet-a');
    expect(session.getSnapshot()).toBe(waiting);
    expect(requests[1].cancelled()).toBe(false);
    requests[1].resolve(SUCCESS); await settle();
    expect(session.getSnapshot().area?.kind).toBe('device');
  });

  it('owner cancellation immediately stops busy state while retaining an applied area', async () => {
    const { session, requests } = harness();
    session.applyPostal('reviewed-postal', 10);
    const area = session.getSnapshot().area;
    session.requestDevice('sheet-a', 5);
    session.cancelDevice('sheet-a');
    expect(session.getSnapshot()).toEqual({ area, gpsBusy: false, gpsError: 'cancelled' });
    requests[0].resolve(SUCCESS); await settle();
    expect(session.getSnapshot()).toEqual({ area, gpsBusy: false, gpsError: 'cancelled' });
  });

  it('provider cleanup cancellation stays reusable for StrictMode effect setup', async () => {
    const { session, requests } = harness();
    session.requestDevice('sheet-a', 5);
    session.clear();
    session.requestDevice('sheet-b', 10);
    requests[0].resolve(SUCCESS); requests[1].resolve(SUCCESS); await settle();
    expect(session.getSnapshot().area?.radiusKm).toBe(10);
    expect(session.getSnapshot().gpsError).toBeNull();
  });

  it('changes a device radius without asking for another fix or altering captured data', async () => {
    const { session, requests, requestLocation } = harness();
    session.requestDevice('sheet-a', 5); requests[0].resolve(SUCCESS); await settle();
    const previous = session.getSnapshot().area;
    expect(session.updateRadius(20)).toBe(true);
    const area = session.getSnapshot().area;
    expect(area).toEqual({ ...previous, radiusKm: 20 });
    expect(area?.kind === 'device' && previous?.kind === 'device' && area.point === previous.point).toBe(true);
    expect(requestLocation).toHaveBeenCalledTimes(1);
  });

  it('radius changes invalidate pending requests and reject missing areas or invalid radius', async () => {
    const { session, requests } = harness();
    expect(session.updateRadius(10)).toBe(false);
    session.applyPostal('reviewed-postal', 5);
    session.requestDevice('sheet-a', 10);
    expect(session.updateRadius(20)).toBe(true);
    expect(requests[0].cancelled()).toBe(true);
    requests[0].resolve(SUCCESS); await settle();
    expect(session.getSnapshot().area).toEqual({ kind: 'postal', referenceId: 'reviewed-postal', radiusKm: 20 });
    expect(session.updateRadius(1.5)).toBe(false);
    expect(session.getSnapshot().area?.radiusKm).toBe(20);
  });

  it('rejects invalid device requests before reaching the service', () => {
    const { session, requestLocation } = harness();
    session.requestDevice('sheet-a', 101);
    expect(session.getSnapshot().gpsError).toBe('invalid');
    session.requestDevice('', 10);
    expect(requestLocation).not.toHaveBeenCalled();
  });

  it('notifies subscribers only for new snapshots and allows safe unsubscribe', () => {
    const { session } = harness();
    const listener = vi.fn(), unsubscribe = session.subscribe(listener);
    session.clear(); expect(listener).not.toHaveBeenCalled();
    session.applyPostal('reviewed-postal', 10); expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe(); unsubscribe(); session.clear(); expect(listener).toHaveBeenCalledTimes(1);
  });

  it('keeps provider instances isolated and resets on a new provider session', () => {
    const first = harness().session, second = harness().session;
    first.applyPostal('reviewed-postal', 20);
    expect(second.getSnapshot()).toEqual({ area: null, gpsBusy: false, gpsError: null });
    expect(harness().session.getSnapshot().area).toBeNull();
  });
});
