import { expect, test, type Page } from '@playwright/test';

type MockMode = 'ready' | 'denied' | 'pending' | 'unsupported';
interface CaptureCounters {
  voiceConstructed: number; voiceStarted: number; voiceAborted: number; voiceLocale: string;
  formatsRead: number; cameraRequested: number; tracksStopped: number; cameraAudio: unknown;
  emitVoice(): void; resolveCamera?: () => void;
}
type MockWindow = Window & { __jjCapture: CaptureCounters };

async function installCaptureMocks(page: Page, mode: MockMode = 'ready') {
  await page.addInitScript(({ mode }) => {
    const state: CaptureCounters = {
      voiceConstructed: 0, voiceStarted: 0, voiceAborted: 0, voiceLocale: '',
      formatsRead: 0, cameraRequested: 0, tracksStopped: 0, cameraAudio: null, emitVoice: () => {},
    };
    (window as unknown as MockWindow).__jjCapture = state;
    class Recognition {
      lang = ''; continuous = false; interimResults = false;
      onresult: ((event: unknown) => void) | null = null;
      onerror: ((event: { error: string }) => void) | null = null;
      onend: (() => void) | null = null;
      onstart: (() => void) | null = null;
      constructor() {
        state.voiceConstructed++;
        state.emitVoice = () => this.onresult?.({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: '1 L leche' } }] });
      }
      start() { state.voiceStarted++; state.voiceLocale = this.lang; if (mode === 'denied') this.onerror?.({ error: 'not-allowed' }); else if (mode !== 'pending') this.onstart?.(); }
      abort() { state.voiceAborted++; }
    }
    class Detector {
      static async getSupportedFormats() { state.formatsRead++; return mode === 'unsupported' ? ['qr_code'] : ['ean_13']; }
      async detect() { return []; }
    }
    Object.defineProperty(window, 'SpeechRecognition', { configurable: true, value: Recognition });
    Object.defineProperty(window, 'BarcodeDetector', { configurable: true, value: Detector });
    const fakeStream = { getTracks: () => [{ stop: () => { state.tracksStopped++; } }] };
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {
      getUserMedia: async (constraints: { audio: unknown }) => {
        state.cameraRequested++; state.cameraAudio = constraints.audio;
        if (mode === 'denied') throw new DOMException('Denied in security test', 'NotAllowedError');
        if (mode === 'pending') return await new Promise(resolve => { state.resolveCamera = () => resolve(fakeStream); });
        return fakeStream;
      },
    } });
    Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', { configurable: true, get() { return null; }, set() {} });
    Object.defineProperty(HTMLMediaElement.prototype, 'readyState', { configurable: true, get() { return 2; } });
    HTMLMediaElement.prototype.play = async () => {};
    HTMLMediaElement.prototype.pause = () => {};
  }, { mode });
}

const counters = (page: Page) => page.evaluate(() => {
  const { emitVoice: _voice, resolveCamera: _camera, ...state } = (window as unknown as MockWindow).__jjCapture;
  return state;
});
const business = (page: Page) => page.evaluate(() => Object.fromEntries([
  'shopping', 'menus', 'comparisons', 'price-observations', 'expenses', 'local-settings',
].map(name => { const key = `jjcompraintelwgiemt.${name}.v1`; return [key, localStorage.getItem(key)]; })));

// Browser APIs are mocked here. These cases verify permission and lifecycle contracts,
// not hardware recognition or a physical iPhone permission dialog.
test('voice requires consent and gesture, preserves transcript, aborts on exit', async ({ page }) => {
  await installCaptureMocks(page);
  await page.goto('/');
  const before = await business(page);
  await page.getByTestId('open-voice').click();
  await expect(page.getByTestId('voice-capture-toggle')).toBeDisabled();
  expect((await counters(page)).voiceConstructed).toBe(0);
  await page.getByTestId('voice-consent').click();
  expect((await counters(page)).voiceStarted).toBe(0);
  await page.getByTestId('voice-capture-toggle').click();
  expect(await counters(page)).toMatchObject({ voiceConstructed: 1, voiceStarted: 1, voiceLocale: 'es-ES' });
  await page.evaluate(() => (window as unknown as MockWindow).__jjCapture.emitVoice());
  await expect(page.getByTestId('voice-transcript')).toHaveValue('1 L leche');
  await page.getByTestId('tab-home').click();
  expect((await counters(page)).voiceAborted).toBe(1);
  await page.getByTestId('open-voice').click();
  await expect(page.getByTestId('voice-transcript')).toHaveValue('1 L leche');
  expect(await business(page)).toEqual(before);
});

test('camera needs consent, requests no audio and stops all tracks when page hides', async ({ page }) => {
  await installCaptureMocks(page);
  await page.goto('/');
  const before = await business(page);
  await page.getByTestId('open-scanner').click();
  await expect(page.getByTestId('scanner-capture-toggle')).toBeDisabled();
  expect(await counters(page)).toMatchObject({ formatsRead: 0, cameraRequested: 0 });
  await page.getByTestId('camera-consent').click();
  expect((await counters(page)).cameraRequested).toBe(0);
  await page.getByTestId('scanner-capture-toggle').click();
  await expect.poll(async () => (await counters(page)).cameraRequested).toBe(1);
  expect((await counters(page)).cameraAudio).toBe(false);
  await expect(page.getByRole('button', { name: 'Detener la cámara', exact: true })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await expect.poll(async () => (await counters(page)).tracksStopped).toBe(1);
  await expect(page.getByRole('button', { name: 'Activar cámara', exact: true })).toBeVisible();
  expect(await business(page)).toEqual(before);
});

test('a camera stream resolving after cancellation is released without reopening capture', async ({ page }) => {
  await installCaptureMocks(page, 'pending');
  await page.goto('/');
  await page.getByTestId('open-scanner').click();
  await page.getByTestId('camera-consent').click();
  await page.getByTestId('scanner-capture-toggle').click();
  await expect.poll(async () => (await counters(page)).cameraRequested).toBe(1);
  await page.getByTestId('tab-home').click();
  await page.evaluate(() => (window as unknown as MockWindow).__jjCapture.resolveCamera?.());
  await expect.poll(async () => (await counters(page)).tracksStopped).toBe(1);
  await expect(page.getByTestId('scanner-screen')).toHaveCount(0);
});

test('unsupported retail decoding never requests a camera and retains manual entry', async ({ page }) => {
  await installCaptureMocks(page, 'unsupported');
  await page.goto('/');
  await page.getByTestId('open-scanner').click();
  await page.getByTestId('camera-consent').click();
  await page.getByTestId('scanner-capture-toggle').click();
  await expect(page.getByTestId('scanner-capture-toggle')).toHaveCount(0);
  expect(await counters(page)).toMatchObject({ formatsRead: 1, cameraRequested: 0 });
  await expect(page.getByTestId('scanner-code')).toBeEditable();
});

test('real camera rejection shows denial without pretending to scan or adding a product', async ({ page }) => {
  await installCaptureMocks(page, 'denied');
  await page.goto('/');
  const before = await business(page);
  await page.getByTestId('open-scanner').click();
  await page.getByTestId('camera-consent').click();
  await page.getByTestId('scanner-capture-toggle').click();
  await expect(page.getByRole('alert')).toContainText('Acceso a la cámara denegado');
  expect(await counters(page)).toMatchObject({ cameraRequested: 1, tracksStopped: 0 });
  expect(await business(page)).toEqual(before);
});


test('voice waits for the browser start event and aborts a pending permission attempt', async ({ page }) => {
  await installCaptureMocks(page, 'pending');
  await page.goto('/');
  await page.getByTestId('open-voice').click();
  await page.getByTestId('voice-consent').click();
  await page.getByTestId('voice-capture-toggle').click();
  await expect(page.getByRole('heading', { name: 'Esperando acceso al micrófono…', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Escuchando…', exact: true })).toHaveCount(0);
  await page.getByTestId('voice-consent').click();
  expect((await counters(page)).voiceAborted).toBe(1);
  await expect(page.getByTestId('voice-capture-toggle')).toBeDisabled();
});

test('voice permission denial preserves manual transcription and performs no business write', async ({ page }) => {
  await installCaptureMocks(page, 'denied');
  await page.goto('/');
  const before = await business(page);
  await page.getByTestId('open-voice').click();
  await page.getByTestId('voice-transcript').fill('Huevos 6 ud');
  await page.getByTestId('voice-consent').click();
  await page.getByTestId('voice-capture-toggle').click();
  await expect(page.getByRole('alert')).toContainText('Acceso al micrófono denegado');
  await expect(page.getByTestId('voice-transcript')).toHaveValue('Huevos 6 ud');
  expect((await counters(page)).voiceAborted).toBe(1);
  expect(await business(page)).toEqual(before);
});
