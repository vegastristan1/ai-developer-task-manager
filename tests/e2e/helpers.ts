import { expect, type Page } from '@playwright/test';

export const E2E_EMAIL = 'alex@example.com';
export const E2E_PASSWORD = 'password123';

export async function loginViaUi(
  page: Page,
  email: string = E2E_EMAIL,
  password: string = E2E_PASSWORD,
): Promise<void> {
  await page.goto('/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
}

export async function openCommandPalette(page: Page, key = 'Control+k'): Promise<void> {
  const input = page.getByRole('textbox', { name: 'Command palette search' });
  // The global shortcut listener only mounts after hydration, so a key press
  // right after navigation can be dropped. Retry until the dialog opens.
  for (let attempt = 0; attempt < 10; attempt++) {
    if (await input.isVisible()) return;
    await page.keyboard.press(key);
    await page.waitForTimeout(300);
  }
  await expect(input).toBeVisible();
}

export async function createProjectViaApi(page: Page, name: string): Promise<string> {
  const response = await page.request.post('/api/projects', {
    data: { name },
  });
  if (response.status() !== 201) {
    throw new Error(`project create failed: ${response.status()} ${await response.text()}`);
  }
  const body = await response.json();
  return body.project.id as string;
}

export async function deleteProjectViaApi(page: Page, projectId: string): Promise<void> {
  await page.request.delete(`/api/projects/${projectId}`);
}
