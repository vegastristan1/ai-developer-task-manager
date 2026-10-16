import { describe, expect, it } from 'vitest';
import { ApiClient, ensureUser, PASSWORD, uniqueName } from '../helpers/api';

function uniqueEmail(prefix: string): string {
  return `${uniqueName(prefix).replace(/\s+/g, '-')}-pw@example.com`;
}

describe('password change API', () => {
  it('rejects unauthenticated password changes', async () => {
    const anon = new ApiClient();
    const response = await anon.patch('/api/auth/password', {
      currentPassword: PASSWORD,
      newPassword: 'brand-new-password-1',
      confirmPassword: 'brand-new-password-1',
    });
    expect(response.status).toBe(401);
  });

  it('rejects a wrong current password without changing anything', async () => {
    const email = uniqueEmail('vitest-pw-wrong');
    await ensureUser(email, 'Pw Wrong');
    const client = new ApiClient();
    await client.login(email);
    const response = await client.patch('/api/auth/password', {
      currentPassword: 'not-the-current-password',
      newPassword: 'brand-new-password-2',
      confirmPassword: 'brand-new-password-2',
    });
    expect(response.status).toBe(401);

    // Old password still works.
    const retry = new ApiClient();
    await retry.login(email);
    expect((await retry.get('/api/auth/me')).status).toBe(200);
  });

  it('rejects mismatched confirmation', async () => {
    const email = uniqueEmail('vitest-pw-mismatch');
    await ensureUser(email, 'Pw Mismatch');
    const client = new ApiClient();
    await client.login(email);
    const response = await client.patch('/api/auth/password', {
      currentPassword: PASSWORD,
      newPassword: 'brand-new-password-3',
      confirmPassword: 'something-else-123',
    });
    expect(response.status).toBe(422);
    expect(JSON.stringify(response.json.issues)).toContain('confirmPassword');
  });

  it('rejects a short new password', async () => {
    const email = uniqueEmail('vitest-pw-short');
    await ensureUser(email, 'Pw Short');
    const client = new ApiClient();
    await client.login(email);
    const response = await client.patch('/api/auth/password', {
      currentPassword: PASSWORD,
      newPassword: 'short',
      confirmPassword: 'short',
    });
    expect(response.status).toBe(422);
  });

  it('rejects a new password identical to the current one', async () => {
    const email = uniqueEmail('vitest-pw-same');
    await ensureUser(email, 'Pw Same');
    const client = new ApiClient();
    await client.login(email);
    const response = await client.patch('/api/auth/password', {
      currentPassword: PASSWORD,
      newPassword: PASSWORD,
      confirmPassword: PASSWORD,
    });
    expect(response.status).toBe(422);
  });

  it('changes the password and the new one works', async () => {
    const email = uniqueEmail('vitest-pw-ok');
    const next = `changed-password-${Date.now()}`;
    await ensureUser(email, 'Pw Ok');
    const client = new ApiClient();
    await client.login(email);
    const response = await client.patch('/api/auth/password', {
      currentPassword: PASSWORD,
      newPassword: next,
      confirmPassword: next,
    });
    expect(response.status).toBe(200);

    const stale = new ApiClient();
    await stale.login(email, PASSWORD);
    expect((await stale.get('/api/auth/me')).status).toBe(401);

    const fresh = new ApiClient();
    await fresh.login(email, next);
    const me = await fresh.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.json.user.email).toBe(email);
  });
});

describe('profile avatar API', () => {
  it('rejects unauthenticated profile updates', async () => {
    const anon = new ApiClient();
    expect((await anon.patch('/api/auth/me', { name: 'X' })).status).toBe(401);
  });

  it('saves a valid avatar URL and returns it', async () => {
    const email = uniqueEmail('vitest-avatar');
    await ensureUser(email, 'Avatar Test');
    const client = new ApiClient();
    await client.login(email);
    const image = 'https://example.com/avatar.png';
    const response = await client.patch('/api/auth/me', { name: 'Avatar Test', image });
    expect(response.status).toBe(200);
    expect(response.json.user.image).toBe(image);

    const me = await client.get('/api/auth/me');
    expect(me.json.user.image).toBe(image);
  });

  it('rejects an invalid avatar URL', async () => {
    const email = uniqueEmail('vitest-avatar-bad');
    await ensureUser(email, 'Avatar Bad');
    const client = new ApiClient();
    await client.login(email);
    const response = await client.patch('/api/auth/me', {
      name: 'Avatar Bad',
      image: 'not-a-url',
    });
    expect(response.status).toBe(422);
    expect(JSON.stringify(response.json.issues)).toContain('image');
  });

  it('clears the avatar with an empty string', async () => {
    const email = uniqueEmail('vitest-avatar-clear');
    await ensureUser(email, 'Avatar Clear');
    const client = new ApiClient();
    await client.login(email);
    await client.patch('/api/auth/me', {
      name: 'Avatar Clear',
      image: 'https://example.com/avatar.png',
    });
    const cleared = await client.patch('/api/auth/me', { name: 'Avatar Clear', image: '' });
    expect(cleared.status).toBe(200);
    expect(cleared.json.user.image).toBeNull();
  });
});

describe('data export API', () => {
  it('rejects unauthenticated export requests', async () => {
    const anon = new ApiClient();
    expect((await anon.get('/api/auth/export')).status).toBe(401);
  });

  it('exports the signed-in user data without secrets', async () => {
    const email = uniqueEmail('vitest-export');
    await ensureUser(email, 'Export Test');
    const client = new ApiClient();
    await client.login(email);
    const response = await client.get('/api/auth/export');
    expect(response.status).toBe(200);
    expect(response.json.user.email).toBe(email);
    expect(response.json.user.passwordHash).toBeUndefined();
    expect(JSON.stringify(response.json)).not.toContain('passwordHash');
    expect(Array.isArray(response.json.user.projects)).toBe(true);
    expect(typeof response.json.exportedAt).toBe('string');
  });
});
