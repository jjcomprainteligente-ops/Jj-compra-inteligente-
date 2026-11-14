#!/usr/bin/env node
// Verify a packaged, protected V2 preview without persisting authentication state.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');

const brand = 'JJ Compra Inteligente';
const approvedLogoSha256 = 'ab7813942787048ff9a37ef86bce0b45bcf6e4a739e7427e679028e008c57596';
const locales = {
  es: { locale: 'es-ES', tabs: ['Inicio', 'Mi compra', 'Ahorro', 'Menús'], cancel: 'Cancelar propuesta', discard: 'Cancelar sin añadir' },
  en: { locale: 'en-GB', tabs: ['Home', 'My shopping', 'Savings', 'Menus'], cancel: 'Cancel proposal', discard: 'Cancel without adding' },
  de: { locale: 'de-DE', tabs: ['Start', 'Einkauf', 'Sparen', 'Menüs'], cancel: 'Vorschlag abbrechen', discard: 'Ohne Hinzufügen abbrechen' },
  fr: { locale: 'fr-FR', tabs: ['Accueil', 'Mes courses', 'Économies', 'Menus'], cancel: 'Annuler la proposition', discard: 'Annuler sans ajouter' },
};
const keys = ['jjcompraintelwgiemt.shopping.v1', 'jjcompraintelwgiemt.menus.v1',
  'jjcompraintelwgiemt.comparisons.v1', 'jjcompraintelwgiemt.price-observations.v1', 'jjcompraintelwgiemt.expenses.v1', 'jjcompraintelwgiemt.local-settings.v1'];
const preferenceKey = 'jjcompraintelwgiemt.preferences.v1';
const expectedCatalogTotal = process.env.JJ_EXPECT_CATALOG_TOTAL;
const expectedCatalogRecipeId = process.env.JJ_EXPECT_CATALOG_RECIPE_ID;
if (expectedCatalogTotal !== undefined && !/^[1-9]\d{0,2}$/.test(expectedCatalogTotal)) throw new Error('Invalid expected catalogue count.');
if (expectedCatalogRecipeId !== undefined && !/^[A-Za-z0-9-]{1,100}$/.test(expectedCatalogRecipeId)) throw new Error('Invalid expected catalogue recipe ID.');
const hash = (bytes, algorithm) => crypto.createHash(algorithm).update(bytes).digest('hex');
const snapshot = page => page.evaluate(names => names.map(name => localStorage.getItem(name)), keys);
const inside = (parent, child) => child.startsWith(parent + path.sep);
const shareCredentials = (() => {
  try {
    return [...new URL(process.env.JJ_PREVIEW_SHARE_URL || '').searchParams]
      .filter(([key, value]) => /share|bypass|token|secret/i.test(key) && value.length > 0).map(([, value]) => value);
  } catch { return []; }
})();

function safeMessage(error) {
  let message = error instanceof Error ? error.message : String(error);
  for (const credential of shareCredentials) message = message.split(credential).join('[redacted]');
  return message.replace(/https?:\/\/[^\s<>"')]+/g, value => {
    try { const url = new URL(value); return url.origin + url.pathname; }
    catch { return '[URL redacted]'; }
  }).replace(/([?&](?:_vercel_share|x-vercel-protection-bypass|token|secret)=)[^&\s]+/gi, '$1[redacted]')
    .replace(/^(\s*[-•]?\s*(?:authorization|proxy-authorization|cookie|set-cookie|x-vercel-protection-bypass|x-vercel-set-bypass-cookie)\s*:).*$/gim, '$1 [redacted]');
}

function validFileName(name) {
  return typeof name === 'string' && name.length > 0 && !path.isAbsolute(name) &&
    !/[\\\u0000-\u001f?#]/.test(name) && !name.split('/').some(part => !part || part === '.' || part === '..');
}

async function containedFile(preview, name) {
  if (!validFileName(name)) throw new Error('Invalid package file path.');
  const filename = path.resolve(preview, name);
  if (!inside(preview, filename)) throw new Error('Package file escaped the preview directory.');
  if ((await fs.lstat(filename)).isSymbolicLink()) throw new Error('Package symlinks are not accepted.');
  const actual = await fs.realpath(filename);
  if (!inside(preview, actual)) throw new Error('Package file resolves outside the preview directory.');
  return actual;
}

async function readPackage() {
  const root = await fs.realpath(path.resolve(__dirname, '..'));
  const relative = process.env.JJ_PREVIEW_DIRECTORY;
  if (!relative || path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').some(part => !part || part === '.' || part === '..') || !relative.startsWith('previews/')) {
    throw new Error('JJ_PREVIEW_DIRECTORY must be a relative package directory below previews/.');
  }
  const previewsPath = path.join(root, 'previews');
  if ((await fs.lstat(previewsPath)).isSymbolicLink()) throw new Error('The previews directory must not be a symlink.');
  const previews = await fs.realpath(previewsPath);
  if (!inside(root, previews)) throw new Error('The previews directory resolves outside the project.');
  const preview = await fs.realpath(path.resolve(root, relative));
  if (!inside(previews, preview)) throw new Error('Preview directory resolves outside previews/.');
  const manifest = JSON.parse(await fs.readFile(await containedFile(preview, '.vercel/manifest.json'), 'utf8'));
  const uploadFiles = JSON.parse(await fs.readFile(await containedFile(preview, '.vercel/files.json'), 'utf8'));
  if (manifest.schemaVersion !== 1 || !/^[a-f0-9]{40}$/.test(manifest.source?.commit ?? '') ||
    typeof manifest.source?.branch !== 'string' || !manifest.source.branch ||
    !['jjcomprainteligente-ops/Jj-compra-inteligente-', 'https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-',
      'https://github.com/jjcomprainteligente-ops/Jj-compra-inteligente-.git'].includes(manifest.source?.repository) ||
    !Array.isArray(manifest.files) || !Array.isArray(manifest.assets) || !Array.isArray(uploadFiles) ||
    manifest.expectedLogoSha256 !== approvedLogoSha256) throw new Error('Invalid package manifest or approved-logo expectation.');
  const files = new Map();
  for (const file of manifest.files) {
    if (!validFileName(file.file) || file.file.split('/').includes('node_modules') ||
      !(file.file === 'index.html' || file.file === 'vercel.json' || ['review/brand/index.html', 'review/brand/review.css'].includes(file.file) || file.file.startsWith('assets/') || /^_expo\/static\/js\/web\/[^/]+\.js$/.test(file.file)) ||
      !Number.isSafeInteger(file.size) || file.size < 0 ||
      !/^[a-f0-9]{40}$/.test(file.sha1 ?? '') || !/^[a-f0-9]{64}$/.test(file.sha256 ?? '') || files.has(file.file)) {
      throw new Error('Invalid or duplicate package manifest entry.');
    }
    const bytes = await fs.readFile(await containedFile(preview, file.file));
    if (bytes.length !== file.size || hash(bytes, 'sha1') !== file.sha1 || hash(bytes, 'sha256') !== file.sha256) {
      throw new Error('Local packaged file differs from its manifest: ' + file.file);
    }
    files.set(file.file, file);
  }
  if (!files.has('index.html') || !files.has('vercel.json') || uploadFiles.length !== files.size || new Set(uploadFiles.map(file => file.file)).size !== files.size) {
    throw new Error('Incomplete or inconsistent upload manifest.');
  }
  for (const file of uploadFiles) {
    const original = files.get(file.file);
    if (!original || original.size !== file.size || original.sha1 !== file.sha) throw new Error('Upload manifest differs from package manifest.');
  }
  const bundle = manifest.bundle;
  const knownBundle = bundle && files.get(bundle.file);
  if (!knownBundle || !/^_expo\/static\/js\/web\/[^/]+\.js$/.test(bundle.file) ||
    files.size === 0 || [...files.keys()].filter(file => file.endsWith('.js')).length !== 1 ||
    ['size', 'sha1', 'sha256'].some(key => knownBundle[key] !== bundle[key])) throw new Error('Invalid web bundle manifest.');
  if (bundle.contentEncoding !== 'br' || !Number.isSafeInteger(bundle.decodedSize) || bundle.decodedSize <= 0 || bundle.decodedSize > 32 * 1024 * 1024 ||
    !/^[a-f0-9]{40}$/.test(bundle.decodedSha1 ?? '') || !/^[a-f0-9]{64}$/.test(bundle.decodedSha256 ?? '')) throw new Error('Invalid Brotli bundle metadata.');
  const encodedBundle = await fs.readFile(await containedFile(preview, bundle.file));
  const decodedBundle = zlib.brotliDecompressSync(encodedBundle, { maxOutputLength: bundle.decodedSize });
  if (decodedBundle.length !== bundle.decodedSize || hash(decodedBundle, 'sha1') !== bundle.decodedSha1 || hash(decodedBundle, 'sha256') !== bundle.decodedSha256) {
    throw new Error('Brotli package does not preserve the expected application JavaScript.');
  }
  const assets = [...files.values()].filter(file => file.file.startsWith('assets/'));
  if (manifest.assets.length !== assets.length || new Set(manifest.assets.map(file => file.file)).size !== assets.length ||
    manifest.assets.some(file => !files.has(file.file) || !file.file.startsWith('assets/') || ['size', 'sha1', 'sha256'].some(key => files.get(file.file)[key] !== file[key]))) {
    throw new Error('Asset manifest is inconsistent.');
  }
  const logos = assets.filter(file => /(?:^|\/)jj-logo-horizontal[^/]*\.png$/.test(file.file));
  if (!logos.length || logos.some(file => file.sha256 !== manifest.expectedLogoSha256)) throw new Error('The supplied logo is missing or differs from the package expectation.');
  if (!manifest.logo || !logos.some(file => file.file === manifest.logo.file &&
    ['size', 'sha1', 'sha256'].every(key => file[key] === manifest.logo[key]))) throw new Error('The canonical logo manifest is inconsistent.');
  const config = JSON.parse(await fs.readFile(await containedFile(preview, 'vercel.json'), 'utf8'));
  const bundleHeaders = config.headers?.find(rule => rule.source === '/' + bundle.file)?.headers;
  if (!Array.isArray(bundleHeaders) || !bundleHeaders.some(header => header.key.toLowerCase() === 'content-encoding' && header.value === 'br') ||
      !bundleHeaders.some(header => header.key.toLowerCase() === 'content-type' && /^application\/javascript(?:;|$)/i.test(header.value)) ||
      !bundleHeaders.some(header => header.key.toLowerCase() === 'vary' && header.value.toLowerCase().split(',').map(value => value.trim()).includes('accept-encoding'))) {
    throw new Error('The exact bundle path must declare its Brotli JavaScript transport headers.');
  }
  if (!Array.isArray(config.rewrites) || config.rewrites.length !== 7 || new Set(config.rewrites.map(rewrite => rewrite.source)).size !== 7) {
    throw new Error('Expected seven distinct packaged font rewrites.');
  }
  for (const rewrite of config.rewrites) {
    if (typeof rewrite.source !== 'string' || !/^\/assets\/node_modules\/@expo-google-fonts\/manrope\/[^/]+\/[^/]+\.ttf$/.test(rewrite.source) ||
      typeof rewrite.destination !== 'string' || !/^\/assets\/[^/]+\.ttf$/.test(rewrite.destination) || !files.has(rewrite.destination.slice(1))) {
      throw new Error('Invalid or missing font rewrite destination.');
    }
  }
  return { preview, manifest, files, bundle, logos, config };
}

async function assertRenderedAssets(page) {
  const loaded = await page.evaluate(async () => {
    // Browsers defer unused font faces; exercise every declared app family,
    // including weights that the welcome screen does not render yet.
    const families = ['Manrope_400Regular', 'Manrope_500Medium', 'Manrope_600SemiBold', 'Manrope_700Bold', 'Manrope_800ExtraBold'];
    await Promise.all(families.map(family => document.fonts.load('16px "' + family + '"')));
    await document.fonts.ready;
    return [...document.fonts].filter(face => face.status === 'loaded').map(face => face.family.replace(/["']/g, ''));
  });
  for (const family of ['Manrope_400Regular', 'Manrope_500Medium', 'Manrope_600SemiBold', 'Manrope_700Bold', 'Manrope_800ExtraBold']) {
    if (!loaded.includes(family)) throw new Error('Expected font did not load: ' + family);
  }
  await expect.poll(() => page.evaluate(() => [...document.images].every(image => image.complete && image.naturalWidth > 0)),
    { message: 'All rendered images should load without a broken asset.' }).toBe(true);
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Horizontal overflow.');
  const rawKeys = await page.evaluate(() => {
    const labels = [...document.querySelectorAll('[aria-label]')].map(element => element.getAttribute('aria-label')).join('\n');
    return [...new Set(((document.body.innerText + '\n' + labels).match(/\b(?:app|menus|recipes|prices|secondary|common|legacy|errors|language|visual|visualSecondary|visualMenus|entry|flow|states|shell|money|moneyViews|localSettings|menuFilters|privacy|storePilot|listSharing)\.[a-zA-Z][\w.-]*/g) ?? []))];
  });
  if (rawKeys.length) throw new Error('Untranslated resource keys: ' + rawKeys.join(', '));
}

async function verifyResources(context, origin, packaged, report) {
  const publicFiles = [...packaged.files.values()].filter(file => file.file !== 'vercel.json').map(file => ({ ...file, path: '/' + file.file }));
  for (const rewrite of packaged.config.rewrites) publicFiles.push({ ...packaged.files.get(rewrite.destination.slice(1)), path: rewrite.source });
  for (let index = 0; index < publicFiles.length; index += 4) {
    const batch = await Promise.allSettled(publicFiles.slice(index, index + 4).map(async file => {
      const response = await context.request.get(origin + file.path, { timeout: 45000 });
      const bytes = await response.body();
      const headers = response.headers();
      const isBundle = file.file === packaged.bundle.file;
      const expected = isBundle ? { size: packaged.bundle.decodedSize, sha1: packaged.bundle.decodedSha1, sha256: packaged.bundle.decodedSha256 } : file;
      if (isBundle && (headers['content-encoding']?.toLowerCase().trim() !== 'br' || !/^application\/javascript(?:;|$)/i.test(headers['content-type'] ?? ''))) {
        throw new Error('Expected Brotli JavaScript response headers are missing: ' + file.path);
      }
      if (response.status() !== 200 || bytes.length !== expected.size || hash(bytes, 'sha1') !== expected.sha1 || hash(bytes, 'sha256') !== expected.sha256) {
        throw new Error('Published file differs from its package: ' + file.path);
      }
      if (headers['x-content-type-options']?.toLowerCase() !== 'nosniff' || !headers['x-robots-tag']?.toLowerCase().includes('noindex') || headers['referrer-policy']?.toLowerCase() !== 'no-referrer') {
        throw new Error('Expected preview response headers are missing: ' + file.path);
      }
      if (file.file.startsWith('review/brand/') && !headers['content-security-policy']?.includes("default-src 'none'")) {
        throw new Error('The isolated brand board must forbid scripts and external resources.');
      }
      return { path: file.path, status: response.status(), size: bytes.length, sha1: expected.sha1, sha256: expected.sha256,
        ...(isBundle ? { contentEncoding: 'br', packagedTransferSize: file.size, packagedTransferSha1: file.sha1, packagedTransferSha256: file.sha256 } : {}), contentType: headers['content-type'] };
    }));
    for (const result of batch) {
      if (result.status === 'rejected') throw result.reason;
      report.files.push(result.value);
    }
  }
}

(async () => {
  let share;
  try { share = new URL(process.env.JJ_PREVIEW_SHARE_URL || ''); }
  catch { throw new Error('JJ_PREVIEW_SHARE_URL must be a valid protected Vercel HTTPS URL.'); }
  if (share.protocol !== 'https:' || !share.hostname.endsWith('.vercel.app') || share.username || share.password || share.port) {
    throw new Error('Expected a Vercel HTTPS preview without URL user information or a custom port.');
  }
  const packaged = await readPackage();
  const origin = share.origin;
  const evidenceRoot = path.join(packaged.preview, '.vercel/hosted-evidence');
  await fs.mkdir(evidenceRoot, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const evidence = await fs.mkdtemp(path.join(evidenceRoot, 'run-' + stamp + '-'));
  const report = { schemaVersion: 1, origin, source: packaged.manifest.source, bundle: packaged.bundle,
    expectedLogoSha256: packaged.manifest.expectedLogoSha256,
    startedAt: new Date().toISOString(), status: 'running', viewport: { width: 390, height: 844 },
    method: 'Chromium mobile viewport; Node verifies HTTPS with the inherited proxy/CA, checks Brotli response headers and decoded hashes, and bridges decoded bodies with normalized transport headers. No persistent authentication state or trust-store changes. Not physical iPhone, native iOS, or Safari.',
    languageChecks: [], files: [], errors: [] };
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium',
      headless: true, args: ['--no-sandbox'], ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}) });
    for (const [code, spec] of Object.entries(locales)) {
      const context = await browser.newContext({ locale: spec.locale, viewport: report.viewport, isMobile: true, hasTouch: true,
        ignoreHTTPSErrors: false, storageState: { cookies: [], origins: [] } });
      const page = await context.newPage();
      page.setDefaultTimeout(25000);
      const errors = [];
      let bundleVerified = false;
      let logoVerified = false;
      page.on('pageerror', error => errors.push(safeMessage(error)));
      page.on('response', response => {
        if (response.status() >= 400 && new URL(response.url()).pathname !== '/favicon.ico') errors.push('HTTP ' + response.status() + ' ' + new URL(response.url()).pathname);
      });
      // Playwright's Node client trusts the configured CA. Chromium receives the
      // same verified bytes without weakening TLS or editing its persistent trust.
      await context.route('**/*', async route => {
        try {
          const response = await route.fetch({ timeout: 45000 });
          const pathname = new URL(route.request().url()).pathname;
          const bytes = await response.body();
          if (response.status() === 200 && (pathname === '/' + packaged.bundle.file || packaged.logos.some(logo => pathname === '/' + logo.file))) {
            const isBundle = pathname === '/' + packaged.bundle.file;
            const expected = isBundle ? packaged.bundle.decodedSha256 : packaged.manifest.expectedLogoSha256;
            const headers = response.headers();
            if (isBundle && (headers['content-encoding']?.toLowerCase().trim() !== 'br' || !/^application\/javascript(?:;|$)/i.test(headers['content-type'] ?? ''))) errors.push('Unexpected bundle transport headers: ' + pathname);
            if (isBundle && bytes.length !== packaged.bundle.decodedSize) errors.push('Unexpected decoded bundle size: ' + pathname);
            if (hash(bytes, 'sha256') !== expected) errors.push('Unexpected deployed asset hash: ' + pathname);
            else if (pathname === '/' + packaged.bundle.file) bundleVerified = true;
            else logoVerified = true;
          }
          // APIResponse.body() is already decoded. Do not ask Chromium to decode it again.
          const bridgedHeaders = { ...response.headers() };
          delete bridgedHeaders['content-encoding'];
          delete bridgedHeaders['content-length'];
          await route.fulfill({ response, headers: bridgedHeaders, body: bytes });
        } catch (error) { errors.push(safeMessage(error)); await route.abort().catch(() => {}); }
      });
      try {
        await page.goto(share.toString(), { waitUntil: 'networkidle', timeout: 60000 });
        await expect(page.getByTestId('welcome-title')).toHaveText(brand);
        await expect(page.getByTestId('welcome-title')).toBeVisible();
        await expect(page.getByRole('img', { name: brand, exact: true }).first()).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', code);
        if ((await snapshot(page)).some(value => value !== null)) throw new Error('Welcome unexpectedly created business documents.');
        const radio = page.getByTestId('language-' + code);
        if (!await radio.isVisible()) await page.getByTestId('welcome-language-toggle').click();
        await radio.click();
        await expect(radio).toHaveAttribute('aria-checked', 'true');
        await assertRenderedAssets(page);
        await page.screenshot({ path: path.join(evidence, code + '-welcome.png'), fullPage: true });
        await page.getByTestId('start-app').click();
        await expect(page.getByTestId('open-profile')).toBeVisible();
        await expect(page.getByRole('tab')).toHaveCount(4);
        for (const name of spec.tabs) await expect(page.getByRole('tab', { name, exact: true })).toBeVisible();
        await assertRenderedAssets(page);
        await page.screenshot({ path: path.join(evidence, code + '-home.png'), fullPage: true });

        await page.getByTestId('create-list').click();
        const form = page.getByTestId('app-sheet');
        await form.getByRole('textbox').first().fill('Prueba publicada ' + code);
        await form.getByTestId('save-list').click();
        await expect(form).toHaveCount(0);
        const before = await page.evaluate(key => localStorage.getItem(key), keys[0]);
        if (!before || !before.includes('Prueba publicada ' + code)) throw new Error('The list was not saved.');
        await page.getByTestId('tab-menus').click();
        await page.getByTestId('prepare-menu').click();
        await page.getByTestId('review-menu').click();
        const review = page.getByTestId('menu-sheet');
        await expect(review).toBeVisible();
        await assertRenderedAssets(page);
        await page.screenshot({ path: path.join(evidence, code + '-review.png'), fullPage: true });
        await review.getByRole('button', { name: spec.cancel, exact: true }).click();
        await review.getByRole('button', { name: spec.discard, exact: true }).click();
        await expect(review).toHaveCount(0);
        if (await page.evaluate(key => localStorage.getItem(key), keys[0]) !== before) throw new Error('Cancelling changed the shopping document.');
        await page.getByTestId('tab-home').click();
        await page.getByTestId('open-search').click();
        await expect(page.getByTestId('product-search-screen')).toBeVisible();
        await page.getByTestId('tab-home').click();
        await page.getByTestId('open-voice').click();
        await expect(page.getByTestId('voice-screen')).toBeVisible();
        await page.getByTestId('tab-home').click();
        await page.getByTestId('open-scanner').click();
        await expect(page.getByTestId('scanner-screen')).toBeVisible();
        await page.getByTestId('open-profile').click();
        await page.getByTestId('profile-stores').click();
        await page.getByTestId('favorite-hiperdino').click();
        await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null')?.preferences?.favoriteStores, keys[5])).toEqual(['hiperdino']);
        await page.getByTestId('stores-select-all').click();
        const pilotIds = ['lidl', 'aldi', 'hiperdino', 'superdino', 'hiperdino-express', 'mercadona'];
        await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null')?.preferences?.favoriteStores, keys[5])).toEqual(pilotIds);
        for (const id of pilotIds) await expect(page.getByTestId('favorite-' + id)).toHaveAttribute('aria-checked', 'true');
        await page.evaluate(() => {
          window.__hostedStoreOpens = [];
          window.open = (url, target, features) => { window.__hostedStoreOpens.push({ url: String(url), target, features }); return null; };
        });
        const beforeStoreLinks = await snapshot(page);
        for (const id of pilotIds) await page.getByTestId('store-open-' + id).click();
        const storeOpens = await page.evaluate(() => window.__hostedStoreOpens);
        if (storeOpens.length !== 6 || storeOpens.some(value => {
          const url = new URL(value.url);
          return url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || value.target !== '_blank' ||
            !value.features?.split(',').includes('noopener') || !value.features?.split(',').includes('noreferrer');
        }) || JSON.stringify(await snapshot(page)) !== JSON.stringify(beforeStoreLinks)) throw new Error('Store links changed data or used an unexpected navigation contract.');
        await page.getByTestId('tab-list').click();
        await page.getByTestId('add-item').click();
        const productEditor = page.getByTestId('app-sheet');
        await productEditor.getByRole('textbox').first().fill('QA producto compartido ' + code);
        await productEditor.getByRole('textbox').last().fill('QA_PRIVATE_NOTE_NOT_SHARED');
        await productEditor.getByTestId('save-item').click();
        await expect(productEditor).toHaveCount(0);
        const beforeSharing = await snapshot(page);
        const preferenceBeforeSharing = await page.evaluate(key => localStorage.getItem(key), preferenceKey);
        await page.getByTestId('share-list').click();
        const listShare = page.getByTestId('list-share-sheet');
        const reviewedText = await listShare.getByTestId('list-share-preview').innerText();
        if (!reviewedText.includes('QA producto compartido ' + code) || reviewedText.includes('QA_PRIVATE_NOTE_NOT_SHARED')) throw new Error('The shared copy has unexpected data.');
        const listDownloadEvent = page.waitForEvent('download');
        await listShare.getByTestId('list-share-download').click();
        const listDownload = await listDownloadEvent;
        if (listDownload.suggestedFilename() !== 'jj-shopping-list.txt' || await fs.readFile(await listDownload.path(), 'utf8') !== reviewedText) throw new Error('The text download differs from the reviewed copy.');
        await page.screenshot({ path: path.join(evidence, code + '-share.png'), fullPage: true });
        await listShare.getByTestId('list-share-close').click();
        await expect(listShare).toHaveCount(0);
        await expect(page.getByTestId('share-list')).toBeFocused();
        if (JSON.stringify(await snapshot(page)) !== JSON.stringify(beforeSharing) ||
            await page.evaluate(key => localStorage.getItem(key), preferenceKey) !== preferenceBeforeSharing) throw new Error('Sharing a copy changed saved documents.');
        await page.getByTestId('open-notifications').click();
        await expect(page.getByTestId('notifications-screen')).toBeVisible();
        await page.getByTestId('tab-savings').click();
        await page.getByTestId('open-budget-page').click();
        await page.getByTestId('record-expense').click();
        const expense = page.getByTestId('expense-editor');
        await expense.getByTestId('expense-amount').fill(code === 'en' ? '1.23' : '1,23');
        await expense.getByTestId('expense-store').fill('Comercio ficticio de prueba');
        await expense.getByTestId('expense-paid-confirmation').check();
        await expense.getByTestId('expense-review').click();
        await expense.getByTestId('expense-confirm-save').click();
        await expect(expense).toHaveCount(0);
        await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null')?.data?.expenses?.map(item => item.amountCents), keys[4])).toEqual([123]);
        await page.getByTestId('open-expense-history').click();
        await expect(page.getByTestId('expenses-period-total')).toBeVisible();
        await page.screenshot({ path: path.join(evidence, code + '-history.png'), fullPage: true });
        const beforeFilters = await snapshot(page);
        await page.getByTestId('tab-menus').click();
        if (expectedCatalogTotal || expectedCatalogRecipeId) {
          await page.getByTestId('menus-section-discover').click();
          if (expectedCatalogTotal) {
            const countText = await page.getByTestId('menu-catalog-count').innerText();
            expect(countText.match(/\d+/g)).toEqual([expectedCatalogTotal, expectedCatalogTotal]);
          }
          if (expectedCatalogRecipeId) await expect(page.getByTestId('menu-catalog-recipe-' + expectedCatalogRecipeId)).toBeVisible();
          await page.screenshot({ path: path.join(evidence, code + '-catalogue.png'), fullPage: true });
          await page.getByTestId('menus-section-week').click();
          if (JSON.stringify(await snapshot(page)) !== JSON.stringify(beforeFilters)) throw new Error('Browsing the imported catalogue changed saved documents.');
        }
        await page.getByTestId('menu-filters-open').click();
        const filters = page.getByTestId('menu-filter-sheet');
        await filters.getByTestId('menu-filter-time-20').click();
        await filters.getByTestId('menu-filters-apply').click();
        await expect(filters).toHaveCount(0);
        if (JSON.stringify(await snapshot(page)) !== JSON.stringify(beforeFilters)) throw new Error('Applying filters changed saved documents.');
        await page.getByTestId('open-profile').click();
        await page.getByTestId('profile-privacy').click();
        await expect(page.getByTestId('privacy-screen')).toBeVisible();
        const downloadEvent = page.waitForEvent('download');
        await page.getByTestId('privacy-export-all').click();
        const download = await downloadEvent;
        const backup = JSON.parse(await fs.readFile(await download.path(), 'utf8'));
        const expectedBackupKeys = [...keys, preferenceKey].sort();
        if (backup.format !== 'jj-local-backup' || backup.version !== 1 || backup.currency !== 'EUR' ||
          JSON.stringify(backup.documents.map(document => document.key).sort()) !== JSON.stringify(expectedBackupKeys)) throw new Error('The downloaded backup has unexpected scope or format.');
        const backupDocuments = new Map(backup.documents.map(document => [document.key, document.raw]));
        const beforeDeletion = await snapshot(page);
        for (let index = 0; index < keys.length; index++) if (backupDocuments.get(keys[index]) !== beforeDeletion[index]) throw new Error('A downloaded document differs from local storage.');
        if (backupDocuments.get(preferenceKey) !== await page.evaluate(key => localStorage.getItem(key), preferenceKey)) throw new Error('The downloaded preference document differs from local storage.');
        await page.getByTestId('privacy-delete-expenses').click();
        const deletion = page.getByTestId('privacy-delete-dialog');
        await deletion.getByTestId('privacy-delete-review-next').click();
        await expect(deletion.getByTestId('privacy-delete-confirm')).toBeDisabled();
        await deletion.getByTestId('privacy-delete-word').fill({ es: 'BORRAR', en: 'DELETE', de: 'LÖSCHEN', fr: 'EFFACER' }[code]);
        await deletion.getByTestId('privacy-delete-ack').check();
        await deletion.getByTestId('privacy-delete-confirm').click();
        await expect(deletion).toHaveCount(0);
        await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null')?.data?.expenses, keys[4])).toEqual([]);
        const afterDeletion = await snapshot(page);
        if (afterDeletion.some((value, index) => index !== 4 && value !== beforeDeletion[index])) throw new Error('Deleting expenses changed another category.');
        await assertRenderedAssets(page);
        const businessBefore = await snapshot(page);
        await page.getByTestId('open-profile').click();
        await page.getByTestId('language-settings').click();
        const next = Object.keys(locales)[(Object.keys(locales).indexOf(code) + 1) % 4];
        await page.getByTestId('language-' + next).click();
        await expect(page.locator('html')).toHaveAttribute('lang', next);
        await page.reload({ waitUntil: 'networkidle' });
        await expect(page.getByTestId('open-profile')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', next);
        if (JSON.stringify(await snapshot(page)) !== JSON.stringify(businessBefore)) throw new Error('Language change or reload changed business data.');
        const preference = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), preferenceKey);
        if (preference.language !== next || !preference.welcomeCompleted) throw new Error('Manual language preference was not retained.');
        if (!bundleVerified || !logoVerified || errors.length) throw new Error(JSON.stringify({ bundleVerified, logoVerified, errors }));
        if (code === 'es') {
          await verifyResources(context, origin, packaged, report);
          if (packaged.files.has('review/brand/index.html')) {
            await page.goto(origin + '/review/brand/index.html', { waitUntil: 'networkidle' });
            await expect(page.getByRole('heading', { name: 'El original, a cada escala.', exact: true })).toBeVisible();
            await expect.poll(() => page.evaluate(() => document.images.length === 11 && [...document.images].every(image => image.complete && image.naturalWidth === 936 && image.naturalHeight === 330))).toBe(true);
            if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('The isolated brand board overflows the viewport.');
          }
        }
        report.languageChecks.push({ language: code, manualPreferenceAfterReload: next, passed: true, bundleVerified, logoVerified,
          ...(expectedCatalogTotal || expectedCatalogRecipeId ? { catalogueCheck: { expectedTotal: expectedCatalogTotal, recipeId: expectedCatalogRecipeId, passed: true } } : {}),
          checks: ['Device language and official welcome logo', 'Four translated tabs', 'Loaded Manrope fonts and images',
            'Local list save', 'Recipe review and cancellation without shopping changes', 'Manual language preference persists after reload',
            'Six business documents preserved by language changes', 'Local search, voice, scanner and notification routes', 'Favourite store and confirmed expense save with both new durable fences on HTTPS', 'Six pilot stores persist with checkbox semantics', 'External destinations use noopener,noreferrer without saved-data changes; window.open is simulated', 'Reviewed plain-text list download excludes private notes and changes no documents', 'Closing list sharing restores keyboard focus', 'Session menu filters preserve saved documents', 'Downloaded backup contains exactly seven allowed documents', 'Confirmed category deletion preserves the other stores', 'Exact packaged bundle, logo, fonts, and resource hashes; optional isolated brand board'] });
        console.log(JSON.stringify({ language: code, status: 'passed' }));
      } catch (error) {
        await page.screenshot({ path: path.join(evidence, code + '-failure.png'), fullPage: true }).catch(() => {});
        throw error;
      } finally { await context.close(); }
    }
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed';
    report.errors.push(safeMessage(error));
    throw error;
  } finally {
    report.finishedAt = new Date().toISOString();
    if (browser) await browser.close();
    await fs.writeFile(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify({ status: report.status, evidence, languages: report.languageChecks.length, verifiedFiles: report.files.length }));
  }
})().catch(error => { console.error(safeMessage(error)); process.exitCode = 1; });
