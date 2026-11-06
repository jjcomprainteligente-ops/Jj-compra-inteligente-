#!/usr/bin/env node
// Package only the reviewed web export. This script does not upload or deploy.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const project = path.resolve(__dirname, '..');
const exported = path.join(project, 'dist-v2');
const previews = path.join(project, 'previews');
const repository = 'https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-';
const expectedLogoSha256 = 'ab7813942787048ff9a37ef86bce0b45bcf6e4a739e7427e679028e008c57596';
const digests = bytes => ({ sha1: crypto.createHash('sha1').update(bytes).digest('hex'), sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
const git = (...args) => execFileSync('git', args, { cwd: project, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function filesIn(directory) {
  const found = [];
  if (!fs.existsSync(directory)) throw new Error('Missing export directory: ' + path.relative(project, directory));
  if (fs.lstatSync(directory).isSymbolicLink()) throw new Error('Export directories must not be symlinks.');
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const filename = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Export resources must not be symlinks.');
    if (entry.isDirectory()) found.push(...filesIn(filename));
    else if (entry.isFile()) found.push(filename);
    else throw new Error('Unsupported export resource type.');
  }
  return found;
}

function main() {
  // Do not label uncommitted application changes as an existing GitHub commit.
  if (git('status', '--porcelain=v1', '--untracked-files=normal')) {
    throw new Error('Commit and review the source first: the Git working tree must be clean before packaging a preview.');
  }
  const source = {
    commit: git('rev-parse', 'HEAD'),
    tree: git('rev-parse', 'HEAD^{tree}'),
    branch: git('rev-parse', '--abbrev-ref', 'HEAD'),
    repository,
  };
  if (!/^[a-f0-9]{40}$/.test(source.commit) || !/^[a-f0-9]{40}$/.test(source.tree)) throw new Error('Invalid Git source identifiers.');
  const origin = git('config', '--get', 'remote.origin.url');
  if (![repository, repository + '.git', 'git@github.com:jjcomprainteligente-ops/Jj-compra-inteligente-.git'].includes(origin)) {
    throw new Error('The origin remote must be the canonical JJ Compra Inteligente repository.');
  }
  if (!fs.existsSync(exported) || fs.lstatSync(exported).isSymbolicLink()) throw new Error('A regular dist-v2 export is required.');
  const realExport = fs.realpathSync(exported);
  const prepared = new Map();
  function add(relative, filename) {
    if (path.isAbsolute(relative) || relative.split('/').some(part => !part || part === '.' || part === '..') || relative.includes('\\')) throw new Error('Invalid package path.');
    const real = fs.realpathSync(filename);
    if (!real.startsWith(realExport + path.sep) || !fs.lstatSync(filename).isFile() || fs.lstatSync(filename).isSymbolicLink()) throw new Error('Resource is outside the reviewed export.');
    const bytes = fs.readFileSync(filename);
    if (prepared.has(relative) && !prepared.get(relative).equals(bytes)) throw new Error('Conflicting compiled resource: ' + relative);
    prepared.set(relative, bytes);
  }
  add('index.html', path.join(exported, 'index.html'));
  for (const filename of filesIn(path.join(exported, '_expo/static/js/web'))) {
    // Sourcemaps and native bundles are deliberately outside the upload list.
    if (path.extname(filename) === '.js') add(path.relative(exported, filename).split(path.sep).join('/'), filename);
  }
  const rewrites = [];
  for (const filename of filesIn(path.join(exported, 'assets'))) {
    const relative = path.relative(exported, filename).split(path.sep).join('/');
    const parts = relative.split('/');
    const extension = path.extname(filename).toLowerCase();
    if (parts.includes('node_modules')) {
      if (!/^Manrope_(?:200ExtraLight|300Light|400Regular|500Medium|600SemiBold|700Bold|800ExtraBold)\.[a-f0-9]{32}\.ttf$/.test(path.basename(filename))) {
        throw new Error('Review the new dependency resource before publishing: ' + relative);
      }
      const flat = 'assets/' + path.basename(filename);
      add(flat, filename);
      rewrites.push({ source: '/' + relative, destination: '/' + flat });
    } else {
      if (!['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ttf', '.otf', '.woff', '.woff2'].includes(extension) && !/^[a-f0-9]{24,64}$/.test(path.basename(filename))) {
        throw new Error('Review the new compiled asset type before publishing: ' + relative);
      }
      add(relative, filename);
    }
  }
  if (rewrites.length !== 7 || new Set(rewrites.map(rule => rule.source)).size !== 7) throw new Error('Expected the seven reviewed Manrope font resources.');
  // Include the existing font notices unchanged with their redistributed binaries.
  for (const name of ['Manrope-LICENSE.txt', 'Manrope-LICENSE_FONT.txt']) {
    const filename = path.join(project, 'design/i18n/audit/licenses', name);
    if (!fs.lstatSync(filename).isFile() || fs.lstatSync(filename).isSymbolicLink() || fs.realpathSync(filename) !== filename) {
      throw new Error('The reviewed Manrope license notices must be regular source files.');
    }
    prepared.set('assets/licenses/' + name, fs.readFileSync(filename));
  }
  const template = JSON.parse(fs.readFileSync(path.join(project, 'deployment/preview/vercel.json'), 'utf8'));
  const headers = template.headers;
  if (!Array.isArray(headers) || !headers.some(rule => rule.source === '/(.*)' && rule.headers?.some(header => header.key === 'X-Robots-Tag' && header.value === 'noindex, nofollow')) ||
      !headers.some(rule => rule.source === '/(.*)' && rule.headers?.some(header => header.key === 'X-Content-Type-Options' && header.value === 'nosniff'))) {
    throw new Error('The reviewed preview security headers are required.');
  }
  prepared.set('vercel.json', Buffer.from(JSON.stringify({ $schema: 'https://openapi.vercel.sh/vercel.json', rewrites, headers }, null, 2) + '\n'));
  const files = [...prepared].sort(([a], [b]) => a.localeCompare(b)).map(([file, bytes]) => ({ file, size: bytes.length, ...digests(bytes) }));
  const html = prepared.get('index.html').toString('utf8');
  const entry = html.match(/<script\b[^>]*\bsrc=["']\/(\_expo\/static\/js\/web\/[^"']+\.js)["']/i)?.[1];
  const bundle = files.find(file => file.file === entry);
  if (!bundle) throw new Error('The web entry bundle referenced by index.html is missing.');
  const logoFiles = files.filter(file => /^assets\/assets\/brand\/jj-logo-horizontal\.[a-f0-9]{32}\.png$/.test(file.file));
  if (logoFiles.length !== 1 || logoFiles[0].sha256 !== expectedLogoSha256) throw new Error('The approved, unaltered V2 logo is required.');
  const logo = logoFiles[0];
  const logoBytes = prepared.get(logo.file);
  if (!logoBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) || logoBytes.readUInt32BE(16) !== 936 || logoBytes.readUInt32BE(20) !== 330) throw new Error('Unexpected approved logo dimensions.');
  // Validate everything before creating a new output directory; never replace a prior package.
  fs.mkdirSync(previews, { recursive: true });
  if (fs.lstatSync(previews).isSymbolicLink()) throw new Error('The previews directory must not be a symlink.');
  const createdAt = new Date().toISOString();
  const output = fs.mkdtempSync(path.join(previews, 'v2-web-' + createdAt.replace(/[:.]/g, '-') + '-'));
  for (const [file, bytes] of prepared) {
    const destination = path.join(output, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, bytes, { flag: 'wx' });
  }
  fs.mkdirSync(path.join(output, '.vercel'));
  const manifest = { schemaVersion: 1, createdAt, input: 'dist-v2', source, bundle, logo, expectedLogoSha256,
    assets: files.filter(file => file.file.startsWith('assets/')), files,
    upload: { files: files.length, bytes: files.reduce((total, file) => total + file.size, 0) },
    scope: 'Reviewed compiled web client, approved logo, fonts with their existing license notices and preview configuration only; no native bundles, source, fixtures, local data or credentials.' };
  fs.writeFileSync(path.join(output, '.vercel/files.json'), JSON.stringify(files.map(({ file, size, sha1 }) => ({ file, size, sha: sha1 })), null, 2) + '\n', { flag: 'wx' });
  fs.writeFileSync(path.join(output, '.vercel/manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ previewDirectory: path.relative(project, output).split(path.sep).join('/'), sourceCommit: source.commit,
    bundleSha256: bundle.sha256, logoSha256: logo.sha256, uploadFiles: manifest.upload.files, uploadBytes: manifest.upload.bytes }));
}

try { main(); }
catch (error) { console.error(error.message); process.exitCode = 1; }
