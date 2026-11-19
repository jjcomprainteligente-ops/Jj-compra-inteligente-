import { Platform, Share } from 'react-native';
import { MAX_PRIVACY_BACKUP_BYTES } from '../domain/dataPrivacy';
import type { LocalBackupFile } from '../domain/dataPrivacy';

export type BackupDeliveryResult = 'download-started' | 'shared' | 'cancelled';

export class BackupDeliveryError extends Error {
  constructor(readonly key: 'privacy.error.deliveryUnavailable' | 'privacy.error.deliveryFailed' | 'privacy.error.nativeTooLarge') {
    super(key);
    this.name = 'BackupDeliveryError';
  }
}

// Sharing a JSON message is intentionally bounded; no filesystem dependency or
// hidden server upload is introduced for native clients.
const MAX_NATIVE_CHARACTERS = 1_000_000;
const MAX_WEB_CHARACTERS = MAX_PRIVACY_BACKUP_BYTES;
const REVOKE_DELAY_MS = 30_000;
const filenamePattern = /^jj-local-backup(?:-[a-z]+)?-\d{4}-\d{2}-\d{2}(?:[T_-][\dZ_.-]+)?\.json$/;

/** A component owns these temporary object URLs and releases them on exit. */
export function createBackupDelivery() {
  const pending = new Map<string, ReturnType<typeof setTimeout>>();
  let disposed = false;
  const revoke = (url: string) => {
    const timer = pending.get(url);
    if (timer !== undefined) clearTimeout(timer);
    pending.delete(url);
    try { URL.revokeObjectURL(url); } catch { /* The context may already have closed. */ }
  };

  return {
    async deliver(backup: LocalBackupFile, title: string): Promise<BackupDeliveryResult> {
      if (disposed || typeof backup?.filename !== 'string' || !filenamePattern.test(backup.filename) ||
          typeof backup.content !== 'string' || !backup.content.length || backup.content.length > MAX_WEB_CHARACTERS) {
        throw new BackupDeliveryError('privacy.error.deliveryUnavailable');
      }
      if (Platform.OS !== 'web') {
        if (backup.content.length > MAX_NATIVE_CHARACTERS) throw new BackupDeliveryError('privacy.error.nativeTooLarge');
        try {
          const result = await Share.share({ title, message: backup.content }, { dialogTitle: title });
          if (result.action === Share.dismissedAction) return 'cancelled';
          if (result.action === Share.sharedAction) return 'shared';
          throw new BackupDeliveryError('privacy.error.deliveryFailed');
        } catch { throw new BackupDeliveryError('privacy.error.deliveryFailed'); }
      }

      if (typeof document === 'undefined' || !document.body || typeof Blob === 'undefined' ||
          typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function' || typeof URL.revokeObjectURL !== 'function') {
        throw new BackupDeliveryError('privacy.error.deliveryUnavailable');
      }
      let url: string | undefined;
      let link: HTMLAnchorElement | undefined;
      try {
        url = URL.createObjectURL(new Blob([backup.content], { type: 'application/json;charset=utf-8' }));
        link = document.createElement('a');
        link.href = url;
        link.download = backup.filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        const ownedUrl = url;
        pending.set(ownedUrl, setTimeout(() => revoke(ownedUrl), REVOKE_DELAY_MS));
        link.click();
        // The browser controls completion and cancellation, so report only that
        // the download was initiated rather than claiming that a file was saved.
        return 'download-started';
      } catch {
        if (url) revoke(url);
        throw new BackupDeliveryError('privacy.error.deliveryFailed');
      } finally { link?.remove(); }
    },
    dispose() {
      disposed = true;
      for (const url of [...pending.keys()]) revoke(url);
    },
  };
}
