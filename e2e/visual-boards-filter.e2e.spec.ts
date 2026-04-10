import { expect, test } from '@playwright/test';
import { loginAsDemo } from './test-helpers';

test('filters linked entity options while typing in create board dialog', async ({ page }) => {
  await loginAsDemo(page);
  await page.goto('/referencias-visuales');

  await page.getByRole('button', { name: 'Nuevo tablero' }).click();
  await page.getByText('Tipo de vinculacion').locator('..').getByRole('combobox').selectOption('world');

  const linkedInput = page.locator('.search-select-input');
  await linkedInput.click();

  const optionsBefore = page.locator('.search-select-list li');
  await expect(optionsBefore.first()).toBeVisible();
  const initialCount = await optionsBefore.count();
  expect(initialCount).toBeGreaterThan(0);

  const firstLabel = ((await optionsBefore.first().textContent()) ?? '').trim();
  const filterTerm = firstLabel.slice(0, Math.min(firstLabel.length, 4)).toLowerCase();
  expect(filterTerm.length).toBeGreaterThan(0);

  await linkedInput.fill(filterTerm);

  const optionsAfter = page.locator('.search-select-list li');
  await expect(optionsAfter.first()).toContainText(new RegExp(filterTerm, 'i'));
  expect(await optionsAfter.count()).toBeLessThanOrEqual(initialCount);

  const firstOptionButton = optionsAfter.first().getByRole('button');
  const selectedText = ((await firstOptionButton.textContent()) ?? '').trim().split('\n')[0];
  await firstOptionButton.click();
  await expect(linkedInput).toHaveValue(selectedText);
});
