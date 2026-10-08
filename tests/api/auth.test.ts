import { beforeAll, describe, expect, it } from 'vitest';
import {
  ApiClient,
  ensureUser,
  loginClient,
  OTHER_EMAIL,
  PASSWORD,
  TEST_EMAIL,
  uniqueName,
} from '../helpers/api';

describe('auth API', () => {
  it('rejects unauthenticated requests on protected routes', async () => {
    const anon = new ApiClient();
    expect((await anon.get('/api/tasks')).status).toBe(401);
    expect((await anon.get('/api/dashboard/stats')).status).toBe(401);
    expect((await anon.get('/api/search?q=x')).status).toBe(401);
    expect((await anon.post('/api/ai/chat', { content: 'hi' })).status).toBe(401);
    expect((await anon.get('/api/auth/me')).status).toBe(401);
  });

  it('registers a new account', async () => {
    const email = uniqueName('vitest-register').replace(/\s+/g, '-') + '@example.com';
    const client = new ApiClient();
    const response = await client.post('/api/auth/register', {
      name: 'Register Test',
      email,
      password: PASSWORD,
    });
    expect(response.status).toBe(201);
    expect(response.json.user.email).toBe(email);
  });

  it('rejects invalid registration payloads', async () => {
    const client = new ApiClient();
    expect(
      (await client.post('/api/auth/register', { name: 'X', email: 'bad-email', password: PASSWORD }))
        .status,
    ).toBe(422);
    expect(
      (await client.post('/api/auth/register', { name: 'X', email: 'a@b.co' })).status,
    ).toBe(422);
  });

  it('rejects a duplicate email with 409', async () => {
    await ensureUser(TEST_EMAIL, 'Vitest User');
    const client = new ApiClient();
    const response = await client.post('/api/auth/register', {
      name: 'Dup',
      email: TEST_EMAIL,
      password: PASSWORD,
    });
    expect(response.status).toBe(409);
  });

  it('logs in and identifies the session user', async () => {
    const client = await loginClient(TEST_EMAIL);
    const me = await client.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.json.user.email).toBe(TEST_EMAIL);
  });

  it('rejects a wrong password', async () => {
    await ensureUser(OTHER_EMAIL, 'Other User');
    const client = new ApiClient();
    await client.login(OTHER_EMAIL, 'not-the-password');
    expect((await client.get('/api/auth/me')).status).toBe(401);
  });

  it('returns 401 from /api/auth/csrf-protected session checks when logged out', async () => {
    const anon = new ApiClient();
    expect((await anon.get('/api/auth/csrf')).status).toBe(200);
    const client = new ApiClient();
    expect((await client.get('/api/auth/csrf')).status).toBe(200);
    expect((await client.get('/api/auth/me')).status).toBe(401);
  });
});

describe('session identity across clients', () => {
  let userA: ApiClient;
  let userB: ApiClient;

  beforeAll(async () => {
    userA = await loginClient(TEST_EMAIL);
    userB = await loginClient(OTHER_EMAIL);
  });

  it('gives each account its own id', async () => {
    const a = await userA.get('/api/auth/me');
    const b = await userB.get('/api/auth/me');
    expect(a.json.user.email).toBe(TEST_EMAIL);
    expect(b.json.user.email).toBe(OTHER_EMAIL);
    expect(a.json.user.id).not.toBe(b.json.user.id);
  });
});
