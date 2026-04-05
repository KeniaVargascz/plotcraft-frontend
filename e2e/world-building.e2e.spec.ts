import { expect, test } from '@playwright/test';
import { loginAsDemo } from './test-helpers';

test('loads world-building workspace and map shell for the seeded demo world', async ({ page }) => {
  await loginAsDemo(page);
  await page.goto('/mis-mundos/el-mundo-del-velo/world-building');
  await expect(page.getByTestId('wb-sidebar')).toBeVisible();
  await expect(page.getByTestId('wb-entry-card').first()).toBeVisible();

  await page.goto('/mis-mundos/el-mundo-del-velo/mapa');
  await expect(page.getByTestId('map-canvas')).toBeVisible();
});
