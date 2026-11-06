#!/usr/bin/env node
// Verify only the isolated V2 export; preserve all earlier deliveries and recovered reference files.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');

const project = path.resolve(__dirname, '..');
const exported = path.join(project, 'dist-v2');
const evidenceRoot = path.join(project, 'design/v2/evidence');
const port = 8081;
const host = '127.0.0.1';
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.json': 'application/json' };
let evidence;
let child;
let interrupted = false;

function fingerprint(directory) {
  if (!fs.existsSync(directory)) return null;
  const hash = crypto.createHash('sha256');
  function walk(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const filename = path.join(folder, entry.name);
      hash.update(path.relative(directory, filename));
      if (entry.isDirectory()) walk(filename);
      else if (entry.isSymbolicLink()) hash.update(fs.readlinkSync(filename));
      else if (entry.isFile()) hash.update(fs.readFileSync(filename));
    }
  }
  walk(directory); return hash.digest('hex');
}
const protectedPaths = ['dist-v2', 'dist', 'dist-i18n', 'design/b01', 'design/b02', 'design/b03-b04', 'design/b05', 'design/b06', 'design/i18n', 'referencias/gpt6-v2'];
function protectedHashes() { return Object.fromEntries(protectedPaths.map(name => [name, fingerprint(path.join(project, name))])); }

const server = http.createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, `http://${host}`).pathname);
    let filename = path.resolve(exported, '.' + pathname);
    if (filename !== exported && !filename.startsWith(exported + path.sep)) { response.writeHead(403); response.end(); return; }
    if (pathname === '/favicon.ico' && !fs.existsSync(filename)) { response.writeHead(204); response.end(); return; }
    if (!fs.existsSync(filename) || fs.statSync(filename).isDirectory()) {
      if (path.extname(pathname)) { response.writeHead(404); response.end('Not found'); return; }
      filename = path.join(exported, 'index.html');
    }
    const real = fs.realpathSync(filename);
    if (!real.startsWith(fs.realpathSync(exported) + path.sep)) { response.writeHead(403); response.end(); return; }
    response.setHeader('Content-Type', mime[path.extname(filename)] || 'application/octet-stream');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-JJ-V2-Export', 'dist-v2');
    if (request.method === 'HEAD') { response.end(); return; }
    fs.createReadStream(filename).on('error', () => response.destroy()).pipe(response);
  } catch { response.writeHead(400); response.end(); }
});

function suite() {
  return new Promise((resolve, reject) => {
    const log = fs.createWriteStream(path.join(evidence, 'playwright.log'), { flags: 'wx' });
    const env = { ...process.env, PLAYWRIGHT_EXPORTED_APP: '1', I18N_EVIDENCE_DIR: evidence,
      PLAYWRIGHT_JSON_OUTPUT_FILE: path.join(evidence, 'playwright-results.json'),
      PLAYWRIGHT_HTML_OUTPUT_DIR: path.join(evidence, 'playwright-report'), PLAYWRIGHT_HTML_OPEN: 'never' };
    if (!env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH && fs.existsSync('/usr/bin/chromium')) env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = '/usr/bin/chromium';
    child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--reporter=list,json,html', '--output', path.join(evidence, 'test-results')],
      { cwd: project, env, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', data => { process.stdout.write(data); log.write(data); });
    child.stderr.on('data', data => { process.stderr.write(data); log.write(data); });
    child.on('error', error => { log.end(); reject(error); });
    child.on('close', (code, signal) => { log.end(); resolve({ exitCode: code ?? 1, signal }); });
  });
}

function gallery(reports) {
  const escape = text => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const cards = reports.flatMap(report => report.checks.map(check => `<figure><a href="screenshots/${encodeURIComponent(check.filename)}"><img loading="lazy" src="screenshots/${encodeURIComponent(check.filename)}" alt="${escape(`${report.language} ${report.viewport.width} ${check.scene}`)}"></a><figcaption>${escape(`${report.language} · ${report.viewport.width}px · ${check.scene}`)}</figcaption></figure>`)).join('\n');
  fs.writeFileSync(path.join(evidence, 'review.html'), `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Auditoría visual V2 e idiomas</title><style>body{font:16px system-ui;margin:24px;background:#fff8e7;color:#143e2c}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px}figure{margin:0;background:white;padding:12px;border:1px solid #ddd;border-radius:12px}img{width:100%;max-height:650px;object-fit:contain;object-position:top}figcaption{padding-top:10px}p{max-width:900px}</style><h1>Auditoría visual V2 e idiomas</h1><p>Exportación dist-v2. Chromium a tamaños CSS 375, 430 y 1280. No es una prueba en iPhone físico, Safari ni iOS nativo. Datos ficticios aislados; no son precios comerciales verificados.</p><p><a href="report.json">Comprobaciones de texto y diseño</a> · <a href="playwright-report/index.html">Suite Playwright completa</a></p><main>${cards}</main></html>`, { flag: 'wx' });
}

async function main() {
  if (!fs.existsSync(path.join(exported, 'index.html'))) throw new Error('Falta dist-v2/index.html. Exporta la aplicación a dist-v2 antes de verificarla.');
  // Binding is the ownership check. Never reuse a listener or terminate another process.
  await new Promise((resolve, reject) => {
    server.once('error', error => reject(error.code === 'EADDRINUSE' ? new Error('El puerto 8081 ya está ocupado. No se ha reutilizado ni detenido el otro proceso.') : error));
    server.listen(port, host, resolve);
  });
  const before = protectedHashes();
  fs.mkdirSync(evidenceRoot, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  evidence = fs.mkdtempSync(path.join(evidenceRoot, `run-${stamp}-`));
  console.log(`Evidencia nueva: ${evidence}`);
  const startedAt = new Date().toISOString();
  let result = { exitCode: 1, signal: null };
  try { result = await suite(); }
  finally {
    const reports = fs.readdirSync(evidence).filter(name => /^(es|en|de|fr)-\d+-checks\.json$/.test(name)).sort().map(name => JSON.parse(fs.readFileSync(path.join(evidence, name), 'utf8')));
    const after = protectedHashes();
    const preserved = protectedPaths.every(name => before[name] === after[name]);
    const checks = reports.flatMap(report => report.checks);
    const errors = reports.flatMap(report => report.errors);
    const failedChecks = checks.filter(check => check.health.horizontalOverflow || check.health.outside.length || check.health.clipped.length || check.health.rawKeys.length);
    const completeMatrix = reports.length === 12 && checks.length === 120;
    const resultsPath = path.join(evidence, 'playwright-results.json');
    let suiteStatistics = null;
    let resultsReadError = null;
    try {
      suiteStatistics = JSON.parse(fs.readFileSync(resultsPath, 'utf8')).stats ?? null;
      if (!suiteStatistics) resultsReadError = 'The Playwright JSON report did not include statistics.';
    } catch (error) { resultsReadError = error.message; }
    const suitePassed = result.exitCode === 0 && !!suiteStatistics && suiteStatistics.unexpected === 0 && suiteStatistics.flaky === 0;
    const report = { startedAt, finishedAt: new Date().toISOString(), origin: `http://${host}:${port}`, export: 'dist-v2',
      method: 'Chromium browser contexts at CSS 375×667, 430×932 and 1280×1000; not physical iPhone, native iOS or Safari',
      scope: 'Entire Playwright suite against the V2 web export: existing functional regressions, isolated es/en/de/fr flows and 120 visual-health captures; not pixel-level design approval',
      data: 'Fictional names, shops and prices in isolated browser storage; no commercial verification',
      nativeChecksPending: ['Physical iPhone and Android', 'VoiceOver/TalkBack', 'Dynamic Type', 'Native keyboard, gestures and safe areas'],
      suite: result, suiteStatistics, suitePassed, resultsReadError, interrupted, completeMatrix, screenshots: checks.length, runtimeErrors: errors, failedVisualChecks: failedChecks,
      protectedArtifactsUnchanged: preserved, protectedArtifacts: { before, after }, reports,
    };
    fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
    gallery(reports);
    if (!suitePassed || resultsReadError || !completeMatrix || errors.length || failedChecks.length || !preserved || interrupted) process.exitCode = 1;
    console.log(`Capturas: ${checks.length}/120; integridad anterior: ${preserved}; informe: ${path.join(evidence, 'report.json')}`);
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { interrupted = true; if (child && child.exitCode === null) child.kill(signal); else server.close(); });
main().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => server.close());
