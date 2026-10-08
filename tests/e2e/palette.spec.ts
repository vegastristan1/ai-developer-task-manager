import { expect, test } from '@playwright/test';
import { loginViaUi } from './helpers';

test.describe('command palette', () => {
  test('opens with Ctrl+K and navigates via keyboard', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/dashboard');

    await page.keyboard.press('Control+k');
    const input = page.getByRole('textbox', { name: 'Command palette search' });
    await expect(input).toBeVisible();

    await input.fill('Board');
    // "dashboard" also contains "board", so two options match; pick Board explicitly.
    const boardOption = page.getByRole('option', { name: 'Board Navigate', exact: true });
    await expect(boardOption).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await expect(boardOption).toHaveAttribute('data-active', 'true');
    await page.keyboard.press('Enter');

    await page.waitForURL('**/board');
    await expect(page.getByRole('heading', { name: 'Board' })).toBeVisible();
  });

  test('opens with the / shortcut when no input is focused', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/dashboard');

    await page.keyboard.press('/');
    await expect(page.getByRole('textbox', { name: 'Command palette search' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('textbox', { name: 'Command palette search' })).toHaveCount(0);
  });

  test('filters commands and shows an empty state for nonsense', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/dashboard');

    await page.keyboard.press('Control+k');
    const input = page.getByRole('textbox', { name: 'Command palette search' });
    await input.fill('New task');
    await expect(page.getByRole('option', { name: /New task/ })).toBeVisible();

    await input.fill('zzzzz-no-such-command');
    await expect(page.getByText(/No results for/)).toBeVisible();
  });
});
