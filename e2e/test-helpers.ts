import { expect, Page } from '@playwright/test';

export async function clearSession(page: Page) {
  await page.context().clearCookies();
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

export async function loginAsDemo(page: Page, email = 'demo@plotcraft.com') {
  await clearSession(page);
  await page.goto('/login');
  await page.locator('input[formcontrolname="email"]').fill(email);
  await page.locator('input[formcontrolname="password"]').fill('Demo1234!');
  await Promise.all([
    page.waitForURL('**/feed'),
    page.getByRole('button', { name: /iniciar|login/i }).click(),
  ]);
  await expect(page).toHaveURL(/\/feed$/);
}
