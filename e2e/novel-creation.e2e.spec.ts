import { expect, test } from '@playwright/test';
import { loginAsDemo } from './test-helpers';

test('creates a novel and opens chapter creation flow', async ({ page }) => {
  const title = `E2E novela ${Date.now()}`;
  await loginAsDemo(page);
  await page.goto('/mis-novelas/nueva');

  await page.locator('input[maxlength="200"]').first().fill(title);
  await page.locator('textarea[maxlength="3000"]').fill('Novela creada desde Playwright.');
  await Promise.all([
    page.waitForURL(/\/mis-novelas\/.+\/capitulos$/),
    page.getByRole('button', { name: /guardar novela|guardando/i }).click(),
  ]);

  await expect(page).toHaveURL(/\/mis-novelas\/.+\/capitulos$/);
  await page.getByRole('link', { name: /nuevo capitulo/i }).click();
  await expect(page).toHaveURL(/\/mis-novelas\/.+\/capitulos\/nuevo$/);

  await page.getByTestId('chapter-title').fill('Capitulo E2E');
  await page.getByTestId('chapter-content').fill(
    'Contenido de prueba para validar la creacion del capitulo desde el flujo E2E.',
  );

  await Promise.all([
    page.waitForURL(/\/mis-novelas\/.+\/capitulos\/.+\/editar$/),
    page.getByRole('button', { name: /crear/i }).click(),
  ]);

  await expect(page.getByTestId('word-count')).toBeVisible();
});
