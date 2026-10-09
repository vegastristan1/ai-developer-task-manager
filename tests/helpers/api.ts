export const TEST_BASE_URL = process.env.TEST_BASE_URL ?? 'http://localhost:4100';

export const PASSWORD = 'password123';
export const TEST_EMAIL = 'vitest-user@example.com';
export const OTHER_EMAIL = 'vitest-other@example.com';

export interface ApiResponse<T = any> {
  status: number;
  json: T;
  text: string;
  headers: Headers;
}

export class ApiClient {
  private cookies = new Map<string, string>();

  async request<T = any>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.cookies.size > 0) {
      headers.Cookie = [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
    }
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const response = await fetch(`${TEST_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'manual',
    });

    this.captureCookies(response);

    const text = await response.text();
    let json: any = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }

    return { status: response.status, json, text, headers: response.headers };
  }

  private captureCookies(response: Response): void {
    const setCookies =
      typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
    for (const raw of setCookies) {
      const pair = raw.split(';')[0];
      const separator = pair.indexOf('=');
      if (separator < 0) continue;
      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      if (!value) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }

  get<T = any>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path);
  }

  post<T = any>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  put<T = any>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body);
  }

  patch<T = any>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, body);
  }

  delete<T = any>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path);
  }

  async login(
    email: string,
    password: string = PASSWORD,
  ): Promise<{ status: number; retryAfter: string | null }> {
    const csrf = await this.get<{ csrfToken: string }>('/api/auth/csrf');
    const body = new URLSearchParams({
      csrfToken: csrf.json.csrfToken,
      email,
      password,
      json: 'true',
    });
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };
    if (this.cookies.size > 0) {
      headers.Cookie = [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
    }
    const response = await fetch(`${TEST_BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers,
      body,
      redirect: 'manual',
    });
    this.captureCookies(response);
    return { status: response.status, retryAfter: response.headers.get('retry-after') };
  }
}

export async function ensureUser(email: string, name: string): Promise<void> {
  const response = await fetch(`${TEST_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ name, email, password: PASSWORD }),
  });
  if (response.status !== 201 && response.status !== 409) {
    const text = await response.text();
    throw new Error(`ensureUser failed (${response.status}): ${text}`);
  }
}

export async function loginClient(email: string = TEST_EMAIL): Promise<ApiClient> {
  await ensureUser(email, 'Vitest User');
  const client = new ApiClient();
  await client.login(email);
  return client;
}

export function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}
