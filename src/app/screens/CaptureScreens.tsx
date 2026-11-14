import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowLeft, Barcode, Check, Mic, Pencil, ScanLine, Square } from 'lucide-react-native';
import { useI18n } from '../../i18n/LanguageProvider';
import { appendCaptureText, boundCaptureText, isValidRetailBarcode, MAX_CAPTURE_TEXT_LENGTH,
  stopCaptureStream, supportedRetailBarcodeFormats } from '../captureCapabilities';
import { Button, Card, Field, Notice, Title, c, f, ui } from '../components/ui';

interface RecognitionResult { isFinal: boolean; 0: { transcript: string } }
interface RecognitionEvent { resultIndex: number; results: { length: number; [index: number]: RecognitionResult } }
interface BrowserRecognition {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void; abort(): void;
}
interface BrowserBarcodeDetector { detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]> }
interface BarcodeConstructor {
  new(options: { formats: string[] }): BrowserBarcodeDetector;
  getSupportedFormats(): Promise<string[]>;
}
type CaptureWindow = Window & {
  SpeechRecognition?: new() => BrowserRecognition;
  webkitSpeechRecognition?: new() => BrowserRecognition;
  BarcodeDetector?: BarcodeConstructor;
};

function captureWindow(): CaptureWindow | null {
  return Platform.OS === 'web' && typeof window !== 'undefined' ? window as CaptureWindow : null;
}

function Consent({ checked, onChange, label, disabled, testID }: {
  checked: boolean; onChange: (checked: boolean) => void; label: string; disabled?: boolean; testID: string;
}) {
  return <Pressable testID={testID} accessibilityRole="checkbox" accessibilityLabel={label}
    accessibilityState={{ checked, disabled: !!disabled }} disabled={disabled} onPress={() => onChange(!checked)} style={styles.consent}>
    <View style={[styles.checkbox, checked && styles.checked]}>{checked && <Check size={17} color="#fff" />}</View>
    <Text style={[ui.note, styles.flex]}>{label}</Text>
  </Pressable>;
}

export function VoiceScreen({ busy, draft, onDraftChange, onReview, onBack }: {
  busy: boolean; draft: string; onDraftChange: (value: string) => void;
  onReview: (text: string) => void; onBack: () => void;
}) {
  const { t, locale, formatNumber } = useI18n();
  const browser = captureWindow();
  const Recognition = browser?.SpeechRecognition ?? browser?.webkitSpeechRecognition;
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'starting' | 'listening' | 'denied' | 'error' | 'noSpeech'>('idle');
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<BrowserRecognition | null>(null);
  const mountedRef = useRef(false);
  const generationRef = useRef(0);
  const draftRef = useRef(draft);
  const onDraftRef = useRef(onDraftChange);
  draftRef.current = draft;
  onDraftRef.current = onDraftChange;

  const releaseRecognition = () => {
    generationRef.current++;
    const instance = recognitionRef.current;
    recognitionRef.current = null;
    if (instance) {
      instance.onresult = null; instance.onerror = null; instance.onend = null; instance.onstart = null;
      try { instance.abort(); } catch { /* An already ended session has no resources left. */ }
    }
  };
  const stop = () => { releaseRecognition(); setInterim(''); setStatus('idle'); };

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; releaseRecognition(); };
  }, []);
  useEffect(() => { if (busy) stop(); }, [busy]);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const hide = () => { if (document.visibilityState === 'hidden') stop(); };
    const leavePage = () => stop();
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', leavePage);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('pagehide', leavePage);
    };
  }, []);
  useEffect(() => { stop(); }, [locale]);

  const start = () => {
    if (!Recognition || !consent || busy || recognitionRef.current || draftRef.current.length >= MAX_CAPTURE_TEXT_LENGTH) return;
    const generation = ++generationRef.current;
    let instance: BrowserRecognition;
    try { instance = new Recognition(); } catch { setStatus('error'); return; }
    recognitionRef.current = instance;
    instance.lang = locale; instance.continuous = true; instance.interimResults = true;
    const active = () => mountedRef.current && generationRef.current === generation && recognitionRef.current === instance;
    instance.onstart = () => { if (active()) setStatus('listening'); };
    instance.onresult = event => {
      if (!active()) return;
      let next = draftRef.current;
      let preview = '';
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index];
        if (result.isFinal) next = appendCaptureText(next, result[0].transcript);
        else preview = appendCaptureText(preview, result[0].transcript);
      }
      if (next !== draftRef.current) { draftRef.current = next; onDraftRef.current(next); }
      setInterim(preview);
      if (next.length >= MAX_CAPTURE_TEXT_LENGTH) stop();
    };
    instance.onerror = event => {
      if (!active()) return;
      releaseRecognition(); setInterim('');
      setStatus(event.error === 'not-allowed' ? 'denied' : event.error === 'no-speech' ? 'noSpeech' : 'error');
    };
    instance.onend = () => {
      if (!active()) return;
      releaseRecognition(); setInterim(''); setStatus('idle');
    };
    try { setStatus('starting'); instance.start(); } catch { releaseRecognition(); setStatus('error'); }
  };
  const capturing = status === 'starting' || status === 'listening';
  const leave = () => { stop(); onBack(); };
  const review = () => { stop(); const text = boundCaptureText(draftRef.current).trim(); if (text && !busy) onReview(text); };

  return <View style={ui.page} testID="voice-screen">
    <Title kicker="" title={t('entry.voiceTitle')} subtitle={t('entry.voiceSubtitle')} />
    <Card style={styles.capturePanel}><View style={styles.captureIcon}><Mic size={31} color={c.primary} /></View>
      <Text accessibilityRole="header" style={styles.panelTitle}>{t(status === 'starting' ? 'entry.microphoneStarting' : status === 'listening' ? 'entry.listening' : 'entry.voiceReady')}</Text>
      <Text style={ui.note}>{t(capturing ? 'entry.voiceStopHint' : 'entry.voiceReadyHint')}</Text>
      {!!interim && <Text style={ui.body} accessibilityLiveRegion="polite">{interim}</Text>}
    </Card>
    {!Recognition && <Notice title={t('entry.voiceUnavailable')} text={t('entry.voiceUnavailableBody')} />}
    {status === 'denied' && <Notice kind="error" title={t('entry.microphoneDenied')}
      text={t('entry.microphoneDeniedBody')} />}
    {(status === 'error' || status === 'noSpeech') && <Notice kind="error"
      title={t(status === 'noSpeech' ? 'entry.noSpeechTitle' : 'entry.voiceError')}
      text={t('entry.voiceErrorBody')} />}
    {!!Recognition && <>
      <Consent checked={consent} disabled={busy} testID="voice-consent" label={t('entry.voiceConsent')}
        onChange={value => { if (!value) stop(); setConsent(value); }} />
      <Button secondary icon={capturing ? Square : Mic}
        label={t(capturing ? 'entry.stopVoice' : 'entry.startVoice')}
        disabled={busy || (!capturing && (!consent || draft.length >= MAX_CAPTURE_TEXT_LENGTH))}
        onPress={capturing ? stop : start} testID="voice-capture-toggle" />
    </>}
    <View style={styles.transcription}><Field label={t('entry.reviewTranscript')} value={draft} multiline
      onChangeText={value => { const bounded = boundCaptureText(value); draftRef.current = bounded; onDraftChange(bounded); }}
      maxLength={MAX_CAPTURE_TEXT_LENGTH} editable={!busy} placeholder={t('entry.transcriptPlaceholder')}
      hint={t('entry.transcriptHint', { count: formatNumber(draft.length), limit: formatNumber(MAX_CAPTURE_TEXT_LENGTH) })}
      testID="voice-transcript" />
      <Button accent label={t('entry.reviewAndConfirm')} disabled={busy || !draft.trim()} onPress={review} testID="voice-review" />
    </View>
    <View style={styles.back}><Button secondary icon={ArrowLeft} label={t('entry.back')} disabled={busy} onPress={leave} /></View>
  </View>;
}

export function ScannerScreen({ busy, onManual, onBack }: {
  busy: boolean; onManual: (code?: string) => void; onBack: () => void;
}) {
  const { t } = useI18n();
  const browser = captureWindow();
  const Detector = browser?.BarcodeDetector;
  const cameraAvailable = !!(Detector?.getSupportedFormats && browser?.navigator.mediaDevices?.getUserMedia);
  const [consent, setConsent] = useState(false);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'starting' | 'scanning' | 'unsupported' | 'denied' | 'error' | 'unknown' | 'invalid'>('idle');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  const generationRef = useRef(0);
  const pendingRef = useRef(false);

  const releaseCamera = () => {
    generationRef.current++; pendingRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    stopCaptureStream(streamRef.current); streamRef.current = null;
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.srcObject = null; }
  };
  const stop = () => { releaseCamera(); setStatus('idle'); };
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; releaseCamera(); };
  }, []);
  useEffect(() => { if (busy) stop(); }, [busy]);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const hide = () => { if (document.visibilityState === 'hidden') stop(); };
    const leavePage = () => stop();
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', leavePage);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('pagehide', leavePage);
    };
  }, []);

  const start = async () => {
    if (!cameraAvailable || !Detector || !browser || !consent || busy || pendingRef.current || streamRef.current) return;
    const generation = ++generationRef.current;
    pendingRef.current = true; setStatus('starting');
    const active = () => mountedRef.current && generationRef.current === generation;
    let acquiredStream: MediaStream | null = null;
    try {
      // Checking formats never asks for the camera: unsupported decoders stay in manual mode.
      const formats = supportedRetailBarcodeFormats(await Detector.getSupportedFormats());
      if (!active()) return;
      if (!formats.length) { pendingRef.current = false; setStatus('unsupported'); return; }
      const detector = new Detector({ formats });
      acquiredStream = await browser.navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      if (!active()) { stopCaptureStream(acquiredStream); return; }
      streamRef.current = acquiredStream;
      const video = videoRef.current;
      if (!video) { releaseCamera(); setStatus('error'); return; }
      video.srcObject = acquiredStream;
      await video.play();
      if (!active()) { stopCaptureStream(acquiredStream); return; }
      pendingRef.current = false; setStatus('scanning');
      const detect = async () => {
        if (!active()) return;
        try {
          if (video.readyState >= 2) {
            const results = await detector.detect(video);
            if (!active()) return;
            const match = results.find(result => typeof result.rawValue === 'string' && isValidRetailBarcode(result.rawValue));
            if (match) { const value = match.rawValue; releaseCamera(); setCode(value); setStatus('unknown'); return; }
          }
          if (active()) timerRef.current = setTimeout(() => { void detect(); }, 300);
        } catch {
          if (active()) { releaseCamera(); setStatus('error'); }
        }
      };
      void detect();
    } catch (error) {
      if (!active()) { stopCaptureStream(acquiredStream); return; }
      releaseCamera();
      setStatus(error instanceof Error && error.name === 'NotAllowedError' ? 'denied' : 'error');
    }
  };
  const manual = () => { stop(); onManual(isValidRetailBarcode(code) ? code : undefined); };
  const validate = () => { releaseCamera(); setStatus(isValidRetailBarcode(code) ? 'unknown' : 'invalid'); };
  const leave = () => { releaseCamera(); onBack(); };
  const capturing = status === 'starting' || status === 'scanning';

  return <View style={ui.page} testID="scanner-screen">
    <Title kicker="" title={t('entry.scanTitle')} subtitle={t('entry.scanSubtitle')} />
    <Card style={styles.scannerPanel}>
      {Platform.OS === 'web' && React.createElement('video', {
        ref: videoRef, muted: true, playsInline: true, autoPlay: false,
        'aria-label': t('entry.cameraPreview'),
        style: { width: '100%', maxHeight: 260, borderRadius: 14, objectFit: 'cover', display: status === 'scanning' ? 'block' : 'none' },
      })}
      {status !== 'scanning' && <><View style={styles.barcodeIcon}><Barcode size={94} color={c.deep} strokeWidth={1.4} /></View>
        <Text style={styles.panelTitle}>{t(status === 'starting' ? 'entry.cameraStarting' : 'entry.scanReady')}</Text>
        <Text style={[ui.note, styles.center]}>{t('entry.scanFormats')}</Text></>}
    </Card>
    {(!cameraAvailable || status === 'unsupported') && <Notice title={t('entry.scanUnavailable')} text={t('entry.scanUnavailableBody')} />}
    {status === 'denied' && <Notice kind="error" title={t('entry.cameraDenied')} text={t('entry.cameraDeniedBody')} />}
    {status === 'error' && <Notice kind="error" title={t('entry.scanError')} text={t('entry.scanErrorBody')} />}
    {cameraAvailable && status !== 'unsupported' && <>
      <Consent checked={consent} disabled={busy} testID="camera-consent" label={t('entry.cameraConsent')}
        onChange={value => { if (!value) stop(); setConsent(value); }} />
      <Button secondary icon={capturing ? Square : ScanLine} label={t(capturing ? 'entry.stopCamera' : 'entry.startCamera')}
        disabled={busy || (!capturing && !consent)} onPress={capturing ? stop : () => { void start(); }} testID="scanner-capture-toggle" />
    </>}
    <View style={styles.codeField}><Field label={t('entry.barcodeLabel')} value={code} editable={!busy && !capturing}
      inputMode="numeric" keyboardType="number-pad" maxLength={14} autoCorrect={false}
      onChangeText={value => { setCode(value.replace(/[^0-9]/g, '').slice(0, 14)); if (status === 'invalid' || status === 'unknown') setStatus('idle'); }}
      placeholder={t('entry.barcodePlaceholder')} hint={t('entry.barcodeHint')} testID="scanner-code" />
      {!!code && !capturing && <Button secondary label={t('entry.checkCode')} disabled={busy} onPress={validate} />}
    </View>
    {status === 'invalid' && <Notice kind="error" title={t('entry.invalidCode')} text={t('entry.invalidCodeBody')} />}
    {status === 'unknown' && <Notice title={t('entry.unknownCode')} text={t('entry.unknownCodeBody')} />}
    <View style={styles.manual}><Button label={t(isValidRetailBarcode(code) ? 'entry.completeProduct' : 'entry.addManually')}
      icon={Pencil} onPress={manual} disabled={busy} testID="scanner-add-manually" />
      <Text style={ui.note}>{t('entry.manualReviewHint')}</Text></View>
    <View style={styles.back}><Button secondary icon={ArrowLeft} label={t('entry.back')} onPress={leave} disabled={busy} /></View>
  </View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, center: { textAlign: 'center' },
  capturePanel: { backgroundColor: c.soft, alignItems: 'center', gap: 12, paddingVertical: 27, marginBottom: 18 },
  captureIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' },
  panelTitle: { fontFamily: f.bold, color: c.deep, fontSize: 20, lineHeight: 28, textAlign: 'center' },
  consent: { minHeight: 44, flexDirection: 'row', alignItems: 'flex-start', gap: 11, paddingVertical: 12, marginBottom: 10 },
  checkbox: { width: 24, height: 24, borderWidth: 1.5, borderColor: c.primary, backgroundColor: c.surface, borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checked: { backgroundColor: c.primary }, transcription: { marginTop: 25 }, back: { marginTop: 13 },
  scannerPanel: { minHeight: 225, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 18 },
  barcodeIcon: { borderRadius: 15, backgroundColor: c.background, paddingHorizontal: 25, paddingVertical: 10, borderWidth: 1, borderColor: c.line },
  codeField: { marginTop: 24, marginBottom: 17 }, manual: { gap: 12, marginTop: 8 },
});
