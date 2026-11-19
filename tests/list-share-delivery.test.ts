import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const runtime = vi.hoisted(() => ({ platform: { OS: 'web' }, nativeShare: vi.fn() }));
vi.mock('react-native', () => ({
  Platform: runtime.platform,
  Share: { share: runtime.nativeShare, sharedAction: 'sharedAction', dismissedAction: 'dismissedAction' },
}));

import { canShareListText, createListShareDelivery } from '../src/app/listShareDelivery';
import { MAX_LIST_SHARE_BYTES, MAX_LIST_SHARE_CHARACTERS } from '../src/domain/listSharing';

const reviewedText = 'JJ Compra Inteligente\nLista — été / Grüße / café\n• 1,25 kg Tomates';
const controllers: ReturnType<typeof createListShareDelivery>[] = [];
const owner = () => { const controller = createListShareDelivery(); controllers.push(controller); return controller; };

function browser() {
  const share = vi.fn().mockResolvedValue(undefined);
  const link = { href: '', download: '', style: { display: '' }, click: vi.fn(), remove: vi.fn() };
  const appendChild = vi.fn();
  const createObjectURL = vi.fn((_blob: Blob) => 'blob:list-share');
  const revokeObjectURL = vi.fn();
  const clipboard = vi.fn();
  const request = vi.fn();
  vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal('navigator', { share, clipboard: { writeText: clipboard } });
  vi.stubGlobal('document', { body: { appendChild }, createElement: vi.fn(() => link) });
  vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
  vi.stubGlobal('fetch', request);
  return { share, link, appendChild, createObjectURL, revokeObjectURL, clipboard, request };
}

beforeEach(() => {
  vi.useFakeTimers();
  runtime.platform.OS = 'web';
  runtime.nativeShare.mockReset();
});
afterEach(() => {
  for (const controller of controllers.splice(0)) controller.dispose();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('reviewed shopping-list text delivery', () => {
  it('opening a controller detects support without sharing, downloading, copying or requesting anything', () => {
    const page = browser();
    owner();
    expect(canShareListText()).toBe(true);
    for (const operation of [page.share, page.createObjectURL, page.appendChild, page.clipboard, page.request, runtime.nativeShare]) {
      expect(operation).not.toHaveBeenCalled();
    }
  });

  it('calls Web Share synchronously with exactly the reviewed text and fixed brand title', async () => {
    const page = browser();
    const result = owner().share(reviewedText);
    // This assertion precedes awaiting the promise: the original user gesture
    // must reach Web Share without another asynchronous operation first.
    expect(page.share).toHaveBeenCalledExactlyOnceWith({ title: 'JJ Compra Inteligente', text: reviewedText });
    await expect(result).resolves.toBe('shared');
    expect(page.createObjectURL).not.toHaveBeenCalled();
    expect(page.clipboard).not.toHaveBeenCalled();
    expect(page.request).not.toHaveBeenCalled();
  });

  it('treats browser cancellation as cancellation and does not start a fallback download', async () => {
    const page = browser();
    page.share.mockRejectedValue({ name: 'AbortError' });
    await expect(owner().share(reviewedText)).resolves.toBe('cancelled');
    expect(page.createObjectURL).not.toHaveBeenCalled();
    expect(page.appendChild).not.toHaveBeenCalled();
    expect(page.clipboard).not.toHaveBeenCalled();
  });

  it('reports a failed browser action without sending by a different path', async () => {
    const page = browser();
    page.share.mockRejectedValue(new Error('Permission denied'));
    await expect(owner().share(reviewedText)).rejects.toMatchObject({ key: 'listSharing.error.failed' });
    expect(page.createObjectURL).not.toHaveBeenCalled();
    expect(runtime.nativeShare).not.toHaveBeenCalled();
    expect(page.clipboard).not.toHaveBeenCalled();
    expect(page.request).not.toHaveBeenCalled();
  });

  it.each(['insecure', 'missing-share', 'missing-navigator'])('rejects unavailable Web Share before releasing any text: %s', async condition => {
    const page = browser();
    if (condition === 'insecure') vi.stubGlobal('isSecureContext', false);
    else vi.stubGlobal('navigator', condition === 'missing-navigator' ? undefined : {});
    expect(canShareListText()).toBe(false);
    await expect(owner().share(reviewedText)).rejects.toMatchObject({ key: 'listSharing.error.unavailable' });
    expect(page.share).not.toHaveBeenCalled();
    expect(page.createObjectURL).not.toHaveBeenCalled();
  });

  it('blocks another outbound action while a sharing panel is pending and permits a later explicit action', async () => {
    const page = browser();
    let resolve!: () => void;
    page.share.mockReturnValue(new Promise<void>(done => { resolve = done; }));
    const controller = owner();
    const pending = controller.share(reviewedText);
    await expect(controller.share(reviewedText)).rejects.toMatchObject({ key: 'listSharing.error.unavailable' });
    expect(() => controller.download(reviewedText)).toThrow('listSharing.error.unavailable');
    expect(page.share).toHaveBeenCalledOnce();
    expect(page.createObjectURL).not.toHaveBeenCalled();
    resolve();
    await expect(pending).resolves.toBe('shared');
    page.share.mockResolvedValue(undefined);
    await expect(controller.share(reviewedText)).resolves.toBe('shared');
  });

  it('downloads only after an explicit call, as an exact UTF-8 plain-text Blob with a fixed safe filename', async () => {
    const page = browser();
    vi.stubGlobal('isSecureContext', false);
    expect(owner().download(reviewedText)).toBe('download-started');
    expect(page.link.download).toBe('jj-shopping-list.txt');
    expect(page.link.href).toBe('blob:list-share');
    expect(page.appendChild).toHaveBeenCalledExactlyOnceWith(page.link);
    expect(page.link.click).toHaveBeenCalledOnce();
    expect(page.link.remove).toHaveBeenCalledOnce();
    const blob = page.createObjectURL.mock.calls[0]?.[0];
    expect(blob?.type).toBe('text/plain;charset=utf-8');
    expect(await blob?.text()).toBe(reviewedText);
    expect(page.share).not.toHaveBeenCalled();
    expect(page.clipboard).not.toHaveBeenCalled();
    expect(page.request).not.toHaveBeenCalled();
    expect(page.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(30_000);
    expect(page.revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:list-share');
  });

  it('cleans pending object URLs on owner exit and rejects future actions from the disposed owner', async () => {
    const page = browser();
    const controller = owner();
    controller.download(reviewedText);
    controller.dispose();
    expect(page.revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:list-share');
    expect(() => controller.download(reviewedText)).toThrow('listSharing.error.unavailable');
    await expect(controller.share(reviewedText)).rejects.toMatchObject({ key: 'listSharing.error.unavailable' });
    vi.advanceTimersByTime(30_000);
    expect(page.revokeObjectURL).toHaveBeenCalledOnce();
    expect(page.share).not.toHaveBeenCalled();
  });

  it('releases the URL and removes its link when the browser refuses a download', () => {
    const page = browser();
    page.link.click.mockImplementation(() => { throw new Error('Blocked download'); });
    expect(() => owner().download(reviewedText)).toThrow('listSharing.error.failed');
    expect(page.revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:list-share');
    expect(page.link.remove).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(30_000);
    expect(page.revokeObjectURL).toHaveBeenCalledOnce();
  });

  it('keeps manual review available when the browser has no download mechanism', () => {
    const page = browser();
    vi.stubGlobal('document', undefined);
    expect(() => owner().download(reviewedText)).toThrow('listSharing.error.unavailable');
    expect(page.share).not.toHaveBeenCalled();
    expect(page.createObjectURL).not.toHaveBeenCalled();
  });

  it.each(['', '   ', '\ud800', undefined, 123])('rejects invalid plain text before any browser action', async value => {
    const page = browser();
    const controller = owner();
    const text = value as string;
    await expect(controller.share(text)).rejects.toMatchObject({ key: 'listSharing.error.unavailable' });
    expect(() => controller.download(text)).toThrow('listSharing.error.unavailable');
    expect(page.share).not.toHaveBeenCalled();
    expect(page.createObjectURL).not.toHaveBeenCalled();
  });

  it.each([
    'x'.repeat(MAX_LIST_SHARE_CHARACTERS + 1),
    '購'.repeat(Math.floor(MAX_LIST_SHARE_BYTES / 3) + 1),
  ])('bounds both character count and encoded byte size before delivery', async text => {
    const page = browser();
    const controller = owner();
    await expect(controller.share(text)).rejects.toMatchObject({ key: 'listSharing.error.tooLarge' });
    expect(() => controller.download(text)).toThrow('listSharing.error.tooLarge');
    expect(page.share).not.toHaveBeenCalled();
    expect(page.createObjectURL).not.toHaveBeenCalled();
  });

  it('accepts the exact character boundary without truncating the reviewed message', async () => {
    const page = browser();
    const text = 'x'.repeat(MAX_LIST_SHARE_CHARACTERS);
    await expect(owner().share(text)).resolves.toBe('shared');
    expect(page.share).toHaveBeenCalledWith({ title: 'JJ Compra Inteligente', text });
  });

  it.each(['ios', 'android'])('uses the native share panel with plain text and recognises reported dismissal on %s', async platform => {
    browser();
    runtime.platform.OS = platform;
    runtime.nativeShare.mockResolvedValue({ action: 'dismissedAction' });
    expect(canShareListText()).toBe(true);
    await expect(owner().share(reviewedText)).resolves.toBe('cancelled');
    expect(runtime.nativeShare).toHaveBeenCalledExactlyOnceWith(
      { title: 'JJ Compra Inteligente', message: reviewedText }, { dialogTitle: 'JJ Compra Inteligente' },
    );
    runtime.nativeShare.mockResolvedValue({ action: 'sharedAction' });
    await expect(owner().share(reviewedText)).resolves.toBe('shared');
  });

  it('does not claim a native success for an unknown result or rejection', async () => {
    const page = browser();
    runtime.platform.OS = 'ios';
    runtime.nativeShare.mockResolvedValue({ action: 'unknown' });
    await expect(owner().share(reviewedText)).rejects.toMatchObject({ key: 'listSharing.error.failed' });
    runtime.nativeShare.mockRejectedValue(new Error('Not available'));
    await expect(owner().share(reviewedText)).rejects.toMatchObject({ key: 'listSharing.error.failed' });
    expect(page.share).not.toHaveBeenCalled();
    expect(page.createObjectURL).not.toHaveBeenCalled();
  });

  it('offers no silent native text-file export through the browser path', () => {
    const page = browser();
    runtime.platform.OS = 'android';
    expect(() => owner().download(reviewedText)).toThrow('listSharing.error.unavailable');
    expect(page.createObjectURL).not.toHaveBeenCalled();
    expect(runtime.nativeShare).not.toHaveBeenCalled();
  });
});
