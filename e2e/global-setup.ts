import { test as setup, expect } from '@playwright/test';

const authFile = './e2e/.auth/user.json';

setup('authenticate as demo user', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await page.goto('/login');
  await page.locator('input[formcontrolname="identifier"]').fill('demo@plotcraft.com');
  await page.locator('input[formcontrolname="password"]').fill('Demo1234!');

  await Promise.all([
    page.waitForURL('**/feed', { timeout: 30_000 }),
    page.getByRole('button', { name: /iniciar|login/i }).click(),
  ]);

  await expect(page).toHaveURL(/\/feed$/);

  // Save auth state (localStorage + cookies) for all subsequent tests
  await page.context().storageState({ path: authFile });
});
