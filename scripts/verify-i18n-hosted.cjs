const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const locales = {
  es: { locale: 'es-ES', title: 'Tu compra,\na tu manera.', tabs: ['Inicio', 'Mi compra', 'Ahorro', 'Menús'], cancel: 'Cancelar propuesta', discard: 'Cancelar sin añadir' },
  en: { locale: 'en-GB', title: 'Your shopping,\nyour way.', tabs: ['Home', 'My shopping', 'Savings', 'Menus'], cancel: 'Cancel proposal', discard: 'Cancel without adding' },
  de: { locale: 'de-DE', title: 'Dein Einkauf,\nauf deine Art.', tabs: ['Start', 'Einkauf', 'Sparen', 'Menüs'], cancel: 'Vorschlag abbrechen', discard: 'Ohne Hinzufügen abbrechen' },
  fr: { locale: 'fr-FR', title: 'Vos courses,\nà votre façon.', tabs: ['Accueil', 'Mes courses', 'Économies', 'Menus'], cancel: 'Annuler la proposition', discard: 'Annuler sans ajouter' },
};
const keys = ['jjcompraintelwgiemt.shopping.v1', 'jjcompraintelwgiemt.menus.v1',
  'jjcompraintelwgiemt.comparisons.v1', 'jjcompraintelwgiemt.price-observations.v1'];
const prefKey = 'jjcompraintelwgiemt.preferences.v1';
const snapshot = page => page.evaluate(keys => keys.map(key => localStorage.getItem(key)), keys);
const sha = bytes => crypto.createHash('sha1').update(bytes).digest('hex');

(async () => {
  const share = new URL(process.env.JJ_PREVIEW_SHARE_URL || '');
  if (share.protocol !== 'https:' || !share.hostname.endsWith('.vercel.app')) throw new Error('Expected a protected Vercel HTTPS preview.');
  const origin = share.origin;
  const root = path.resolve(__dirname, '..');
  const preview = path.join(root, 'previews/i18n-web');
  const evidenceRoot = path.join(preview, '.vercel/hosted-evidence');
  await fs.mkdir(evidenceRoot, { recursive: true });
  const evidence = await fs.mkdtemp(path.join(evidenceRoot, 'run-'));
  const files = JSON.parse(await fs.readFile(path.join(preview, '.vercel/files.json'), 'utf8'));
  const config = JSON.parse(await fs.readFile(path.join(preview, 'vercel.json'), 'utf8'));
  const bundle = files.find(file => file.file.endsWith('.js'));
  const expectedSha256 = 'daac04335e9c233edfc3a020c77ed547bced49b0a8613db4e6bdefa5a6e19348';
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium',
    headless: true, args: ['--no-sandbox'],
    ...(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}),
  });
  const report = { origin, startedAt: new Date().toISOString(), status: 'running', viewport: { width: 390, height: 844 },
    method: 'Chromium mobile viewport; HTTPS requests use Playwright Node client and configured CA with TLS verification enabled. No browser trust-store change or physical-iPhone claim.',
    languageChecks: [], files: [], errors: [] };
  try {
    for (const [code, spec] of Object.entries(locales)) {
      const context = await browser.newContext({ locale: spec.locale, viewport: report.viewport, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      page.setDefaultTimeout(25000);
      const errors = [];
      let bundleVerified = false;
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => { if (r.status() >= 400 && new URL(r.url()).pathname !== '/favicon.ico') errors.push('HTTP ' + r.status() + ' ' + new URL(r.url()).pathname); });
      // Node trusts the configured environment CA; Chromium receives the same
      // verified response without weakening TLS or modifying persistent trust.
      await context.route('**/*', async route => {
        const response = await route.fetch({ timeout: 45000 });
        if (new URL(route.request().url()).pathname === '/' + bundle.file && response.status() === 200) {
          const body = await response.body();
          if (crypto.createHash('sha256').update(body).digest('hex') !== expectedSha256) errors.push('Unexpected deployed bundle hash');
          else bundleVerified = true;
        }
        await route.fulfill({ response });
      });
      try {
        await page.goto(share.toString(), { waitUntil: 'networkidle', timeout: 60000 });
        await expect(page.getByRole('heading', { name: spec.title, exact: true })).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', code);
        await page.getByTestId('language-' + code).click();
        await expect(page.getByTestId('language-' + code)).toHaveAttribute('aria-checked', 'true');
        await page.screenshot({ path: path.join(evidence, code + '-welcome.png'), fullPage: true });
        await page.getByTestId('start-app').click();
        await expect(page.getByTestId('open-profile')).toBeVisible();
        await expect(page.getByRole('tab')).toHaveCount(4);
        for (const name of spec.tabs) await expect(page.getByRole('tab', { name, exact: true })).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Horizontal overflow');
        await page.screenshot({ path: path.join(evidence, code + '-home.png'), fullPage: true });

        await page.getByTestId('create-list').click();
        const form = page.getByTestId('app-sheet');
        await form.getByRole('textbox').first().fill('Prueba publicada ' + code);
        await form.getByTestId('save-list').click();
        await expect(form).toHaveCount(0);
        const before = await page.evaluate(key => localStorage.getItem(key), keys[0]);
        if (!before || !before.includes('Prueba publicada ' + code)) throw new Error('List was not saved');
        await page.getByTestId('tab-menus').click();
        await page.getByTestId('prepare-menu').click();
        await page.getByTestId('review-menu').click();
        const review = page.getByTestId('menu-sheet');
        await expect(review).toBeVisible();
        await page.screenshot({ path: path.join(evidence, code + '-review.png'), fullPage: true });
        await review.getByRole('button', { name: spec.cancel, exact: true }).click();
        await review.getByRole('button', { name: spec.discard, exact: true }).click();
        await expect(review).toHaveCount(0);
        if (await page.evaluate(key => localStorage.getItem(key), keys[0]) !== before) throw new Error('Cancelling changed the shopping document');
        const businessBefore = await snapshot(page);
        await page.getByTestId('open-profile').click();
        await page.getByTestId('language-settings').click();
        const next = Object.keys(locales)[(Object.keys(locales).indexOf(code) + 1) % 4];
        await page.getByTestId('language-' + next).click();
        await expect(page.locator('html')).toHaveAttribute('lang', next);
        await page.reload({ waitUntil: 'networkidle' });
        await expect(page.getByTestId('open-profile')).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', next);
        if (JSON.stringify(await snapshot(page)) !== JSON.stringify(businessBefore)) throw new Error('Language change or reload changed business data');
        const pref = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), prefKey);
        if (pref.language !== next || !pref.welcomeCompleted) throw new Error('Manual preference was not retained');
        if (!bundleVerified || errors.length) throw new Error(JSON.stringify({ bundleVerified, errors }));

        if (code === 'es') {
          const publicFiles = files.filter(file => file.file !== 'vercel.json').map(file => ({ ...file, path: '/' + file.file }));
          for (const rewrite of config.rewrites) {
            const dest = files.find(file => '/' + file.file === rewrite.destination);
            if (!dest) throw new Error('Missing rewrite destination');
            publicFiles.push({ ...dest, path: rewrite.source });
          }
          for (let i = 0; i < publicFiles.length; i += 4) {
            const batch = await Promise.allSettled(publicFiles.slice(i, i + 4).map(async file => {
              const response = await context.request.get(origin + file.path, { timeout: 45000 });
              const bytes = await response.body();
              if (response.status() !== 200 || bytes.length !== file.size || sha(bytes) !== file.sha) throw new Error('Published file differs: ' + file.path);
              return { path: file.path, status: response.status(), size: bytes.length, sha1: file.sha, contentType: response.headers()['content-type'] };
            }));
            for (const item of batch) {
              if (item.status === 'rejected') throw item.reason;
              report.files.push(item.value);
            }
          }
        }
        report.languageChecks.push({ language: code, manualPreferenceAfterReload: next, passed: true, checks: [
          'Device language and welcome', 'Four translated tabs', 'Local list save with secure coordination',
          'Recipe review and cancellation without shopping changes', 'Profile language preference persists over device language and reload', 'Business documents unchanged by language change', 'Exact audited bundle and font resources',
        ] });
        console.log(JSON.stringify({ language: code, status: 'passed' }));
      } catch (error) {
        await page.screenshot({ path: path.join(evidence, code + '-failure.png'), fullPage: true }).catch(() => {});
        throw error;
      } finally { await context.close(); }
    }
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed';
    report.errors.push(error.message.replace(/([?&]_vercel_share=)[^&\s]+/g, '$1[redacted]'));
    throw error;
  } finally {
    report.finishedAt = new Date().toISOString();
    await fs.writeFile(path.join(evidence, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    await browser.close();
    console.log(JSON.stringify({ status: report.status, evidence, languages: report.languageChecks.length, verifiedFiles: report.files.length }));
  }
})().catch(error => { console.error(error.message.replace(/([?&]_vercel_share=)[^&\s]+/g, '$1[redacted]')); process.exitCode = 1; });

