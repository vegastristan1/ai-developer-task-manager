import { expect, test } from '@playwright/test';
import { loginViaUi } from './helpers';

test.describe('search page', () => {
  test('shows an empty state before searching', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/search');
    await expect(page.getByText('Search everything')).toBeVisible();
  });

  test('finds the seeded schema task by query', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/search?q=schema');

    await expect(page.getByText('Design PostgreSQL schema for core entities')).toBeVisible();
    await expect(page.getByText('Tasks (', { exact: false }).first()).toBeVisible();
  });

  test('shows the no-results state for a query with no hits', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/search?q=zzzz-no-such-thing-zzzz');
    await expect(page.getByText(/No results for/)).toBeVisible();
  });

  test('finds seeded projects', async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/search?q=E-commerce');
    await expect(page.getByText('E-commerce API')).toBeVisible();
  });
});
