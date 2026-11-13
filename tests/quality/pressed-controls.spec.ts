import { expect, test, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { createTranslator } from '../../src/i18n/core';
import { resources } from '../../src/i18n/resources';
import { LANGUAGES, type Language } from '../../src/i18n/types';
import { auditContrastAndTargets } from './contrast';

const languages: Language[] = ['es', 'en', 'de', 'fr'];
const sizes = [{ width: 375, height: 754 }, { width: 430, height: 932 }];
const names = ['shopping', 'menus', 'comparisons', 'price-observations', 'expenses', 'local-settings', 'preferences'];
const keys = names.map(name => 'jjcompraintelwgiemt.' + name + '.v1');
const snapshot = (page: Page) => page.evaluate(names => names.map(name => localStorage.getItem(name)), keys);

for (const language of languages) for (const viewport of sizes) test(`${language} ${viewport.width}: held pointer preserves readable controls and saved documents`, async ({ browser }, info) => {
  const context = await browser.newContext({ baseURL: process.env.QUALITY_BASE_URL ?? 'http://127.0.0.1:8088',
    locale: LANGUAGES[language].locale, viewport, isMobile: true, hasTouch: true, storageState: { cookies: [], origins: [] } });
  await context.route('**/favicon.ico', route => route.fulfill({ status: 204, body: '' }));
  const page = await context.newPage(), t = createTranslator(language, resources);
  const checks: object[] = [];
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const hold = async (kind: string, target: Locator, icon = false) => {
    await expect(target).toBeEnabled(); await target.scrollIntoViewIfNeeded();
    const before = await snapshot(page), bounds = await target.boundingBox(); expect(bounds).not.toBeNull();
    await page.mouse.move(bounds!.x + bounds!.width / 2, bounds!.y + bounds!.height / 2);
    await page.mouse.down();
    try {
      // Sustain an actual press long enough for Pressable's interaction state,
      // rather than sampling the resting frame immediately after pointerdown.
      await page.waitForTimeout(150);
      await expect.poll(() => target.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
      const paint = await target.evaluate(element => {
        const node = element.querySelector('div') ?? element;
        const shape = element.querySelector('svg path,svg line,svg circle');
        return { opacity: getComputedStyle(element).opacity, background: getComputedStyle(element).backgroundColor,
          foreground: getComputedStyle(node).color, stroke: shape ? getComputedStyle(shape).stroke : null };
      });
      const audit = await auditContrastAndTargets(page, { includePassingSamples: true });
      const record = { kind, paint, textFailureCount: audit.textFailures.length, iconFailureCount: audit.iconFailures.length,
        unresolvedCount: audit.unsupported.length, disabledExemptions: audit.exemptions.disabled };
      checks.push(record);
      await page.screenshot({ path: info.outputPath(`${language}-${kind}-held.png`), animations: 'disabled' });
      expect(paint.opacity, `${kind}: pressed opacity must preserve foreground/background contrast`).toBe('1');
      expect(audit.textFailures, `${kind}: all active mounted text remains readable while pointer is held`).toEqual([]);
      expect(audit.iconFailures, `${kind}: active icon-only controls remain discernible`).toEqual([]);
      expect(audit.unsupported, `${kind}: solid opaque control paint must be measured, not assumed`).toEqual([]);
      if (icon) expect(audit.iconsChecked).toBeGreaterThan(0);
    } finally {
      // Leaving the press area before releasing cancels the action. No click is
      // dispatched to pretend that an unchanged document proves a saved action.
      await page.mouse.move(0, 0); await page.mouse.up();
    }
    expect(await snapshot(page), `${kind}: holding/cancelling a pointer must not write business documents`).toEqual(before);
  };
  try {
    await page.goto('/');
    await expect(page.getByTestId('welcome-title')).toBeVisible();
    await hold('accent', page.getByTestId('start-app'));
    await expect(page.getByTestId('welcome-title')).toBeVisible();
    await page.getByTestId('start-app').click();
    await page.getByTestId('tab-menus').click();
    await hold('primary', page.getByTestId('prepare-menu'));
    await expect(page.getByTestId('prepare-menu')).toBeVisible();
    await hold('icon', page.getByRole('button', { name: t('menus.reducePeople'), exact: true }), true);
    await expect(page.getByTestId('menu-servings')).toHaveText('2');
    await page.getByTestId('prepare-menu').click();
    await expect(page.getByTestId('review-menu')).toBeVisible();
    await hold('secondary', page.getByTestId('menu-new-proposal'));
    await expect(page.getByTestId('menu-plan-proposal-sheet')).toHaveCount(0);
    await page.getByTestId('tab-home').click();
    await page.getByTestId('create-list').click();
    const sheet = page.getByTestId('app-sheet');
    await sheet.getByRole('textbox', { name: t('app.fieldListName'), exact: true }).fill('QA held-pointer list');
    await sheet.getByTestId('save-list').click(); await expect(sheet).toHaveCount(0);
    await page.getByTestId('tab-list').click(); await page.getByTestId('add-item').click();
    await sheet.getByRole('textbox', { name: t('app.fieldItemName'), exact: true }).fill('QA held-pointer item');
    await sheet.getByTestId('save-item').click(); await expect(sheet).toHaveCount(0);
    await page.getByTestId('open-profile').click(); await page.getByTestId('profile-privacy').click();
    await expect(page.getByTestId('privacy-export-all')).toBeEnabled();
    await hold('danger', page.getByTestId('privacy-delete-shopping'));
    await expect(page.getByTestId('privacy-delete-dialog')).toHaveCount(0);
    expect(errors).toEqual([]); expect(checks).toHaveLength(5);
  } finally {
    await fs.writeFile(info.outputPath(`${language}-pressed-controls.json`), JSON.stringify({ language, viewport,
      method: 'Held-pointer Chromium CSS test; actions cancelled before release; business state created through UI in empty context.',
      physicalDevice: false, checks, errors }, null, 2) + '\n');
    await context.close();
  }
});

test('shared controls retain visible keyboard focus after pointer paint corrections', async ({ browser }, info) => {
  const context = await browser.newContext({ locale: 'es-ES', viewport: sizes[0], isMobile: true, hasTouch: true,
    storageState: { cookies: [], origins: [] } });
  await context.route('**/favicon.ico', route => route.fulfill({ status: 204, body: '' }));
  const page = await context.newPage();
  const checks: object[] = [];
  const focusByKeyboard = async (kind: string, target: Locator) => {
    const before = await snapshot(page);
    let found = false;
    for (let index = 0; index < 100; index++) {
      await page.keyboard.press('Tab');
      if (await target.evaluate(element => element === document.activeElement)) { found = true; break; }
    }
    expect(found, kind + ': keyboard Tab can reach the control').toBe(true);
    const focus = await target.evaluate(element => {
      const style = getComputedStyle(element);
      return { focusVisible: element.matches(':focus-visible'), outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth, outlineColor: style.outlineColor, opacity: style.opacity };
    });
    checks.push({ kind, focus });
    expect(focus.focusVisible).toBe(true);
    expect(focus.outlineStyle).not.toBe('none');
    expect(Number.parseFloat(focus.outlineWidth)).toBeGreaterThan(0);
    expect(focus.opacity).toBe('1');
    expect(await snapshot(page)).toEqual(before);
    await page.screenshot({ path: info.outputPath(kind + '-keyboard-focus.png'), animations: 'disabled' });
  };
  try {
    await page.goto(process.env.QUALITY_BASE_URL ?? 'http://127.0.0.1:8088');
    await focusByKeyboard('button', page.getByTestId('start-app'));
    await page.getByTestId('start-app').click(); await page.getByTestId('tab-menus').click();
    await focusByKeyboard('icon', page.getByRole('button', { name: createTranslator('es', resources)('menus.reducePeople'), exact: true }));
    await page.getByTestId('open-notifications').click();
    await focusByKeyboard('switch', page.getByTestId('in-app-reminders').getByRole('switch'));
  } finally {
    await fs.writeFile(info.outputPath('keyboard-focus.json'), JSON.stringify({ method: 'Real Tab traversal, no programmatic focus; Chromium CSS, not native accessibility certification.', checks }, null, 2) + '\n');
    await context.close();
  }
});
