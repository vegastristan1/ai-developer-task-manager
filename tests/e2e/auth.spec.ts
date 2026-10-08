import { expect, test } from '@playwright/test';
import { E2E_EMAIL, E2E_PASSWORD } from './helpers';

test.describe('authentication', () => {
  test('redirects unauthenticated visitors from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('logs in with valid credentials and lands on the dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', E2E_EMAIL);
    await page.fill('#password', E2E_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard');
    await expect(page.getByText('Dashboard').first()).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test('stays on /login with an error toast for a wrong password', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', E2E_EMAIL);
    await page.fill('#password', 'definitely-wrong');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('protects other app routes', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page).toHaveURL(/\/login$/);
  });
});
