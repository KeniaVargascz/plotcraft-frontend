import { expect, test } from '@playwright/test';

test('focuses the searchbar with Ctrl+K and navigates to results on Enter', async ({ page }) => {
  await page.goto('/descubrir');
  await page.keyboard.press('Control+K');
  await expect(page.getByTestId('searchbar').locator('input')).toBeFocused();

  await page.getByTestId('searchbar').locator('input').fill('velo');
  await page.keyboard.press('Enter');

  await expect(page).toHaveURL(/\/buscar\?q=velo/);
  await expect(page.getByTestId('search-results')).toBeVisible();
});
