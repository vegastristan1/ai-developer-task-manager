import { expect, test } from '@playwright/test';
import { loginViaUi } from './helpers';

test.describe('tasks', () => {
  test('creates a task through the form and cleans it up', async ({ page }) => {
    await loginViaUi(page);

    const title = `E2E task ${Date.now()}`;

    await page.goto('/tasks/new');
    await page.fill('#title', title);

    await page.locator('button[aria-label="Project"]').click();
    await page.getByRole('option', { name: 'E-commerce API' }).click();

    await page.getByRole('button', { name: 'Create task' }).click();

    await page.waitForURL(/\/tasks\/[A-Za-z0-9]+/);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    const taskId = new URL(page.url()).pathname.split('/').pop() as string;
    const deleted = await page.request.delete(`/api/tasks/${taskId}`);
    expect(deleted.status()).toBe(200);

    const missing = await page.request.get(`/api/tasks/${taskId}`);
    expect(missing.status()).toBe(404);
  });

  test('lists seeded tasks with filters', async ({ page }) => {
    await loginViaUi(page);

    await page.goto('/tasks');
    await expect(page.getByText('Design PostgreSQL schema for core entities')).toBeVisible();

    await page.goto('/tasks?status=DONE');
    await expect(page.getByText('Design PostgreSQL schema for core entities')).toBeVisible();

    await page.goto('/tasks?status=IN_REVIEW');
    await expect(page.getByText('Design PostgreSQL schema for core entities')).toHaveCount(0);
  });
});
