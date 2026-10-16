import { expect, test } from '@playwright/test';
import { createProjectViaApi, deleteProjectViaApi, loginViaUi } from './helpers';

test.describe('settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/settings');
  });

  test('shows the Account tab by default and switches to Appearance', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /Account/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(page.getByText('Update the name shown across your dashboard.')).toBeVisible();
    await expect(
      page.getByText('Enter your current password to confirm, then choose a new one.'),
    ).toBeVisible();

    await page.getByRole('tab', { name: /Appearance/ }).click();
    await expect(page).toHaveURL(/\/settings\?tab=appearance/);
    await expect(page.getByText('Choose how the app looks on this device.')).toBeVisible();
    await expect(page.getByText('Choose the loading look for dashboard pages.')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('tab', { name: /Appearance/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('flags mismatched new passwords without contacting the API', async ({ page }) => {
    await page.fill('#password-current', 'password123');
    await page.fill('#password-new', 'mismatched-one-1');
    await page.fill('#password-confirm', 'mismatched-two-2');
    await page.getByRole('button', { name: 'Update password' }).click();
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('downloads the workspace export as JSON', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download JSON export/ }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('workspace-export');
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test('shows the AI tab with response style options', async ({ page }) => {
    await page.getByRole('tab', { name: /^AI/ }).click();
    await expect(page).toHaveURL(/\/settings\?tab=ai/);
    await expect(
      page.getByText('Applies to AI chat and task actions like breakdowns, plans, and reviews.'),
    ).toBeVisible();
    for (const label of ['Concise', 'Balanced', 'Detailed']) {
      await expect(page.getByRole('radio', { name: new RegExp(label) })).toBeVisible();
    }
  });
});

test.describe('reminders', () => {
  test('lists an overdue task under Overdue', async ({ page }) => {
    await loginViaUi(page);
    const projectId = await createProjectViaApi(page, 'E2E Reminder Fixture');
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const title = `E2E overdue ${Date.now()}`;
    const created = await page.request.post('/api/tasks', {
      data: { title, projectId, dueDate: yesterday },
    });
    expect(created.status()).toBe(201);

    await page.goto('/reminders');
    await expect(page.getByText(title)).toBeVisible();

    await deleteProjectViaApi(page, projectId);
  });
});

test.describe('delete account danger zone', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaUi(page);
    await page.goto('/settings');
  });

  test('keeps delete disabled until email and password are entered', async ({ page }) => {
    const deleteButton = page.getByRole('button', { name: 'Delete my account', exact: true });
    await expect(deleteButton).toBeDisabled();
    await page.fill('#delete-confirm', 'alex@example.com');
    await expect(deleteButton).toBeDisabled();
    await page.fill('#delete-password', 'password123');
    await expect(deleteButton).toBeEnabled();
  });

  test('cancel in the confirm dialog keeps the account', async ({ page }) => {
    await page.fill('#delete-confirm', 'alex@example.com');
    await page.fill('#delete-password', 'password123');
    await page.getByRole('button', { name: 'Delete my account', exact: true }).click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog.getByText('Delete your account?')).toBeVisible();
    await expect(dialog.getByText('cannot be undone', { exact: false })).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Delete your account?')).toBeHidden();
    await expect(page).toHaveURL(/\/settings$/);
  });
});

test.describe('forgot and reset password pages', () => {
  test('sends a reset link request and shows confirmation', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.fill('#email', 'alex@example.com');
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByText('a reset link is on its way')).toBeVisible();
  });

  test('rejects an expired reset link', async ({ page }) => {
    await page.goto('/reset-password/does-not-exist-123');
    await page.fill('#newPassword', 'some-new-pass-1');
    await page.fill('#confirmPassword', 'some-new-pass-1');
    await page.getByRole('button', { name: 'Reset password' }).click();
    await expect(page.getByText('invalid or has expired')).toBeVisible();
  });

  test('flags mismatched passwords on the reset page', async ({ page }) => {
    await page.goto('/reset-password/does-not-exist-123');
    await page.fill('#newPassword', 'mismatched-one-1');
    await page.fill('#confirmPassword', 'mismatched-two-2');
    await page.getByRole('button', { name: 'Reset password' }).click();
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });
});
