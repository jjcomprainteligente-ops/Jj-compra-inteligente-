import { expect, test } from '@playwright/test';

test('presupuesto de cinco comidas pregunta tiendas antes de mostrar menús', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-with-budget').click();
  await expect(page.getByTestId('meal-budget-screen')).toBeVisible();
  await page.getByTestId('meal-budget-amount').fill('50');
  await page.getByTestId('meal-budget-meals').fill('5');
  await page.getByTestId('meal-budget-servings').fill('2');
  await page.getByTestId('meal-budget-continue').click();
  await expect(page.getByTestId('stores-screen')).toBeVisible();

  // The user selects their own shop(s) before planning the five meals.
  const proceed = page.getByTestId('stores-continue-to-prices');
  await expect(proceed).toBeDisabled();
  await page.getByTestId('favorite-hiperdino').click();
  await expect(proceed).toBeEnabled();
  await proceed.click();
  await expect(page.getByTestId('menu-filters-open')).toBeVisible();
});

test('recetas siguen disponibles y presupuesto no admite un número engañoso de comidas', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-with-recipes').click();
  await expect(page.getByTestId('menu-filters-open')).toBeVisible();

  await page.getByTestId('tab-home').click();
  await page.getByTestId('start-with-budget').click();
  await page.getByTestId('meal-budget-meals').fill('7');
  await page.getByTestId('meal-budget-continue').click();
  await expect(page.getByTestId('meal-budget-screen')).toBeVisible();
  await expect(page.getByText(/exactamente cinco comidas/i)).toBeVisible();
});

test('las funciones originales se mantienen accesibles desde la navegación', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('start-with-recipes')).toBeVisible();
  await expect(page.getByTestId('start-with-budget')).toBeVisible();
  await page.getByTestId('tab-list').click();
  await expect(page.getByTestId('start-with-budget')).toHaveCount(0);
  await page.getByTestId('tab-savings').click();
  await expect(page.getByTestId('open-price-pilot')).toBeVisible();
  await page.getByTestId('tab-menus').click();
  await expect(page.getByTestId('menu-filters-open')).toBeVisible();
});
