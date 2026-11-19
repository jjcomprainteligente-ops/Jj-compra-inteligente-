import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const runtime = vi.hoisted(() => ({
  platform: { OS: 'web' },
  share: vi.fn(),
}));
vi.mock('react-native', () => ({
  Platform: runtime.platform,
  Share: { share: runtime.share, sharedAction: 'sharedAction', dismissedAction: 'dismissedAction' },
}));

import { createBackupDelivery } from '../src/app/backupDelivery';
import { privacyMessages } from '../src/i18n/catalogs/privacy';

const backup = { filename: 'jj-local-backup-expenses-2026-11-08T12-30-00-000Z.json', content: '{"format":"jj-local-backup","documents":[]}' };
const controllers: ReturnType<typeof createBackupDelivery>[] = [];
const owner = () => { const value = createBackupDelivery(); controllers.push(value); return value; };

function browser() {
  const link = { href: '', download: '', style: { display: '' }, click: vi.fn(), remove: vi.fn() };
  const appendChild = vi.fn();
  const createObjectURL = vi.fn((_blob: Blob) => 'blob:test-backup');
  const revokeObjectURL = vi.fn();
  vi.stubGlobal('document', { body: { appendChild }, createElement: vi.fn(() => link) });
  vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
  return { link, appendChild, createObjectURL, revokeObjectURL };
}

beforeEach(() => {
  vi.useFakeTimers();
  runtime.platform.OS = 'web';
  runtime.share.mockReset();
});
afterEach(() => {
  for (const value of controllers.splice(0)) value.dispose();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('local backup delivery', () => {
  it('creates no download or share action until the explicit delivery call', () => {
    const page = browser();
    owner();
    expect(page.createObjectURL).not.toHaveBeenCalled();
    expect(page.appendChild).not.toHaveBeenCalled();
    expect(runtime.share).not.toHaveBeenCalled();
  });

  it('downloads the exact JSON Blob locally with a bounded safe filename and releases it later', async () => {
    const page = browser();
    await expect(owner().deliver(backup, 'Copy')).resolves.toBe('download-started');
    expect(page.link.download).toBe(backup.filename);
    expect(page.link.href).toBe('blob:test-backup');
    expect(page.appendChild).toHaveBeenCalledWith(page.link);
    expect(page.link.click).toHaveBeenCalledOnce();
    expect(page.link.remove).toHaveBeenCalledOnce();
    const bytes = page.createObjectURL.mock.calls[0]?.[0] as Blob | undefined;
    expect(bytes?.type).toBe('application/json;charset=utf-8');
    expect(await bytes?.text()).toBe(backup.content);
    expect(page.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(30_000);
    expect(page.revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:test-backup');
  });

  it('releases pending URLs when the screen owner exits and permits a new owner', async () => {
    const page = browser();
    const first = owner();
    await first.deliver(backup, 'Copy');
    first.dispose();
    expect(page.revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:test-backup');
    await expect(first.deliver(backup, 'Copy')).rejects.toMatchObject({ key: 'privacy.error.deliveryUnavailable' });
    await expect(owner().deliver(backup, 'Copy')).resolves.toBe('download-started');
  });

  it.each(['../backup.json', 'https://example.test/backup.json', 'jj-local-backup-2026-11-08.json\n', 'credentials.txt'])('rejects unsafe or non-backup filenames before DOM access: %s', async filename => {
    const page = browser();
    await expect(owner().deliver({ ...backup, filename }, 'Copy')).rejects.toMatchObject({ key: 'privacy.error.deliveryUnavailable' });
    expect(page.createObjectURL).not.toHaveBeenCalled();
    expect(page.appendChild).not.toHaveBeenCalled();
  });

  it('releases the URL and link if a browser refuses the download action', async () => {
    const page = browser();
    page.link.click.mockImplementation(() => { throw new Error('Download blocked'); });
    await expect(owner().deliver(backup, 'Copy')).rejects.toMatchObject({ key: 'privacy.error.deliveryFailed' });
    expect(page.revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:test-backup');
    expect(page.link.remove).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(30_000);
    expect(page.revokeObjectURL).toHaveBeenCalledOnce();
  });

  it('does not fall back to network or clipboard when browser delivery is unavailable', async () => {
    vi.stubGlobal('document', undefined);
    await expect(owner().deliver(backup, 'Copy')).rejects.toMatchObject({ key: 'privacy.error.deliveryUnavailable' });
    expect(runtime.share).not.toHaveBeenCalled();
  });

  it('shares JSON text only after a native action and distinguishes a reported cancellation', async () => {
    runtime.platform.OS = 'ios';
    runtime.share.mockResolvedValue({ action: 'dismissedAction' });
    await expect(owner().deliver(backup, 'Private copy')).resolves.toBe('cancelled');
    expect(runtime.share).toHaveBeenCalledExactlyOnceWith({ title: 'Private copy', message: backup.content }, { dialogTitle: 'Private copy' });
    runtime.share.mockResolvedValue({ action: 'sharedAction' });
    await expect(owner().deliver(backup, 'Private copy')).resolves.toBe('shared');
  });

  it('bounds native message size before invoking a platform share panel', async () => {
    runtime.platform.OS = 'android';
    await expect(owner().deliver({ ...backup, content: 'a'.repeat(1_000_001) }, 'Copy')).rejects.toMatchObject({ key: 'privacy.error.nativeTooLarge' });
    expect(runtime.share).not.toHaveBeenCalled();
  });

  it('does not report success for a native rejection or an unrecognised result', async () => {
    runtime.platform.OS = 'ios';
    runtime.share.mockRejectedValue(new Error('Unavailable'));
    await expect(owner().deliver(backup, 'Copy')).rejects.toMatchObject({ key: 'privacy.error.deliveryFailed' });
    runtime.share.mockResolvedValue({ action: 'unknown' });
    await expect(owner().deliver(backup, 'Copy')).rejects.toMatchObject({ key: 'privacy.error.deliveryFailed' });
  });
});

it('provides matching privacy keys and interpolation fields in all four languages', () => {
  const expected = Object.keys(privacyMessages.es).sort();
  for (const language of ['en', 'de', 'fr'] as const) {
    expect(Object.keys(privacyMessages[language]).sort()).toEqual(expected);
    for (const key of expected) {
      expect(privacyMessages[language][key].match(/\{\w+\}/g)?.sort() ?? [])
        .toEqual(privacyMessages.es[key].match(/\{\w+\}/g)?.sort() ?? []);
    }
  }
});
