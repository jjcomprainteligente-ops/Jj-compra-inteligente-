// Serve the exported app locally and run browser checks in the same environment.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '../dist');
const evidence = path.resolve(__dirname, '../design/b03-b04/evidence');
fs.mkdirSync(evidence, { recursive: true });
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let file;
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    file = path.resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
  } catch { res.writeHead(400); res.end(); }
});
function run(args) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, PLAYWRIGHT_JSON_OUTPUT_FILE: path.join(evidence, 'playwright-results.json') };
    if (!env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH && fs.existsSync('/usr/bin/chromium')) env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = '/usr/bin/chromium';
    const child = spawn(process.execPath, args, { cwd: path.resolve(__dirname, '..'), stdio: 'inherit', env });
    child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Browser command exited ${code}`)));
  });
}
server.listen(8081, '127.0.0.1', async () => {
  try {
    if (process.argv.includes('--capture')) await run(['scripts/capture-b03-b04.cjs']);
    else {
      await run(['node_modules/@playwright/test/cli.js', 'test', '--reporter=list,json']);
      if (process.argv.includes('--all')) await run(['scripts/capture-b03-b04.cjs']);
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
  finally { server.close(); }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
