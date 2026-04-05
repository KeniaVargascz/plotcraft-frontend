import { expect, test } from '@playwright/test';
import { clearSession, loginAsDemo } from './test-helpers';

test.describe('auth flows', () => {
  test('redirects protected routes to login', async ({ page }) => {
    await clearSession(page);
    await page.goto('/feed');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('registers a new user and lands in profile', async ({ page }) => {
    const suffix = Date.now();
    await clearSession(page);
    await page.goto('/register');
    await page.locator('input[formcontrolname="email"]').fill(`e2e-${suffix}@plotcraft.test`);
    await page.locator('input[formcontrolname="username"]').fill(`e2e_${suffix}`);
    await page.locator('input[formcontrolname="password"]').fill('Demo1234!');
    await page.locator('input[formcontrolname="confirmPassword"]').fill('Demo1234!');
    await Promise.all([
      page.waitForURL('**/mi-perfil'),
      page.getByRole('button', { name: /registr|crear/i }).click(),
    ]);
    await expect(page).toHaveURL(/\/mi-perfil$/);
  });

  test('logs in with demo credentials', async ({ page }) => {
    await loginAsDemo(page);
  });
});
