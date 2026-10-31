const fs = require('node:fs');
const path = require('node:path');

function luminance(hex) {
  const rgb = hex.replace('#', '').match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function ratio(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

(async () => {
  const { themes } = await import('./tokens.ts');
  const rows = [];
  for (const t of Object.values(themes)) {
    for (const background of ['background', 'surface', 'soft']) {
      for (const foreground of ['ink', 'muted', 'primary']) {
        rows.push({ variant: t.id, usage: `${foreground}/${background}`, foreground: t[foreground], background: t[background], ratio: ratio(t[foreground], t[background]) });
      }
    }
    rows.push({ variant: t.id, usage: 'onPrimary/primary', foreground: t.onPrimary, background: t.primary, ratio: ratio(t.onPrimary, t.primary) });
    rows.push({ variant: t.id, usage: 'accentInk/accent', foreground: t.accentInk, background: t.accent, ratio: ratio(t.accentInk, t.accent) });
  }
  for (const [variant, usage, foreground, background] of [
    ['v1', 'demo strip', '#133D2D', '#E7F0E5'], ['v2', 'demo strip', '#E9F8EC', '#214D38'], ['v3', 'demo strip', '#214633', '#F6E8BC'],
    ['v2', 'header body', '#DCEBDD', '#133D2D'], ['v2', 'mint on header', '#B5F1C8', '#133D2D'],
    ['v3', 'budget on yellow', '#214633', '#F2C94C'], ['v3', 'budget sample', '#214633', '#FFEDA6'],
    ['v3', 'menu body', '#5C6651', '#F5E9C6'],
  ]) rows.push({ variant, usage, foreground, background, ratio: ratio(foreground, background) });
  const checks = rows.map(row => ({ ...row, ratio: Number(row.ratio.toFixed(2)), passAA: row.ratio >= 4.5 }));
  fs.mkdirSync(path.join(__dirname, 'evidence'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'evidence/contrast.json'), JSON.stringify({ method: 'WCAG relative luminance, sRGB; normal text threshold 4.5:1', checks }, null, 2));
  for (const variant of ['v1', 'v2', 'v3']) {
    const local = checks.filter(row => row.variant === variant);
    console.log(`${variant}: ${local.filter(row => row.passAA).length}/${local.length} AA; mínimo ${Math.min(...local.map(row => row.ratio))}:1`);
  }
  if (checks.some(row => !row.passAA)) { console.error(checks.filter(row => !row.passAA)); process.exitCode = 1; }
})().catch(error => { console.error(error); process.exitCode = 1; });
