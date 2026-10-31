const fs = require('node:fs');
const path = require('node:path');
const surfaces = { cream: '#FFF9EF', white: '#FFFFFF', soft: '#F2F2DF', notice: '#EAF0E0', warning: '#FAEDC9', menu: '#F5E9C6', profile: '#F8EDCA', household: '#F3F2E3', excluded: '#F4F2E7' };
function light(color) {
  const [r, g, b] = color.slice(1).match(/../g).map(c => parseInt(c, 16) / 255).map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => (Math.max(light(a), light(b)) + 0.05) / (Math.min(light(a), light(b)) + 0.05);
const checks = [];
for (const [surface, background] of Object.entries(surfaces)) {
  for (const [name, foreground] of Object.entries({ primaryText: '#253D2B', secondaryText: '#5C6651' })) checks.push({ usage: `${name}/${surface}`, foreground, background, threshold: 4.5 });
}
for (const [usage, foreground, background] of [
  ['primary button', '#FFFFFF', '#167347'], ['primary link on cream', '#167347', '#FFF9EF'],
  ['error title', '#913C2B', '#FCEEE8'], ['error body', '#5C6651', '#FCEEE8'], ['danger pill', '#913C2B', '#FBE9E3'],
  ['budget body', '#214633', '#F6D66B'], ['budget warning', '#913C2B', '#F6D66B'], ['budget example pill', '#214633', '#FAEAB1'],
  ['header demo', '#214633', '#F6E8BC'], ['toast', '#214633', '#E9EFDE'], ['yellow pill', '#214633', '#FAEAB1'], ['green pill', '#214633', '#E8F1E2'], ['neutral pill', '#214633', '#F0F0E7'],
]) checks.push({ usage, foreground, background, threshold: 4.5 });
checks.push({ usage: 'input boundary', foreground: '#748268', background: '#FFFFFF', threshold: 3 });
const result = checks.map(item => ({ ...item, ratio: Number(contrast(item.foreground, item.background).toFixed(2)), pass: contrast(item.foreground, item.background) >= item.threshold }));
const directory = path.join(__dirname, 'evidence');
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(path.join(directory, 'contrast.json'), JSON.stringify({ method: 'sRGB relative luminance; WCAG normal text 4.5:1 and input boundary 3:1; not a full accessibility audit', checks: result }, null, 2));
console.log(`${result.filter(item => item.pass).length}/${result.length} pares de contraste correctos.`);
if (result.some(item => !item.pass)) { console.error(result.filter(item => !item.pass)); process.exitCode = 1; }
