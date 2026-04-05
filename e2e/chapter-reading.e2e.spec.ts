import { expect, test } from '@playwright/test';

test('opens a published chapter and exposes reader controls', async ({ page, request }) => {
  const response = await request.get(
    'http://localhost:3000/api/novels/las-cronicas-del-velo/chapters',
  );
  const payload = await response.json();
  const chapterSlug = payload.data?.data?.[0]?.slug;

  expect(chapterSlug).toBeTruthy();

  await page.goto(`/novelas/las-cronicas-del-velo/${chapterSlug}`);
  await expect(page.getByTestId('chapter-content')).toBeVisible();
  await expect(page.getByTestId('reader-settings')).toBeVisible();
  await page.getByTestId('reader-settings').click();
  await expect(page.getByTestId('font-size-slider')).toBeVisible();
  await expect(page.getByTestId('progress-bar')).toBeVisible();
});
