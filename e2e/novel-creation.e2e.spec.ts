import { expect, test } from '@playwright/test';
import { loginAsDemo } from './test-helpers';

test('creates a novel and opens chapter creation flow', async ({ page }) => {
  const title = `E2E novela ${Date.now()}`;
  await loginAsDemo(page);
  await page.goto('/mis-novelas/nueva');

  await page.locator('input[maxlength="200"]').first().fill(title);
  await page.locator('textarea[maxlength="3000"]').fill('Novela creada desde Playwright.');
  await Promise.all([
    page.waitForURL(/\/novelas\/[^/]+$/),
    page.getByRole('button', { name: /guardar novela|guardando/i }).click(),
  ]);

  // Tras crear la novela, el form redirige a la pagina publica.
  // Navegamos al panel del autor para abrir el editor de capitulos.
  const url = new URL(page.url());
  const novelSlug = url.pathname.split('/').filter(Boolean).pop()!;
  await page.goto(`/mis-novelas/${novelSlug}/capitulos/nuevo`);
  await expect(page).toHaveURL(/\/mis-novelas\/.+\/capitulos\/nuevo$/);

  await page.getByTestId('chapter-title').fill('Capitulo E2E');
  // El editor enriquecido (Quill) expone su area editable en `.ql-editor`.
  const quillEditor = page.locator('[data-testid="chapter-content"] .ql-editor');
  await expect(quillEditor).toBeVisible();
  await quillEditor.click();
  await quillEditor.fill(
    'Contenido de prueba para validar la creacion del capitulo desde el flujo E2E.',
  );

  await Promise.all([
    page.waitForURL(/\/mis-novelas\/.+\/capitulos\/.+\/editar$/),
    page.getByRole('button', { name: /^crear$|creando/i }).click(),
  ]);

  await expect(page.getByTestId('word-count')).toBeVisible();
});
