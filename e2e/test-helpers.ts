import { expect, Page } from '@playwright/test';

export async function clearSession(page: Page) {
  await page.context().clearCookies();
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Ensures the user is authenticated.
 * If storageState was loaded via global-setup (recommended), just navigates to /feed.
 * Falls back to form-based login if no session exists.
 */
export async function loginAsDemo(page: Page, email = 'demo@plotcraft.com') {
  // Check if already authenticated via storageState
  await page.goto('/feed', { waitUntil: 'networkidle', timeout: 15_000 });

  if (page.url().includes('/feed')) {
    return; // Already authenticated via storageState
  }

  // Fallback: form-based login
  await clearSession(page);
  await page.goto('/login');
  await page.locator('input[formcontrolname="identifier"]').fill(email);
  await page.locator('input[formcontrolname="password"]').fill('Demo1234!');
  await Promise.all([
    page.waitForURL('**/feed'),
    page.getByRole('button', { name: /iniciar|login/i }).click(),
  ]);
  await expect(page).toHaveURL(/\/feed$/);
}
