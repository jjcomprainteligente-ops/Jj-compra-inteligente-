/// <reference types="node" />
import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { createTranslator } from '../../src/i18n/core';
import { resources } from '../../src/i18n/resources';
import { LANGUAGES, type Language } from '../../src/i18n/types';
import { expenseToday } from '../../src/domain/expenses';
import { auditContrastAndTargets } from '../quality/contrast';
import { V83_RECIPES } from '../../src/data/recipesV83';

// This is an executable-screen inventory, not a pixel-equivalence or physical-device claim.
// State gallery captures are explicitly examples; actual permission/error paths have separate tests.
const origin = process.env.QUALITY_BASE_URL ?? 'http://127.0.0.1:8081';
const prefix = 'jjcompraintelwgiemt.';
const preferenceKey = prefix + 'preferences.v1';
const shoppingKey = prefix + 'shopping.v1';
const businessFixture: Record<string, string> = {
  [shoppingKey]: JSON.stringify({ version: 1, state: { activeListId: 'coverage-list', lists: [{
    id: 'coverage-list', name: 'Lista de prueba · Äna', budgetCents: 6000, items: [{
      id: 'coverage-rice', name: 'Arroz', quantityMilli: 1000, unit: 'kg', category: 'Despensa',
      note: '', checked: false, unitPriceCents: null, priceKind: null,
    }, {
      id: 'coverage-tomato', name: 'Tomate', quantityMilli: 500000, unit: 'g', category: 'Fruta y verdura',
      note: 'Nota de prueba · crème / Größe / ñ', checked: true, unitPriceCents: null, priceKind: null,
    }],
  }] } }),
  [prefix + 'menus.v1']: JSON.stringify({ version: 1, plan: { servings: 2,
    recipeIds: ['arroz-verduras', 'lentejas-casa', 'tortilla-ensalada', 'garbanzos-calabaza', 'pasta-tomate'] } }),
  [prefix + 'comparisons.v1']: JSON.stringify({ version: 1, comparisons: [] }),
  [prefix + 'price-observations.v1']: JSON.stringify({ version: 1, observations: [] }),
  [prefix + 'expenses.v1']: JSON.stringify({ version: 1, data: { expenses: [{ id: 'coverage-expense', amountCents: 1234,
    date: expenseToday(), store: 'Comercio de prueba', note: 'Registro ficticio aislado para QA',
    listId: 'coverage-list', listName: 'Lista de prueba · Äna', source: 'user-confirmed' }] } }),
  [prefix + 'local-settings.v1']: JSON.stringify({ version: 1, preferences: { favoriteStores: ['hiperdino'], inAppReminders: true } }),
};
const sizes = [{ width: 375, height: 754 }, { width: 430, height: 932 }, { width: 1280, height: 1000 }];
const languages: Language[] = ['es', 'en', 'de', 'fr'];
const stateKinds = ['empty', 'no_price', 'offline', 'network', 'microphone_denied', 'camera_denied', 'unknown_barcode', 'duplicate', 'success'];
const stateReferences = ['01_lista_vacia', '02_sin_precios', '03_sin_conexion', '04_error_red', '05_permiso_micro', '06_permiso_camara', '07_sin_barcode', '08_conflicto_producto', '09_confirmacion'];

async function health(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const visible = (element: HTMLElement) => {
      const style = getComputedStyle(element); const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width >= 1 && rect.height >= 1
        && !element.closest('[aria-hidden="true"]');
    };
    const elements = Array.from(document.querySelectorAll<HTMLElement>('body *')).filter(visible);
    const labels = elements.map(element => element.getAttribute('aria-label') ?? '').join('\n');
    const text = elements.filter(element => element.children.length === 0).map(element => element.innerText ?? '').join('\n');
    const rawKeys = Array.from(new Set(((text + '\n' + labels).match(/\b(?:app|menus|recipes|prices|secondary|common|legacy|errors|language|visual|visualSecondary|visualMenus|entry|flow|states|shell|money|moneyViews|localSettings)\.[a-zA-Z][\w.-]*/g) ?? [])));
    const outside: string[] = [];
    const clipped: string[] = [];
    for (const element of elements) {
      if (/^(SCRIPT|STYLE|INPUT|TEXTAREA|SVG|PATH)$/.test(element.tagName)) continue;
      for (const node of Array.from(element.childNodes).filter(node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())) {
        const range = document.createRange(); range.selectNodeContents(node);
        for (const rect of Array.from(range.getClientRects())) {
          if (rect.width < 1 || rect.height < 1) continue;
          const snippet = node.textContent!.trim().slice(0, 150);
          if (rect.left < -2 || rect.right > width + 2) outside.push(snippet);
          let ancestor: HTMLElement | null = element;
          while (ancestor && ancestor !== document.body) {
            const style = getComputedStyle(ancestor); const bounds = ancestor.getBoundingClientRect();
            if (style.overflowX === 'hidden' && (rect.left < bounds.left - 2 || rect.right > bounds.right + 2)
                || style.overflowY === 'hidden' && (rect.top < bounds.top - 2 || rect.bottom > bounds.bottom + 2)) {
              clipped.push(snippet); break;
            }
            // Vertical scroll content remains available to a user: it is not clipped/lost text.
            if (/(auto|scroll)/.test(style.overflowY)) break;
            ancestor = ancestor.parentElement;
          }
        }
      }
    }
    return { horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - width),
      outside: [...new Set(outside)], clipped: [...new Set(clipped)], rawKeys };
  });
}

for (const language of languages) for (const viewport of sizes.filter(size => process.env.QUALITY_MOBILE_ONLY !== '1' || size.width < 500)) {
  test(`cobertura visual ${language} ${viewport.width}: 16 vistas y 9 ejemplos de estado`, async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'The matrix supplies its own desktop/mobile viewports.');
    test.setTimeout(150_000);
    const t = createTranslator(language, resources);
    const context = await browser.newContext({ baseURL: origin, locale: LANGUAGES[language].locale,
      viewport, isMobile: viewport.width < 500, hasTouch: viewport.width < 500, storageState: { cookies: [], origins: [] } });
    const checks: { scene: string; kind: 'screen' | 'example-state'; reference: string; filename: string; health: Awaited<ReturnType<typeof health>> }[] = [];
    const errors: string[] = [];
    const qualityChecks: { scene: string; result: Awaited<ReturnType<typeof auditContrastAndTargets>> }[] = [];
    const requested = process.env.COVERAGE_EVIDENCE_DIR;
    const directory = requested ? path.resolve(requested) : testInfo.outputPath('coverage');
    const screenshots = path.join(directory, 'screenshots'); fs.mkdirSync(screenshots, { recursive: true });
    const reportPath = path.join(directory, `${language}-${viewport.width}-coverage.json`);
    if (fs.existsSync(reportPath)) throw new Error('Refusing to overwrite existing visual evidence: ' + reportPath);
    await context.addInitScript(({ fixture, preferences, preferenceKey }) => {
      if (sessionStorage.getItem('coverage-visual-seeded')) return;
      for (const [key, value] of Object.entries(fixture)) localStorage.setItem(key, value);
      localStorage.setItem(preferenceKey, preferences);
      sessionStorage.setItem('coverage-visual-seeded', '1');
    }, { fixture: businessFixture, preferenceKey, preferences: JSON.stringify({ version: 1, language, welcomeCompleted: false }) });
    // Unsupported capabilities are deterministic in these layout captures. Security tests cover supported sensors.
    await context.addInitScript(() => {
      for (const name of ['SpeechRecognition', 'webkitSpeechRecognition', 'BarcodeDetector']) {
        Object.defineProperty(window, name, { configurable: true, value: undefined });
      }
    });
    const page = await context.newPage();
    if (process.env.QUALITY_AUDIT === '1') await context.route('**/favicon.ico', route => route.fulfill({ status: 204, body: '' }));
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const snapshot = () => page.evaluate(keys => Object.fromEntries(keys.map(key => [key, localStorage.getItem(key)])), Object.keys(businessFixture));
    const capture = async (scene: string, kind: 'screen' | 'example-state', reference: string, flow = false) => {
      await expect(page.locator('html')).toHaveAttribute('lang', language);
      if (scene !== '01_bienvenida') {
        const ids = ['home', 'list', 'savings', 'menus'];
        for (const id of ids) await expect(page.getByTestId((flow ? 'flow-tab-' : 'tab-') + id)).toBeInViewport({ ratio: 0.8 });
      }
      const result = await health(page);
      if (process.env.QUALITY_AUDIT === '1') qualityChecks.push({ scene, result: await auditContrastAndTargets(page) });
      const filename = `${language}-${viewport.width}-${scene}.png`;
      const filenameAbsolute = path.join(screenshots, filename);
      if (fs.existsSync(filenameAbsolute)) throw new Error('Refusing to overwrite existing screenshot: ' + filenameAbsolute);
      await page.screenshot({ path: filenameAbsolute, fullPage: false, animations: 'disabled' });
      checks.push({ scene, kind, reference, filename, health: result });
      expect(result, `${language}/${viewport.width}/${scene}: no clipped/lost text or raw resource keys`).toEqual({ horizontalOverflow: 0, outside: [], clipped: [], rawKeys: [] });
    };
    const screen = (scene: string, flow = false) => capture(scene, 'screen', `02_VISTAS_CANONICAS/${scene}.png`, flow);
    const tab = async (name: string) => { await page.getByTestId('tab-' + name).click(); await expect(page.getByTestId('tab-' + name)).toHaveAttribute('aria-selected', 'true'); };
    try {
      await page.goto('/');
      await expect(page.getByTestId('welcome-title')).toBeVisible();
      await expect(page.getByTestId('start-app')).toBeInViewport();
      await screen('01_bienvenida');
      await page.getByTestId('start-app').click();
      await expect(page.getByTestId('main-cta')).toBeInViewport();
      await screen('02_inicio');
      const before = await snapshot();
      expect(before).toEqual(businessFixture);
      await tab('list'); await screen('03_mi_compra');
      await tab('savings'); await expect(page.getByTestId('actual-spend-total')).not.toHaveText(t('visualSecondary.notRecorded')); await screen('04_ahorro');
      await tab('menus'); await expect(page.getByTestId('review-menu')).toBeInViewport(); await screen('05_menus');
      await page.getByRole('button', { name: t('menus.recipeA11y', { title: t('recipes.arroz-verduras.title') }), exact: true }).click();
      const flow = page.getByTestId('menu-sheet');
      await expect(flow.getByRole('button', { name: t('menus.reviewRecipe'), exact: true })).toBeInViewport();
      await screen('06_detalle_receta', true);
      await flow.getByRole('button', { name: t('menus.reviewRecipe'), exact: true }).click();
      await expect(flow.getByTestId('confirm-ingredients')).toBeInViewport();
      await expect(flow.getByTestId('ingredient-name').first(), 'At least one ingredient must appear before the fixed review footer').toBeInViewport();
      await screen('07_ingredientes', true);
      await flow.getByRole('button', { name: t('menus.cancelProposal'), exact: true }).click();
      await flow.getByRole('button', { name: t('menus.cancelWithoutAdd'), exact: true }).click();
      await flow.waitFor({ state: 'detached' });
      await tab('home'); await page.getByTestId('open-search').click();
      await expect(page.getByTestId('product-search-screen')).toBeVisible(); await screen('08_buscar_producto');
      await page.getByTestId('product-result-coverage-rice').click();
      await screen('09_detalle_producto');
      await tab('home'); await page.getByTestId('open-voice').click(); await expect(page.getByTestId('voice-screen')).toBeVisible(); await screen('10_voz');
      await tab('home'); await page.getByTestId('open-scanner').click(); await expect(page.getByTestId('scanner-screen')).toBeVisible(); await screen('11_escaner');
      await page.getByTestId('open-profile').click(); await page.getByTestId('profile-stores').click();
      await expect(page.getByTestId('stores-screen')).toBeVisible(); await screen('12_mis_tiendas');
      await page.getByTestId('open-profile').click(); await page.getByTestId('profile-budget').click();
      await expect(page.getByTestId('budget-limit-value')).toBeVisible(); await screen('13_presupuesto');
      await page.getByTestId('open-expense-history').click(); await expect(page.getByTestId('expenses-period-total')).toBeVisible(); await screen('14_historial');
      await page.getByTestId('open-profile').click(); await screen('15_perfil_hogar');
      await page.getByTestId('open-notifications').click(); await expect(page.getByTestId('notifications-screen')).toBeVisible(); await screen('16_notificaciones');
      await page.getByTestId('open-profile').click(); await page.getByTestId('open-state-review').click();
      for (let index = 0; index < stateKinds.length; index++) {
        const kind = stateKinds[index];
        await page.getByTestId('state-choice-' + kind).click();
        const card = page.getByTestId('state-card-' + kind);
        await card.scrollIntoViewIfNeeded();
        await expect(card).toBeVisible();
        await expect(card).toContainText(t('states.exampleBanner'));
        await capture(`estado_${String(index + 1).padStart(2, '0')}_${kind}`, 'example-state', `03_B03_14_ESTADOS/${stateReferences[index]}.png`);
      }
      if (process.env.QUALITY_AUDIT === '1') {
        const inspect = async (scene: string) => {
          qualityChecks.push({ scene, result: await auditContrastAndTargets(page) });
          await page.screenshot({ path: path.join(screenshots, `${language}-${viewport.width}-${scene}.png`), animations: 'disabled' });
        };
        const close = async (id: string) => {
          const panel = page.getByTestId(id);
          await panel.getByRole('button', { name: t('common.close'), exact: true }).click();
          await expect(panel).toHaveCount(0);
        };
        await tab('menus');
        await page.getByTestId('menu-filters-open').click();
        await inspect('panel_menu_filters');
        await close('menu-filter-sheet');
        await tab('list');
        await page.getByTestId('add-item').click();
        await inspect('panel_manual_item');
        await close('app-sheet');
        await page.getByTestId('edit-budget').click();
        await inspect('panel_budget_editor');
        await close('app-sheet');
        await page.getByTestId('share-list').click();
        await inspect('panel_reviewed_list_copy');
        await page.getByTestId('list-share-close').click();
        await page.getByTestId('open-profile').click();
        await page.getByTestId('profile-budget').click();
        await page.getByTestId('record-expense').click();
        await inspect('panel_expense_editor');
        await close('expense-editor');
        await page.getByTestId('open-profile').click();
        await page.getByTestId('profile-privacy').click();
        await expect(page.getByTestId('privacy-export-all')).toBeEnabled();
        await inspect('panel_privacy');
        await page.getByTestId('privacy-delete-expenses').click();
        const deletion = page.getByTestId('privacy-delete-dialog');
        await expect(deletion.getByTestId('privacy-delete-review-next')).toBeEnabled();
        await inspect('panel_deletion_review');
        await deletion.getByTestId('privacy-delete-review-next').click();
        await inspect('panel_deletion_confirmation');
        await deletion.getByTestId('privacy-delete-cancel').click();
        await expect(deletion).toHaveCount(0);
        await page.getByTestId('open-profile').click();
        await page.getByTestId('language-settings').click();
        await inspect('panel_language');
        await tab('menus');
        await page.getByTestId('menus-section-discover').click();
        await inspect('panel_catalogue_first_page');
        const unknown = V83_RECIPES.find(recipe => recipe.minutes === null);
        expect(unknown).toBeDefined();
        for (let count = 0; count < 10 && !(await page.getByTestId('menu-catalog-recipe-' + unknown!.id).count()); count++) {
          await page.getByTestId('show-more-recipes').click();
        }
        await page.getByTestId('menu-catalog-recipe-' + unknown!.id).click();
        await inspect('panel_v83_unknown_time');
        await page.getByTestId('menu-sheet').getByTestId('flow-back').click();
        // Inspect the other switch paint state in a separate seeded QA context;
        // this does not toggle or mutate the main journey's saved preferences.
        const offContext = await browser.newContext({ baseURL: origin, locale: LANGUAGES[language].locale,
          viewport, isMobile: true, hasTouch: true, storageState: { cookies: [], origins: [] } });
        try {
          const offFixture = { ...businessFixture, [prefix + 'local-settings.v1']: JSON.stringify({ version: 1,
            preferences: { favoriteStores: ['hiperdino'], inAppReminders: false } }) };
          await offContext.addInitScript(({ fixture, preferenceKey, preferences }) => {
            for (const [key, value] of Object.entries(fixture)) localStorage.setItem(key, value);
            localStorage.setItem(preferenceKey, preferences);
          }, { fixture: offFixture, preferenceKey, preferences: JSON.stringify({ version: 1, language, welcomeCompleted: true }) });
          await offContext.route('**/favicon.ico', route => route.fulfill({ status: 204, body: '' }));
          const offPage = await offContext.newPage();
          await offPage.goto('/');
          await offPage.getByTestId('open-notifications').click();
          await expect(offPage.getByTestId('in-app-reminders').getByRole('switch')).not.toBeChecked();
          qualityChecks.push({ scene: 'panel_switch_off', result: await auditContrastAndTargets(offPage) });
          await offPage.screenshot({ path: path.join(screenshots, `${language}-${viewport.width}-panel_switch_off.png`), animations: 'disabled' });
        } finally { await offContext.close(); }
      }
      expect(await snapshot(), 'Visual navigation and example states never change stored business data').toEqual(before);
      expect(checks.filter(check => check.kind === 'screen')).toHaveLength(16);
      expect(checks.filter(check => check.kind === 'example-state')).toHaveLength(9);
      expect(errors, 'No runtime or console errors').toEqual([]);
      if (process.env.QUALITY_AUDIT === '1') {
        expect(qualityChecks.flatMap(check => check.result.textFailures.map(failure => ({ scene: check.scene, ...failure }))), 'Normal/large text AA contrast').toEqual([]);
        expect(qualityChecks.flatMap(check => check.result.iconFailures.map(failure => ({ scene: check.scene, ...failure }))), 'Icon-only active controls contrast').toEqual([]);
        expect(qualityChecks.flatMap(check => check.result.fieldBoundaryFailures.map(failure => ({ scene: check.scene, ...failure }))), 'Editable field boundaries against adjacent backgrounds').toEqual([]);
        expect(qualityChecks.flatMap(check => check.result.switchPaintFailures.map(failure => ({ scene: check.scene, ...failure }))), 'Custom switch track/thumb contrast').toEqual([]);
        expect(qualityChecks.flatMap(check => check.result.targetsBelow24.map(failure => ({ scene: check.scene, ...failure }))), 'AA target geometry, including measured spacing exception').toEqual([]);
      }
    } finally {
      fs.writeFileSync(reportPath, JSON.stringify({ language, viewport, engine: 'Chromium web',
        disclaimer: 'CSS viewport simulation; not native iOS or physical iPhone validation. State gallery cases are labelled examples.',
        canonicalRoot: 'referencias/gpt6-v2/extraidos/v2', checks, errors,
        ...(process.env.QUALITY_AUDIT === '1' ? { qualityChecks } : {}) }, null, 2), { flag: 'wx' });
      await context.close();
    }
  });
}
