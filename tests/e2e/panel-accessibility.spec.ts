import { expect, test, type Locator, type Page } from '@playwright/test';
import { createTranslator } from '../../src/i18n/core';
import { resources } from '../../src/i18n/resources';
import type { Language } from '../../src/i18n/types';

const shoppingKey = 'jjcompraintelwgiemt.shopping.v1';
const preferencesKey = 'jjcompraintelwgiemt.preferences.v1';
const businessKeys = [shoppingKey, 'jjcompraintelwgiemt.menus.v1',
  'jjcompraintelwgiemt.comparisons.v1', 'jjcompraintelwgiemt.price-observations.v1',
  'jjcompraintelwgiemt.expenses.v1', 'jjcompraintelwgiemt.local-settings.v1'];
const languages: Language[] = ['es', 'en', 'de', 'fr'];
type OriginalTextSize = { fontSize: number; lineHeight: number };
type TextFixtureWindow = Window & {
  qaOriginalTextSizes?: WeakMap<HTMLElement, OriginalTextSize>;
  qaTextZoomRoots?: WeakSet<Element>;
  qaTextZoomObservers?: MutationObserver[];
};

test.afterEach(async ({ page }) => {
  // The stress fixture belongs only to this isolated page, never the app.
  await page.evaluate(() => {
    const fixture = window as TextFixtureWindow;
    fixture.qaTextZoomObservers?.forEach(observer => observer.disconnect());
    fixture.qaTextZoomObservers = [];
  });
});

async function seed(page: Page, language: Language = 'es') {
  await page.goto('/');
  await expect(page.getByTestId('open-profile')).toBeVisible();
  await page.evaluate(({ shoppingKey, preferencesKey, language }) => {
    localStorage.setItem(preferencesKey, JSON.stringify({ version: 1, language, welcomeCompleted: true }));
    localStorage.setItem(shoppingKey, JSON.stringify({ version: 1, state: {
      activeListId: 'keyboard-list', lists: [{ id: 'keyboard-list', name: 'Lista aislada QA', budgetCents: 6000, items: [] }],
    } }));
  }, { shoppingKey, preferencesKey, language });
  await page.reload();
  await expect(page.getByTestId('open-profile')).toBeVisible();
}

async function snapshot(page: Page) {
  return page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), businessKeys);
}

async function expectFocusInside(dialog: Locator) {
  await expect.poll(() => dialog.evaluate(element => element.contains(document.activeElement))).toBe(true);
}

for (const language of languages) {
  test(`panel de filtros: foco interior, ciclo de teclado, Escape y fondo táctil (${language})`, async ({ page }, testInfo) => {
    const t = createTranslator(language, resources);
    await seed(page, language);
    const before = await snapshot(page);
    await page.getByTestId('tab-menus').click();
    const trigger = page.getByTestId('menu-filters-open');
    await trigger.click();
    const dialog = page.getByTestId('menu-filter-sheet');
    await expect(dialog).toHaveRole('dialog');
    await expect(dialog).toHaveAccessibleName(t('menuFilters.title'));
    await expectFocusInside(dialog);
    await page.screenshot({ path: testInfo.outputPath(`filters-${language}.png`), fullPage: true });
    // Outside tapping remains available, but the scrim is not a second close
    // button announced before the labelled dialog or a keyboard destination.
    await expect(page.getByRole('button', { name: t('common.closePanel'), exact: true })).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: t('common.close'), exact: true })).toBeVisible();
    const cancel = dialog.getByRole('button', { name: t('menuFilters.cancel'), exact: true });
    await cancel.focus();
    await page.keyboard.press('Tab');
    await expectFocusInside(dialog);
    await expect(cancel).not.toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expectFocusInside(dialog);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await snapshot(page)).toEqual(before);

    await trigger.click();
    await expect(dialog).toBeVisible();
    const bounds = await dialog.boundingBox();
    expect(bounds).not.toBeNull();
    // This is an actual pointer gesture on the uncovered area, not invocation
    // of an internal callback, so a nonfocusable scrim must still dismiss it.
    expect(bounds!.y).toBeGreaterThan(8);
    if (testInfo.project.use.hasTouch) await page.touchscreen.tap(4, Math.max(4, bounds!.y / 2));
    else await page.mouse.click(4, Math.max(4, bounds!.y / 2));
    await expect(dialog).toHaveCount(0);
    expect(await snapshot(page)).toEqual(before);
  });

  test(`Escape de un borrador conserva datos y enfoca la revisión sin descartar (${language})`, async ({ page }, testInfo) => {
    const t = createTranslator(language, resources);
    await seed(page, language);
    const before = await snapshot(page);
    await page.getByTestId('tab-list').click();
    const trigger = page.getByTestId('add-item');
    await trigger.click();
    const dialog = page.getByTestId('app-sheet');
    const name = dialog.getByRole('textbox', { name: t('app.fieldItemName'), exact: true });
    const draftName = 'Borrador Ä — crème / ñ';
    await name.fill(draftName);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveAccessibleName(t('app.discardTitle'));
    await expectFocusInside(dialog);
    const discard = dialog.getByRole('button', { name: t('app.discardChanges'), exact: true });
    await expect(discard).not.toBeFocused();
    await page.screenshot({ path: testInfo.outputPath(`discard-${language}.png`), fullPage: true });
    expect(await snapshot(page)).toEqual(before);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveAccessibleName(t('app.discardTitle'));
    expect(await snapshot(page)).toEqual(before);
    await dialog.getByRole('button', { name: t('app.keepEditing'), exact: true }).click();
    await expect(name).toHaveValue(draftName);
    await expect(name).toBeFocused();
    await page.keyboard.press('Escape');
    await expectFocusInside(dialog);
    await discard.click();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await snapshot(page)).toEqual(before);
  });
}

test('Escape y toque exterior no cierran ni pierden un guardado pendiente bajo Web Lock', async ({ page }, testInfo) => {
  await seed(page);
  await page.getByTestId('tab-list').click();
  await page.getByTestId('add-item').click();
  const dialog = page.getByTestId('app-sheet');
  await dialog.getByRole('textbox', { name: 'Nombre del producto', exact: true }).fill('Producto pendiente QA');
  const before = await snapshot(page);
  const lockName = `jjcompra:storage:${shoppingKey}`;
  await page.evaluate(async lockName => {
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    (window as unknown as { releaseKeyboardLock: () => void }).releaseKeyboardLock = release;
    await new Promise<void>(resolve => {
      void navigator.locks.request(lockName, async () => { resolve(); await held; });
    });
  }, lockName);
  try {
    await dialog.getByTestId('save-item').click();
    await expect.poll(() => page.evaluate(async lockName =>
      (await navigator.locks.query()).pending?.filter(lock => lock.name === lockName).length ?? 0, lockName)).toBe(1);
    await expect(dialog.getByTestId('save-item')).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: 'Nombre del producto', exact: true })).toHaveValue('Producto pendiente QA');
    const bounds = await dialog.boundingBox();
    expect(bounds).not.toBeNull();
    if (testInfo.project.use.hasTouch) await page.touchscreen.tap(4, Math.max(4, bounds!.y / 2));
    else await page.mouse.click(4, Math.max(4, bounds!.y / 2));
    await expect(dialog).toBeVisible();
    expect(await snapshot(page)).toEqual(before);
  } finally {
    await page.evaluate(() => (window as unknown as { releaseKeyboardLock: () => void }).releaseKeyboardLock());
  }
  await expect(dialog).toHaveCount(0);
  await expect.poll(async () => {
    const stored = JSON.parse((await page.evaluate(key => localStorage.getItem(key), shoppingKey))!);
    return stored.state.lists[0].items.map((item: { name: string }) => item.name);
  }).toEqual(['Producto pendiente QA']);
});

/** CSS-only stress fixture. This does not exercise iOS Dynamic Type or an OS keyboard. */
async function doubleVisibleText(dialog: Locator) {
  await dialog.evaluate(root => {
    const fixture = window as TextFixtureWindow;
    const original = fixture.qaOriginalTextSizes ??= new WeakMap<HTMLElement, OriginalTextSize>();
    const roots = fixture.qaTextZoomRoots ??= new WeakSet<Element>();
    const refresh = () => {
      if (!root.isConnected) return;
      const elements = [root, ...root.querySelectorAll('*')].filter((element): element is HTMLElement =>
        element instanceof HTMLElement && (element.matches('input, textarea') ||
          Array.from(element.childNodes).some(node => node.nodeType === Node.TEXT_NODE && !!node.textContent?.trim())));
      // Read before writing so inherited fonts are not doubled twice. New nodes
      // receive the same fixture after a responsive layout reuses/remounts them.
      const sizes = elements.map(element => {
        let size = original.get(element);
        if (!size) {
          const style = getComputedStyle(element);
          size = { fontSize: parseFloat(style.fontSize), lineHeight: parseFloat(style.lineHeight) };
          original.set(element, size);
        }
        return { element, ...size };
      });
      for (const { element, fontSize, lineHeight } of sizes) {
        const doubledFont = `${fontSize * 2}px`;
        const doubledLine = `${lineHeight * 2}px`;
        // Compare before writing: the observer's own style mutations must settle.
        if (element.style.fontSize !== doubledFont) element.style.fontSize = doubledFont;
        if (Number.isFinite(lineHeight) && element.style.lineHeight !== doubledLine) element.style.lineHeight = doubledLine;
      }
    };
    refresh();
    if (!roots.has(root)) {
      const observer = new MutationObserver(refresh);
      observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
      (fixture.qaTextZoomObservers ??= []).push(observer);
      roots.add(root);
    }
  });
  // Let ResizeObserver/onLayout and the responsive branch consume the text
  // change; the fixture observer then scales any nodes remounted by that branch.
  await dialog.evaluate(() => new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

async function expectDoubledText(locator: Locator) {
  await expect.poll(() => locator.evaluate(root => {
    const original = (window as TextFixtureWindow).qaOriginalTextSizes;
    const text = [root, ...root.querySelectorAll('*')].find((element): element is HTMLElement =>
      element instanceof HTMLElement && !!original?.has(element));
    if (!text || !original) return false;
    return Math.abs(parseFloat(getComputedStyle(text).fontSize) - original.get(text)!.fontSize * 2) < 0.1;
  })).toBe(true);
}

async function expectNoHorizontalOverflow(page: Page, dialog: Locator) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
}

for (const language of languages) test(`320×568 y texto CSS al 200%: campos, filtros y confirmación siguen accesibles (${language})`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const t = createTranslator(language, resources);
  await seed(page, language);
  const before = await snapshot(page);
  await page.getByTestId('tab-list').click();
  await page.getByTestId('add-item').click();
  const editor = page.getByTestId('app-sheet');
  await doubleVisibleText(editor);
  await expectNoHorizontalOverflow(page, editor);
  await page.screenshot({ path: testInfo.outputPath('small-css200-editor.png'), fullPage: true });
  const name = editor.getByRole('textbox', { name: t('app.fieldItemName'), exact: true });
  await name.fill('Borrador aislado QA · Ä / crème / ñ');
  const quantity = editor.getByRole('textbox', { name: t('app.fieldQuantity'), exact: true });
  await expectDoubledText(quantity);
  await quantity.scrollIntoViewIfNeeded();
  await expect(quantity).toBeInViewport({ ratio: 0.9 });
  await quantity.click();
  await expect(quantity).toBeFocused();
  await expect(quantity).toHaveAccessibleDescription(/.+/);
  await page.keyboard.press('Escape');
  await expect(editor).toHaveAccessibleName(t('app.discardTitle'));
  await doubleVisibleText(editor);
  await expectNoHorizontalOverflow(page, editor);
  await expectFocusInside(editor);
  await page.screenshot({ path: testInfo.outputPath('small-css200-discard.png'), fullPage: true });
  const discard = editor.getByRole('button', { name: t('app.discardChanges'), exact: true });
  await discard.scrollIntoViewIfNeeded();
  await discard.click();
  await expect(editor).toHaveCount(0);

  await page.getByTestId('tab-menus').click();
  await page.getByTestId('menu-filters-open').click();
  const filters = page.getByTestId('menu-filter-sheet');
  await doubleVisibleText(filters);
  await expectNoHorizontalOverflow(page, filters);
  await page.screenshot({ path: testInfo.outputPath('small-css200-filters.png'), fullPage: true });
  const exclusion = filters.getByTestId('menu-filter-exclude-zanahoria');
  await expectDoubledText(exclusion);
  await exclusion.scrollIntoViewIfNeeded();
  await expect(exclusion).toBeInViewport({ ratio: 0.9 });
  await exclusion.click();
  await expect(exclusion).toHaveAttribute('aria-checked', 'true');
  await filters.getByRole('button', { name: t('menuFilters.cancel'), exact: true }).click();
  await expect(filters).toHaveCount(0);

  await page.getByTestId('open-profile').click();
  await page.getByTestId('profile-privacy').click();
  await page.getByTestId('privacy-delete-shopping').click();
  const privacy = page.getByTestId('privacy-delete-dialog');
  await privacy.getByTestId('privacy-delete-review-next').click();
  await expectFocusInside(privacy);
  await expect(privacy.getByTestId('privacy-delete-confirm')).not.toBeFocused();
  await doubleVisibleText(privacy);
  await expectNoHorizontalOverflow(page, privacy);
  const word = privacy.getByTestId('privacy-delete-word');
  await expectDoubledText(word);
  await word.scrollIntoViewIfNeeded();
  await expect(word).toBeInViewport({ ratio: 0.9 });
  await word.click();
  await expect(word).toBeFocused();
  await expect(word).toHaveAccessibleDescription(t('privacy.wordHint'));
  await page.screenshot({ path: testInfo.outputPath('small-css200-privacy.png'), fullPage: true });
  await expect(privacy.getByTestId('privacy-delete-confirm')).toBeDisabled();
  await privacy.getByTestId('privacy-delete-cancel').click();
  await expect(privacy).toHaveCount(0);
  expect(await snapshot(page)).toEqual(before);
});
