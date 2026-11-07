import { describe, expect, it, vi } from 'vitest';
import {
  appendCaptureText, boundCaptureText, isValidRetailBarcode, MAX_CAPTURE_TEXT_LENGTH,
  normalizeProductSearch, stopCaptureStream, supportedRetailBarcodeFormats,
} from '../src/app/captureCapabilities';

describe('optional browser capture boundaries', () => {
  it.each(['96385074', '036000291452', '4006381333931', '10012345000017'])('accepts the GS1 checksum of %s', code => {
    expect(isValidRetailBarcode(code)).toBe(true);
  });
  it.each(['', '00000000', '0000000000000', '4006381333932', '96385075', '036000291453',
    '10012345000018', '400638133393', ' 4006381333931', '4006381333931 ', '40063813339a1', '４００６３８１３３３９３１'])('rejects malformed or invalid barcode %s', code => {
    expect(isValidRetailBarcode(code)).toBe(false);
  });
  it('does not infer unsupported formats or expand a detected UPC code', () => {
    expect(supportedRetailBarcodeFormats(['qr_code', 'ean_13', 'code_128'])).toEqual(['ean_13']);
    expect(supportedRetailBarcodeFormats(['qr_code'])).toEqual([]);
    expect(supportedRetailBarcodeFormats(['upc_a', 'upc_a', 'ean_8'])).toEqual(['ean_8', 'upc_a']);
  });
  it('preserves normal multilingual text, notes and line breaks while removing invisible controls', () => {
    expect(boundCaptureText('Œufs\nÖl\tPiña 🙂')).toBe('Œufs\nÖl\tPiña 🙂');
    expect(boundCaptureText('a\u0000b\u0085c\u202Ed\u2066e\uFEFFf')).toBe('abcdef');
    expect(boundCaptureText('x'.repeat(7000))).toHaveLength(MAX_CAPTURE_TEXT_LENGTH);
  });
  it('bounds combined transcripts and never re-appends blank recognition results', () => {
    expect(appendCaptureText('Leche', '  1 L  ')).toBe('Leche 1 L');
    expect(appendCaptureText('Leche\n', 'Huevos')).toBe('Leche\nHuevos');
    expect(appendCaptureText('Huevos', '  ')).toBe('Huevos');
    expect(appendCaptureText('x'.repeat(5999), ' leche')).toHaveLength(6000);
  });
  it('normalizes search accents without changing the stored product text', () => {
    const stored = '  PiñA y Öl  ';
    expect(normalizeProductSearch(stored)).toBe('pina y ol');
    expect(stored).toBe('  PiñA y Öl  ');
  });
  it('releases every acquired track even if another track stop fails', () => {
    const stop = vi.fn();
    expect(() => stopCaptureStream(null)).not.toThrow();
    expect(() => stopCaptureStream({ getTracks: () => [{ stop: () => { throw Error('ended'); } }, { stop }] })).not.toThrow();
    expect(stop).toHaveBeenCalledOnce();
  });
});
