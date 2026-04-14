import { expect, test } from '@playwright/test';
import { clearSession } from './test-helpers';

test.describe('auth gate — login prompt for unauthenticated users', () => {
  test.beforeEach(async ({ page }) => {
    await clearSession(page);
  });

  test('blocks direct URL to novel detail, shows dialog and redirects to catalog', async ({
    page,
  }) => {
    await page.goto('/novelas/any-slug');
    await expect(page).toHaveURL(/\/novelas$/);
    await expect(page.locator('mat-dialog-container')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('Inicia sesion para continuar')).toBeVisible();
  });

  test('blocks direct URL to world detail', async ({ page }) => {
    await page.goto('/mundos/any-slug');
    await expect(page).toHaveURL(/\/mundos$/);
    await expect(page.locator('mat-dialog-container')).toBeVisible({ timeout: 3000 });
  });

  test('blocks direct URL to character detail', async ({ page }) => {
    await page.goto('/personajes/any-user/any-slug');
    await expect(page).toHaveURL(/\/personajes$/);
    await expect(page.locator('mat-dialog-container')).toBeVisible({ timeout: 3000 });
  });

  test('dialog "Iniciar sesion" navigates to /login', async ({ page }) => {
    await page.goto('/novelas/any-slug');
    await expect(page.locator('mat-dialog-container')).toBeVisible({ timeout: 3000 });
    await page.getByRole('button', { name: /iniciar sesion/i }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('dialog "Crear cuenta" navigates to /register', async ({ page }) => {
    await page.goto('/novelas/any-slug');
    await expect(page.locator('mat-dialog-container')).toBeVisible({ timeout: 3000 });
    await page.getByRole('button', { name: /crear cuenta/i }).click();
    await expect(page).toHaveURL(/\/register$/);
  });

  test('dismissing dialog keeps user on catalog', async ({ page }) => {
    await page.goto('/novelas/any-slug');
    await expect(page.locator('mat-dialog-container')).toBeVisible({ timeout: 3000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('mat-dialog-container')).not.toBeVisible({ timeout: 3000 });
    await expect(page).toHaveURL(/\/novelas$/);
  });

  test('catalog pages remain accessible without auth', async ({ page }) => {
    await page.goto('/novelas');
    await expect(page).toHaveURL(/\/novelas$/);
    await expect(page.locator('mat-dialog-container')).not.toBeVisible({ timeout: 1000 });

    await page.goto('/mundos');
    await expect(page).toHaveURL(/\/mundos$/);

    await page.goto('/personajes');
    await expect(page).toHaveURL(/\/personajes$/);

    await page.goto('/descubrir');
    await expect(page).toHaveURL(/\/descubrir$/);
  });
});
