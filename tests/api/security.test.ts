import { describe, expect, it } from 'vitest';
import { ensureUser, loginClient, PASSWORD, TEST_BASE_URL, uniqueName } from '../helpers/api';

async function loginAttempt(email: string, password: string, ip: string): Promise<Response> {
  const csrfResponse = await fetch(`${TEST_BASE_URL}/api/auth/csrf`);
  const setCookies =
    typeof csrfResponse.headers.getSetCookie === 'function'
      ? csrfResponse.headers.getSetCookie()
      : [];
  const cookieHeader = setCookies.map((raw) => raw.split(';')[0]).join('; ');
  const { csrfToken } = await csrfResponse.json();

  return fetch(`${TEST_BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookieHeader,
      'X-Forwarded-For': ip,
    },
    body: new URLSearchParams({ csrfToken, email, password, json: 'true' }),
    redirect: 'manual',
  });
}

describe('security controls', () => {
  it('sets baseline security headers on pages and API responses', async () => {
    const page = await fetch(`${TEST_BASE_URL}/login`);
    expect(page.status).toBe(200);
    expect(page.headers.get('x-content-type-options')).toBe('nosniff');
    expect(page.headers.get('x-frame-options')).toBe('DENY');
    expect(page.headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
    expect(page.headers.get('permissions-policy')).toBe('camera=(), microphone=(), geolocation=()');
    expect(page.headers.get('cross-origin-opener-policy')).toBe('same-origin');
    expect(page.headers.get('cross-origin-resource-policy')).toBe('same-origin');
    expect(page.headers.get('strict-transport-security')).toContain('max-age=63072000');

    const api = await fetch(`${TEST_BASE_URL}/api/auth/me`);
    expect(api.status).toBe(401);
    expect(api.headers.get('x-content-type-options')).toBe('nosniff');
    expect(api.headers.get('x-frame-options')).toBe('DENY');
    expect(api.headers.get('strict-transport-security')).toContain('max-age=');
  });

  it('does not expose CORS headers', async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/auth/me`, {
      headers: { Origin: 'https://evil.example' },
    });
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
    expect(response.headers.get('access-control-allow-credentials')).toBeNull();
  });

  it('rejects oversized registration payloads with 413', async () => {
    const response = await fetch(`${TEST_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'x'.repeat(20_000),
        email: 'oversized@example.com',
        password: PASSWORD,
      }),
    });
    expect(response.status).toBe(413);
  });

  it('rejects oversized chat payloads with 413', async () => {
    const client = await loginClient();
    const response = await client.post('/api/ai/chat', { content: 'x'.repeat(100_000) });
    expect(response.status).toBe(413);
  });

  it('rejects invalid query params with 422', async () => {
    const client = await loginClient();
    expect((await client.get('/api/ai/conversations?projectId=')).status).toBe(422);
    expect((await client.get('/api/labels')).status).toBe(422);
    expect((await client.get('/api/labels?projectId=')).status).toBe(422);
  });

  it('rate limits repeated failed logins with 429 and Retry-After', async () => {
    const ip = `198.51.100.${1 + Math.floor(Math.random() * 200)}`;
    const email = `brute-${Date.now()}@example.com`;
    await ensureUser(email, 'Brute Force');

    let attempts = 0;
    let blocked: Response | null = null;
    for (; attempts < 30; attempts += 1) {
      const response = await loginAttempt(email, 'wrong-password', ip);
      if (response.status === 429) {
        blocked = response;
        break;
      }
    }

    expect(blocked).not.toBeNull();
    expect(attempts).toBe(10);
    expect(blocked!.headers.get('retry-after')).toBeTruthy();
    const body = await blocked!.json();
    expect(body.error).toBe('Too many requests');
    expect(body.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('rate limits registration attempts per IP with 429', async () => {
    const ip = `203.0.113.${1 + Math.floor(Math.random() * 200)}`;

    let attempts = 0;
    let blocked: Response | null = null;
    for (; attempts < 55; attempts += 1) {
      const response = await fetch(`${TEST_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
        body: JSON.stringify({ name: 'x', email: 'not-an-email' }),
      });
      if (response.status === 429) {
        blocked = response;
        break;
      }
      expect(response.status).toBe(422);
    }

    expect(blocked).not.toBeNull();
    expect(attempts).toBe(50);
    expect(blocked!.headers.get('retry-after')).toBeTruthy();
  });

  it('rate limits AI chat requests per user with 429', async () => {
    const client = await loginClient('vitest-chat-limit@example.com');

    let attempts = 0;
    let saw429 = false;
    for (; attempts < 30; attempts += 1) {
      const response = await client.post('/api/ai/chat', { content: `spam ${attempts}` });
      if (response.status === 429) {
        saw429 = true;
        expect(response.headers.get('retry-after')).toBeTruthy();
        expect(response.json.retryAfterSeconds).toBeGreaterThan(0);
        break;
      }
      expect(response.status).toBe(200);
    }

    expect(saw429).toBe(true);
    expect(attempts).toBe(20);
  }, 120_000);

  it('rate limits AI tool calls per user with 429', async () => {
    const client = await loginClient('vitest-tool-limit@example.com');

    const project = await client.post('/api/projects', { name: uniqueName('Tool limit') });
    expect(project.status).toBe(201);
    const task = await client.post('/api/tasks', {
      title: 'Tool limit task',
      projectId: project.json.project.id,
    });
    expect(task.status).toBe(201);

    let attempts = 0;
    let saw429 = false;
    for (; attempts < 15; attempts += 1) {
      const response = await client.post(`/api/ai/tasks/${task.json.task.id}/breakdown`, {});
      if (response.status === 429) {
        saw429 = true;
        expect(response.headers.get('retry-after')).toBeTruthy();
        break;
      }
      expect(response.status).toBe(200);
    }

    expect(saw429).toBe(true);
    expect(attempts).toBe(10);

    await client.delete(`/api/projects/${project.json.project.id}`);
  });
});
