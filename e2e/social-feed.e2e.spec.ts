import { expect, test } from '@playwright/test';
import { loginAsDemo } from './test-helpers';

test('creates a post and toggles follow state from profile', async ({ page }) => {
  const message = `Post E2E ${Date.now()}`;
  await loginAsDemo(page);
  await page.goto('/feed');

  await page.locator('[data-testid="post-composer"] textarea').fill(message);
  await page.getByTestId('publish-post').click();
  await expect(page.getByTestId('post-card').first()).toContainText(message);

  await page.goto('/perfil/sofia_canvas');
  const followButton = page.getByTestId('follow-btn');
  await expect(followButton).toBeVisible();
  const initialLabel = (await followButton.textContent()) ?? '';
  await followButton.click();
  await expect(followButton).not.toHaveText(initialLabel);
});
