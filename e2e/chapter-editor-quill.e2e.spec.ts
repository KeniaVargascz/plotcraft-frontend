import { expect, test } from '@playwright/test';
import { loginAsDemo } from './test-helpers';

const API = 'http://localhost:3000/api';

async function getDemoToken(): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'demo@plotcraft.com', password: 'Demo1234!' }),
  });
  const json = await res.json();
  return json.data.accessToken;
}

async function createNovel(token: string): Promise<string> {
  const langs = await fetch(`${API}/catalogs/languages`).then((r) => r.json());
  const languageId = langs.data[0].id;
  const res = await fetch(`${API}/novels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      title: `E2E Quill ${Date.now()}`,
      synopsis: 'Sinopsis e2e',
      status: 'DRAFT',
      rating: 'G',
      languageId,
      genreIds: [],
      tags: [],
      warnings: [],
      isPublic: false,
      romanceGenreIds: [],
      pairings: [],
      isAlternateUniverse: false,
      novelType: 'ORIGINAL',
    }),
  });
  const json = await res.json();
  return json.data.slug;
}

/**
 * Verifica end-to-end el editor enriquecido (Quill) en el flujo de creacion de capitulo:
 *  - Toolbar minimalista (sin colores, tablas, links, imagenes, videos)
 *  - Botones esperados: bold, italic, size, align x4, indent x2, listas
 *  - Escritura, formato (bold/italic), conteo de palabras
 *  - Persistencia: guardar -> recargar -> contenido y formato se mantienen
 */
test('quill chapter editor renders, formats and persists content', async ({ page }) => {
  // Setup via API: crear una novela limpia para no depender del form.
  const token = await getDemoToken();
  const novelSlug = await createNovel(token);

  // Login UI para sembrar la cookie/localStorage de Angular.
  await loginAsDemo(page);

  await page.goto(`/mis-novelas/${novelSlug}/capitulos/nuevo`);
  await expect(page).toHaveURL(/\/capitulos\/nuevo$/);

  // 1) Toolbar minimalista: solo lo solicitado.
  const toolbar = page.locator('[data-testid="chapter-content"] .ql-toolbar');
  await expect(toolbar).toBeVisible();
  await expect(toolbar.locator('button.ql-bold')).toHaveCount(1);
  await expect(toolbar.locator('button.ql-italic')).toHaveCount(1);
  await expect(toolbar.locator('select.ql-size, span.ql-size')).toHaveCount(2);

  // El picker de tamano debe mostrar etiquetas distintas (no todas "Normal").
  const sizeLabel = toolbar.locator('span.ql-picker.ql-size .ql-picker-label');
  await sizeLabel.click();
  const sizeOptions = toolbar.locator('span.ql-picker.ql-size .ql-picker-item');
  const labels = await sizeOptions.evaluateAll((els) =>
    els.map((el) => getComputedStyle(el, '::before').content.replace(/^"|"$/g, '')),
  );
  expect(labels).toEqual(['Pequeno', 'Normal', 'Grande', 'Muy grande']);
  await sizeLabel.click(); // cerrar dropdown
  await expect(toolbar.locator('button.ql-align')).toHaveCount(4);
  await expect(toolbar.locator('button.ql-indent')).toHaveCount(2);
  await expect(toolbar.locator('button.ql-list[value="bullet"]')).toHaveCount(1);
  await expect(toolbar.locator('button.ql-list[value="ordered"]')).toHaveCount(1);
  // No deben aparecer formatos no solicitados.
  await expect(
    toolbar.locator('.ql-color, .ql-background, .ql-link, .ql-image, .ql-video, .ql-code-block'),
  ).toHaveCount(0);

  // 2) Escribir contenido y aplicar bold + italic.
  await page.getByTestId('chapter-title').fill('Capitulo Quill E2E');
  const editor = page.locator('[data-testid="chapter-content"] .ql-editor');
  await expect(editor).toBeVisible();
  await editor.click();
  const sample = 'Texto de prueba para validar el editor enriquecido.';
  await editor.fill(sample);
  await editor.press('Control+A');
  await toolbar.locator('button.ql-bold').click();
  await toolbar.locator('button.ql-italic').click();

  const html = await editor.innerHTML();
  expect(html).toMatch(/<strong>/);
  expect(html).toMatch(/<em>/);

  // 3) Conteo de palabras: 8 palabras en el sample.
  await expect(page.getByTestId('word-count')).toHaveText(/8 palabras/);

  // 4) Guardar y verificar redireccion al editor del capitulo.
  await Promise.all([
    page.waitForURL(/\/mis-novelas\/.+\/capitulos\/.+\/editar$/),
    page.getByRole('button', { name: /^crear$|creando/i }).click(),
  ]);
  const editorUrl = page.url();

  // 5) Recargar: el contenido HTML con formato persiste.
  await page.goto(editorUrl);
  const reloaded = page.locator('[data-testid="chapter-content"] .ql-editor');
  await expect(reloaded).toBeVisible();
  await expect(reloaded).toContainText(sample);
  expect(await reloaded.innerHTML()).toMatch(/<strong>|<em>/);
});
