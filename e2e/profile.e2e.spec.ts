import { expect, test } from '@playwright/test';
import { loginAsDemo } from './test-helpers';

test('edits profile data and returns to my profile', async ({ page }) => {
  const displayName = `Demo Writer ${Date.now()}`;
  await loginAsDemo(page);
  await page.goto('/mi-perfil/editar');

  await page.locator('input[formcontrolname="displayName"]').fill(displayName);
  await Promise.all([
    page.waitForURL('**/mi-perfil'),
    page.getByRole('button', { name: /guardar/i }).click(),
  ]);

  await expect(page).toHaveURL(/\/mi-perfil$/);
  await expect(page.locator('body')).toContainText(displayName);
});
