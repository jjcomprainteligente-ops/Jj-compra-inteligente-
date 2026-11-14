import { Platform, Share } from 'react-native';
import { listShareByteLength, MAX_LIST_SHARE_BYTES, MAX_LIST_SHARE_CHARACTERS } from '../domain/listSharing';

export type ListShareResult = 'shared' | 'cancelled';
export type ListShareDeliveryErrorKey =
  | 'listSharing.error.unavailable'
  | 'listSharing.error.failed'
  | 'listSharing.error.tooLarge';

export class ListShareDeliveryError extends Error {
  constructor(readonly key: ListShareDeliveryErrorKey) {
    super(key);
    this.name = 'ListShareDeliveryError';
  }
}

const TITLE = 'JJ Compra Inteligente';
const REVOKE_DELAY_MS = 30_000;

export function canShareListText(): boolean {
  return Platform.OS !== 'web' || (typeof isSecureContext !== 'undefined' && isSecureContext &&
    typeof navigator !== 'undefined' && typeof navigator.share === 'function');
}

function isCancellation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === 'AbortError';
}

/** Delivers only reviewed plain text; it never reads storage or chooses a recipient. */
export function createListShareDelivery() {
  const pending = new Map<string, ReturnType<typeof setTimeout>>();
  let disposed = false;
  let sharing = false;
  const assertText = (text: string) => {
    if (disposed || typeof text !== 'string' || !text.trim()) {
      throw new ListShareDeliveryError('listSharing.error.unavailable');
    }
    if (text.length > MAX_LIST_SHARE_CHARACTERS) {
      throw new ListShareDeliveryError('listSharing.error.tooLarge');
    }
    let bytes: number;
    try { bytes = listShareByteLength(text); }
    catch { throw new ListShareDeliveryError('listSharing.error.unavailable'); }
    if (bytes > MAX_LIST_SHARE_BYTES) throw new ListShareDeliveryError('listSharing.error.tooLarge');
  };
  const revoke = (url: string) => {
    const timer = pending.get(url);
    if (timer !== undefined) clearTimeout(timer);
    pending.delete(url);
    try { URL.revokeObjectURL(url); } catch { /* The page may already have closed. */ }
  };

  return {
    async share(text: string): Promise<ListShareResult> {
      assertText(text);
      if (sharing || !canShareListText()) throw new ListShareDeliveryError('listSharing.error.unavailable');
      sharing = true;
      try {
        if (Platform.OS === 'web') {
          // No awaited work precedes this browser call: preserve the initiating gesture.
          await navigator.share({ title: TITLE, text });
          return 'shared';
        }
        const result = await Share.share({ title: TITLE, message: text }, { dialogTitle: TITLE });
        if (result.action === Share.dismissedAction) return 'cancelled';
        if (result.action === Share.sharedAction) return 'shared';
        throw new ListShareDeliveryError('listSharing.error.failed');
      } catch (error) {
        if (isCancellation(error)) return 'cancelled';
        throw new ListShareDeliveryError('listSharing.error.failed');
      } finally { sharing = false; }
    },
    download(text: string): 'download-started' {
      assertText(text);
      if (Platform.OS !== 'web' || sharing || typeof document === 'undefined' || !document.body ||
        typeof Blob === 'undefined' || typeof URL === 'undefined' ||
        typeof URL.createObjectURL !== 'function' || typeof URL.revokeObjectURL !== 'function') {
        throw new ListShareDeliveryError('listSharing.error.unavailable');
      }
      let url: string | undefined;
      let link: HTMLAnchorElement | undefined;
      try {
        url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
        link = document.createElement('a');
        link.href = url;
        link.download = 'jj-shopping-list.txt';
        link.style.display = 'none';
        document.body.appendChild(link);
        const ownedUrl = url;
        pending.set(ownedUrl, setTimeout(() => revoke(ownedUrl), REVOKE_DELAY_MS));
        link.click();
        // The browser controls completion: initiating a download is the only known result.
        return 'download-started';
      } catch {
        if (url) revoke(url);
        throw new ListShareDeliveryError('listSharing.error.failed');
      } finally { link?.remove(); }
    },
    dispose() {
      disposed = true;
      for (const url of [...pending.keys()]) revoke(url);
    },
  };
}
