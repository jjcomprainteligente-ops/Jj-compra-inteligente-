/// <reference types="node" />
import { expect, test, type Download, type Locator, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { createTranslator, unitLabel } from '../../src/i18n/core';
import { resources } from '../../src/i18n/resources';
import type { Language } from '../../src/i18n/types';

// Fixtures are confined to fresh Playwright contexts. No owner data is read.
const prefix = 'jjcompraintelwgiemt.';
const keys = {
  shopping: prefix + 'shopping.v1', menus: prefix + 'menus.v1', comparisons: prefix + 'comparisons.v1',
  observations: prefix + 'price-observations.v1', expenses: prefix + 'expenses.v1',
  settings: prefix + 'local-settings.v1', preferences: prefix + 'preferences.v1',
};
const storageKeys = Object.values(keys);
const languages: Language[] = ['es', 'en', 'de', 'fr'];
const listName = 'QA lista — été / Größe / ñ';
const names = {
  coffee: 'Café crème Ä — ñ', water: 'Agua de prueba', oil: 'Aceite de prueba', salt: 'Sal de cocina',
  literal: '<img src=x onerror="window.__listShareXss=1">', checked: 'Pan de ayer — déjà',
};
const privateValues = ['QA_PRIVATE_NOTE', 'QA_PRIVATE_PRICE_SOURCE', 'QA_OTHER_LIST',
  'QA_OTHER_PRODUCT', 'qa-active-id', 'qa-coffee-id', 'qa-checked-id', '98765431'];

function fixture(language: Language = 'es', allChecked = false): Record<string, string> {
  const item = (id: string, name: string, quantityMilli: number, unit: string, checked = false) => ({
    id, name, quantityMilli, unit, checked: allChecked || checked, category: 'Otros',
    note: 'QA_PRIVATE_NOTE — never include this in shared text', unitPriceCents: 12345, priceKind: 'entered',
  });
  return {
    [keys.preferences]: JSON.stringify({ version: 1, language, welcomeCompleted: true }),
    [keys.shopping]: JSON.stringify({ version: 1, state: { activeListId: 'qa-active-id', lists: [{
      id: 'qa-active-id', name: listName, budgetCents: 98765431, items: [
        item('qa-coffee-id', names.coffee, 1250, 'kg'), item('qa-water-id', names.water, 250000, 'ml'),
        item('qa-oil-id', names.oil, 1500, 'L'), item('qa-salt-id', names.salt, 500000, 'g'),
        item('qa-literal-id', names.literal, 2000, 'ud'), item('qa-checked-id', names.checked, 3000, 'ud', true),
      ],
    }, { id: 'qa-other-id', name: 'QA_OTHER_LIST', budgetCents: null,
      items: [item('qa-other-item-id', 'QA_OTHER_PRODUCT', 1000, 'ud')] }] } }),
    [keys.menus]: JSON.stringify({ version: 1, plan: null }),
    [keys.comparisons]: JSON.stringify({ version: 1, comparisons: [] }),
    [keys.observations]: JSON.stringify({ version: 1, observations: [] }),
    [keys.expenses]: JSON.stringify({ version: 1, data: { expenses: [] } }),
    [keys.settings]: JSON.stringify({ version: 1, preferences: { favoriteStores: ['carrefour'], inAppReminders: true } }),
  };
}

async function seed(page: Page, language: Language = 'es', allChecked = false) {
  await page.addInitScript(entries => {
    if (!/^https?:$/.test(location.protocol) || sessionStorage.getItem('qa-list-sharing-seeded')) return;
    for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, value);
    sessionStorage.setItem('qa-list-sharing-seeded', '1');
    (window as Window & { __listShareXss?: number }).__listShareXss = 0;
  }, fixture(language, allChecked));
  await page.goto('/');
  await expect(page.getByTestId('open-profile')).toBeVisible();
  await page.getByTestId('tab-list').click();
}

async function snapshot(page: Page) {
  return page.evaluate(names => Object.fromEntries(names.map(name => [name, localStorage.getItem(name)])), storageKeys);
}
async function openShare(page: Page) {
  const trigger = page.getByTestId('share-list');
  await expect(trigger).toBeEnabled();
  await trigger.click();
  const sheet = page.getByTestId('list-share-sheet');
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveRole('dialog');
  return sheet;
}
async function preview(sheet: Locator) {
  return (await sheet.getByTestId('list-share-preview').innerText()).replace(/\r\n/g, '\n');
}
async function downloadText(download: Download) {
  expect(download.suggestedFilename()).toBe('jj-shopping-list.txt');
  const filename = await download.path();
  expect(filename).not.toBeNull();
  return (await fs.readFile(filename!, 'utf8')).replace(/\r\n/g, '\n');
}
async function downloadCopy(page: Page, sheet: Locator) {
  const pending = page.waitForEvent('download');
  await sheet.getByTestId('list-share-download').click();
  return downloadText(await pending);
}

type ShareMode = 'success' | 'cancel' | 'fail' | 'pending' | 'unsupported';
type ShareCall = { data: ShareData; activation: boolean | null };
type ShareWindow = Window & {
  __listShareCalls: ShareCall[];
  __finishListShare?: () => void;
};
async function installShare(page: Page, mode: ShareMode) {
  await page.addInitScript(mode => {
    const harness = window as unknown as ShareWindow;
    harness.__listShareCalls = [];
    Object.defineProperty(navigator, 'share', { configurable: true, value: mode === 'unsupported' ? undefined
      : (data: ShareData) => {
        harness.__listShareCalls.push({ data: { ...data }, activation: navigator.userActivation?.isActive ?? null });
        if (mode === 'cancel') return Promise.reject(new DOMException('QA dismissed', 'AbortError'));
        if (mode === 'fail') return Promise.reject(new Error('QA_SHARING_FAILED_DO_NOT_DISPLAY'));
        if (mode === 'pending') return new Promise<void>(resolve => { harness.__finishListShare = resolve; });
        return Promise.resolve();
      } });
  }, mode);
}
async function calls(page: Page) {
  return page.evaluate(() => (window as unknown as ShareWindow).__listShareCalls);
}
function checkPrivateDataAbsent(text: string) {
  for (const value of privateValues) expect(text).not.toContain(value);
  expect(text).not.toMatch(/123[,.]45/);
  expect(text).not.toMatch(/(?:€|EUR|\bUSD\b)/);
}
function checkQuantities(text: string, language: Language) {
  const t = createTranslator(language, resources);
  const decimal = language === 'en' ? '.' : ',';
  const line = (name: string) => text.split('\n').find(line => line.includes(name));
  expect(line(names.coffee)).toContain(`1${decimal}25 kg`);
  expect(line(names.oil)).toContain(`1${decimal}5 L`);
  expect(line(names.water)).toContain('250 ml');
  expect(line(names.salt)).toContain('500 g');
  expect(line(names.literal)).toContain(`2 ${unitLabel('ud', t)}`);
}

for (const language of languages) {
  test(`${language}: revisa y descarga solo la lista elegida; incluir comprados es explícito y cancelar conserva siete documentos`, async ({ page }, info) => {
    await installShare(page, 'unsupported');
    await seed(page, language);
    const before = await snapshot(page);
    const sheet = await openShare(page);
    const t = createTranslator(language, resources);
    await expect(sheet).toHaveAccessibleName(t('listSharing.title'));
    await expect(sheet.getByTestId('list-share-send')).toBeDisabled();
    await expect(sheet.getByTestId('list-share-include-completed')).toHaveAttribute('aria-checked', 'false');
    const pendingText = await preview(sheet);
    expect(pendingText).toContain('JJ Compra Inteligente');
    expect(pendingText).toContain(listName);
    for (const name of [names.coffee, names.water, names.oil, names.salt, names.literal]) expect(pendingText).toContain(name);
    expect(pendingText).not.toContain(names.checked);
    checkPrivateDataAbsent(pendingText);
    checkQuantities(pendingText, language);
    await expect(page.locator('img[src="x"]')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as Window & { __listShareXss: number }).__listShareXss)).toBe(0);
    expect(await calls(page)).toEqual([]);
    expect(await snapshot(page)).toEqual(before);
    await page.screenshot({ path: info.outputPath(`share-pending-${language}.png`), fullPage: true });
    expect(await downloadCopy(page, sheet)).toBe(pendingText);
    await expect(sheet.getByTestId('list-share-result')).toContainText(t('listSharing.downloadStarted'));
    await sheet.getByTestId('list-share-include-completed').check();
    await expect(sheet.getByTestId('list-share-include-completed')).toHaveAttribute('aria-checked', 'true');
    const allText = await preview(sheet);
    expect(allText).toContain(names.checked);
    expect(allText).not.toBe(pendingText);
    checkPrivateDataAbsent(allText);
    checkQuantities(allText, language);
    expect(await downloadCopy(page, sheet)).toBe(allText);
    expect(await calls(page)).toEqual([]);
    expect(await snapshot(page)).toEqual(before);
    await sheet.getByTestId('list-share-close').click();
    await expect(sheet).toHaveCount(0);
    await expect(page.getByTestId('share-list')).toBeFocused();
    const reopened = await openShare(page);
    await expect(reopened.getByTestId('list-share-include-completed')).toHaveAttribute('aria-checked', 'false');
    expect(await preview(reopened)).toBe(pendingText);
    await page.keyboard.press('Escape');
    await expect(reopened).toHaveCount(0);
    expect(await snapshot(page)).toEqual(before);
  });

  test(`${language}: el panel de compartir solo recibe el texto revisado tras un gesto explícito`, async ({ page }) => {
    await installShare(page, 'success');
    await seed(page, language);
    const before = await snapshot(page);
    const sheet = await openShare(page);
    const reviewedText = await preview(sheet);
    expect(await calls(page)).toEqual([]);
    await sheet.getByTestId('list-share-send').click();
    const t = createTranslator(language, resources);
    await expect(sheet.getByTestId('list-share-result')).toContainText(t('listSharing.shared'));
    const sent = await calls(page);
    expect(sent).toHaveLength(1);
    expect(sent[0].data).toEqual({ title: expect.any(String), text: reviewedText });
    expect(sent[0].activation).not.toBe(false);
    checkPrivateDataAbsent(sent[0].data.text!);
    await expect(sheet).toBeVisible();
    expect(await preview(sheet)).toBe(reviewedText);
    expect(await snapshot(page)).toEqual(before);
  });

  test(`${language}: cancelar el panel del sistema conserva la revisión y no anuncia un envío`, async ({ page }) => {
    await installShare(page, 'cancel');
    await seed(page, language);
    const before = await snapshot(page);
    const sheet = await openShare(page);
    const reviewedText = await preview(sheet);
    await sheet.getByTestId('list-share-send').click();
    const t = createTranslator(language, resources);
    await expect(sheet.getByTestId('list-share-result')).toContainText(t('listSharing.cancelled'));
    await expect(sheet.getByTestId('list-share-error')).toHaveCount(0);
    await expect(sheet.getByTestId('list-share-send')).toBeEnabled();
    expect(await preview(sheet)).toBe(reviewedText);
    expect(await calls(page)).toHaveLength(1);
    expect(await snapshot(page)).toEqual(before);
  });
}

test('un panel de compartir ocupado impide dobles envíos, Escape, cierre exterior y navegación', async ({ page }, info) => {
  await installShare(page, 'pending');
  await seed(page);
  const before = await snapshot(page);
  const sheet = await openShare(page);
  const reviewedText = await preview(sheet);
  await sheet.getByTestId('list-share-send').dblclick();
  await expect.poll(async () => (await calls(page)).length).toBe(1);
  await expect(sheet.getByTestId('list-share-send')).toBeDisabled();
  await expect(sheet.getByTestId('list-share-download')).toBeDisabled();
  await expect(sheet.getByTestId('list-share-close')).toBeDisabled();
  await expect(sheet.getByTestId('list-share-include-completed')).toBeDisabled();
  await expect(page.getByTestId('tab-home')).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(sheet).toBeVisible();
  const bounds = await sheet.boundingBox();
  expect(bounds).not.toBeNull();
  if (info.project.use.hasTouch) await page.touchscreen.tap(4, Math.max(4, bounds!.y / 2));
  else await page.mouse.click(4, Math.max(4, bounds!.y / 2));
  await expect(sheet).toBeVisible();
  expect(await preview(sheet)).toBe(reviewedText);
  expect(await calls(page)).toHaveLength(1);
  expect(await snapshot(page)).toEqual(before);
  await page.evaluate(() => (window as unknown as ShareWindow).__finishListShare?.());
  await expect(sheet.getByTestId('list-share-send')).toBeEnabled();
  await sheet.getByTestId('list-share-close').click();
  await expect(sheet).toHaveCount(0);
  expect(await snapshot(page)).toEqual(before);
});

test('un fallo del sistema conserva el texto y solo descarga cuando la persona lo pide', async ({ page }) => {
  await installShare(page, 'fail');
  await seed(page, 'fr');
  let downloads = 0;
  page.on('download', () => { downloads++; });
  const before = await snapshot(page);
  const sheet = await openShare(page);
  const reviewedText = await preview(sheet);
  await sheet.getByTestId('list-share-send').click();
  const t = createTranslator('fr', resources);
  await expect(sheet.getByTestId('list-share-error')).toContainText(t('listSharing.error.failed'));
  await expect(sheet).not.toContainText('QA_SHARING_FAILED_DO_NOT_DISPLAY');
  await expect(sheet.getByTestId('list-share-result')).toHaveCount(0);
  expect(downloads).toBe(0);
  expect(await preview(sheet)).toBe(reviewedText);
  expect(await calls(page)).toHaveLength(1);
  expect(await downloadCopy(page, sheet)).toBe(reviewedText);
  expect(downloads).toBe(1);
  expect(await calls(page)).toHaveLength(1);
  expect(await snapshot(page)).toEqual(before);
});

test('una lista sin pendientes no envía ni descarga hasta incluir comprados explícitamente', async ({ page }) => {
  await installShare(page, 'success');
  await seed(page, 'en', true);
  const before = await snapshot(page);
  const sheet = await openShare(page);
  await expect(sheet.getByTestId('list-share-send')).toBeDisabled();
  await expect(sheet.getByTestId('list-share-download')).toBeDisabled();
  expect(await calls(page)).toEqual([]);
  await sheet.getByTestId('list-share-include-completed').check();
  await expect(sheet.getByTestId('list-share-send')).toBeEnabled();
  const reviewedText = await preview(sheet);
  expect(reviewedText).toContain(names.checked);
  checkPrivateDataAbsent(reviewedText);
  await sheet.getByTestId('list-share-send').click();
  await expect.poll(async () => (await calls(page)).length).toBe(1);
  expect((await calls(page))[0].data.text).toBe(reviewedText);
  expect(await snapshot(page)).toEqual(before);
});

test('una lista vacía no ofrece compartir una copia sin productos', async ({ page }) => {
  await installShare(page, 'success');
  await seed(page);
  await page.evaluate(key => {
    const document = JSON.parse(localStorage.getItem(key)!);
    document.state.lists[0].items = [];
    localStorage.setItem(key, JSON.stringify(document));
  }, keys.shopping);
  await page.reload();
  await page.getByTestId('tab-list').click();
  await expect(page.getByTestId('share-list')).toBeDisabled();
  expect(await calls(page)).toEqual([]);
});

test('un cambio posterior en los datos no sustituye el texto ya revisado ni se sobrescribe al compartir', async ({ page }) => {
  await installShare(page, 'success');
  await seed(page);
  const sheet = await openShare(page);
  const reviewedText = await preview(sheet);
  await page.evaluate(key => {
    const document = JSON.parse(localStorage.getItem(key)!);
    document.state.lists[0].name = 'QA cambio posterior';
    document.state.lists[0].items[0].name = 'QA producto posterior';
    localStorage.setItem(key, JSON.stringify(document));
  }, keys.shopping);
  const latestDocuments = await snapshot(page);
  expect(await preview(sheet)).toBe(reviewedText);
  await sheet.getByTestId('list-share-send').click();
  await expect.poll(async () => (await calls(page)).length).toBe(1);
  expect((await calls(page))[0].data.text).toBe(reviewedText);
  expect(await snapshot(page)).toEqual(latestDocuments);
});
