/// <reference types="node" />
import { expect, test, type Locator } from '@playwright/test';
import { LANGUAGES, type Language } from '../../src/i18n/types';

const businessKeys = [
  'shopping.v1', 'menus.v1', 'preferences.v1', 'local-settings.v1',
  'expenses.v1', 'comparisons.v1', 'price-observations.v1',
].map(suffix => 'jjcompraintelwgiemt.' + suffix);
const preferenceKey = 'jjcompraintelwgiemt.preferences.v1';

function normalized(value: string) {
  return value.normalize('NFKC').replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}

/** Measure the painted label, not just the surrounding interactive rectangle. */
async function entryMetrics(entry: Locator) {
  return entry.evaluate(button => {
    const box = button.getBoundingClientRect(), viewportWidth = document.documentElement.clientWidth;
    const walker = document.createTreeWalker(button, NodeFilter.SHOW_TEXT);
    const rects: { top: number; bottom: number; left: number; right: number }[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (!node.textContent?.trim()) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.width > 0 && rect.height > 0) rects.push({ top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right });
      }
    }
    return {
      width: box.width, height: box.height, top: box.top, bottom: box.bottom, left: box.left, right: box.right,
      viewportWidth, viewportHeight: window.innerHeight,
      visibleLabel: (button as HTMLElement).innerText.trim(),
      accessibleLabel: button.getAttribute('aria-label') ?? '',
      labelLineCount: new Set(rects.map(rect => Math.round(rect.top * 10) / 10)).size,
      clipping: rects.filter(rect => rect.left < box.left - 1 || rect.right > box.right + 1 ||
        rect.top < box.top - 1 || rect.bottom > box.bottom + 1),
    };
  });
}

for (const language of ['es', 'en', 'de', 'fr'] as const) test.describe(language, () => {
  test.use({ locale: LANGUAGES[language].locale });

  test('home purchase entries share height and keep readable labels and the small-screen list action visible', async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    // This URL can contain a private temporary credential. Never include it in
    // reports, screenshots, traces or custom evidence fields.
    await page.goto(process.env.JJ_JOURNEY_SHARE_URL ?? '/');
    await expect(page.getByTestId('welcome-title')).toBeVisible();
    const snapshot = () => page.evaluate(names => Object.fromEntries(names.map(name => [name, localStorage.getItem(name)])), businessKeys);
    expect(Object.values(await snapshot())).toEqual(Array(businessKeys.length).fill(null));
    await page.getByTestId('welcome-language-toggle').click();
    await page.getByTestId('language-' + language).click();
    await page.getByTestId('start-app').click();
    await expect(page.getByTestId('start-with-recipes')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', language);
    const before = await snapshot();
    expect(JSON.parse(before[preferenceKey]!)).toMatchObject({ version: 1, language, welcomeCompleted: true });
    for (const key of businessKeys.filter(key => key !== preferenceKey)) expect(before[key]).toBeNull();

    // Chromium tests responsive reflow in one case; each WebKit project uses
    // its configured mobile viewport and scale. This gives 20 logical scenes.
    const viewports = info.project.name === 'chromium-desktop' ? [
      { width: 375, height: 812 }, { width: 430, height: 932 }, { width: 1280, height: 1000 },
    ] : [page.viewportSize()!];
    const scenes: Record<string, unknown>[] = [];
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => document.fonts.ready);
      const recipes = page.getByTestId('start-with-recipes'), budget = page.getByTestId('start-with-budget');
      await expect(recipes).toBeVisible(); await expect(budget).toBeVisible();
      // Two animation frames let useWindowDimensions apply a genuine resize.
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
      const metrics = await Promise.all([entryMetrics(recipes), entryMetrics(budget)]);
      expect(Math.abs(metrics[0].height - metrics[1].height)).toBeLessThanOrEqual(1);
      for (const entry of metrics) {
        expect(entry.width).toBeGreaterThanOrEqual(44); expect(entry.height).toBeGreaterThanOrEqual(44);
        expect(entry.left).toBeGreaterThanOrEqual(-1); expect(entry.right).toBeLessThanOrEqual(viewport.width + 1);
        expect(entry.top).toBeGreaterThanOrEqual(-1); expect(entry.bottom).toBeLessThanOrEqual(viewport.height + 1);
        expect(entry.labelLineCount).toBe(1); expect(entry.clipping).toEqual([]);
        expect(entry.visibleLabel.length).toBeGreaterThan(3);
        expect(entry.visibleLabel).not.toMatch(/mealJourney\./);
        expect(normalized(entry.accessibleLabel)).toContain(normalized(entry.visibleLabel));
      }
      const tabs = await page.getByRole('tablist').boundingBox(); expect(tabs).not.toBeNull();
      const create = page.getByTestId('create-list'); await expect(create).toBeVisible();
      const listAction = await create.boundingBox(); expect(listAction).not.toBeNull();
      if (viewport.width === 375 || viewport.width >= 1000) {
        expect(listAction!.y).toBeGreaterThanOrEqual(-1);
        expect(listAction!.y + listAction!.height).toBeLessThanOrEqual(tabs!.y + 1);
      }
      for (const entry of metrics) expect(entry.bottom).toBeLessThanOrEqual(tabs!.y + 1);
      expect(await snapshot()).toEqual(before);
      const name = `home-entries-${language}-${viewport.width}`;
      const screenshot = info.outputPath(name + '.png');
      await page.screenshot({ path: screenshot, fullPage: true });
      await info.attach(name, { path: screenshot, contentType: 'image/png' });
      scenes.push({ viewport, entries: metrics, listAction, tabs });
    }
    expect(errors).toEqual([]);
    const sourceCommit = process.env.JJ_JOURNEY_SOURCE_SHA;
    if (sourceCommit) expect(sourceCommit).toMatch(/^[a-f0-9]{40}$/);
    await info.attach('b05-home-entry-layout-evidence', {
      body: Buffer.from(JSON.stringify({
        sourceCommit: sourceCommit ?? null, language: language as Language, project: info.project.name,
        physicalIPhone: false, nativeAppValidated: false, normalFontScaleOnly: true,
        businessStateSeeded: false, businessDocumentsPreserved: 7, scenes,
      }, null, 2)), contentType: 'application/json',
    });
  });
});
