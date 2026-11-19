/** Pure boundaries for optional browser capture. No permission requests or hardware access here. */
export const MAX_CAPTURE_TEXT_LENGTH = 6000;
export const RETAIL_BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a'] as const;

export function boundCaptureText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B\u200E\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '').slice(0, MAX_CAPTURE_TEXT_LENGTH);
}

export function appendCaptureText(current: string, addition: string): string {
  const incoming = boundCaptureText(addition).trim();
  if (!incoming) return boundCaptureText(current);
  return boundCaptureText(current + (current && !/\s$/.test(current) ? ' ' : '') + incoming);
}

export function normalizeProductSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036F]/g, '').toLowerCase().trim();
}

/** GTIN-8, UPC-A, EAN-13 and GTIN-14 share the GS1 modulo-10 check digit. */
export function isValidRetailBarcode(value: string): boolean {
  if (!/^(?:\d{8}|\d{12}|\d{13}|\d{14})$/.test(value) || /^0+$/.test(value)) return false;
  let sum = 0;
  for (let index = value.length - 2, weight = 3; index >= 0; index--, weight = weight === 3 ? 1 : 3) {
    sum += Number(value[index]) * weight;
  }
  return (10 - sum % 10) % 10 === Number(value[value.length - 1]);
}

export function supportedRetailBarcodeFormats(formats: readonly string[]): string[] {
  return RETAIL_BARCODE_FORMATS.filter(format => formats.includes(format));
}

/** Try every track even when a browser or a test double fails while releasing one. */
export function stopCaptureStream(stream: { getTracks(): readonly { stop(): void }[] } | null): void {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    try { track.stop(); } catch { /* Continue releasing the remaining tracks. */ }
  }
}
