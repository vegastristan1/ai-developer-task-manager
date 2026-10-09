import { type NextRequest, NextResponse } from 'next/server';
import { handlers } from '@/lib/auth';
import { checkRateLimit, clientIp, resetRateLimit } from '@/lib/security/rate-limit';
import { tooManyRequests } from '@/lib/security/responses';

const LOGIN_WINDOW_MS = 5 * 60 * 1000;
const LOGIN_PER_EMAIL_LIMIT = 10;
const LOGIN_PER_IP_LIMIT = 100;
const MAX_LOGIN_BODY_BYTES = 8 * 1024;

export const GET = handlers.GET;

async function extractEmail(request: NextRequest): Promise<{ email: string; tooLarge: boolean }> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > MAX_LOGIN_BODY_BYTES) {
    return { email: '', tooLarge: true };
  }

  try {
    const text = await request.clone().text();
    const contentType = request.headers.get('content-type') ?? '';
    let email: unknown = null;
    if (contentType.includes('application/json')) {
      email = (JSON.parse(text) as Record<string, unknown>).email;
    } else {
      email = new URLSearchParams(text).get('email');
    }
    return {
      email: typeof email === 'string' ? email.trim().toLowerCase() : '',
      tooLarge: false,
    };
  } catch {
    return { email: '', tooLarge: false };
  }
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const { email, tooLarge } = await extractEmail(request);

  if (tooLarge) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  const emailKey = `login:${ip}:${email || 'unknown'}`;
  const emailLimit = checkRateLimit(emailKey, LOGIN_PER_EMAIL_LIMIT, LOGIN_WINDOW_MS);
  if (!emailLimit.ok) return tooManyRequests(emailLimit.retryAfterSeconds);

  const ipLimit = checkRateLimit(`login-ip:${ip}`, LOGIN_PER_IP_LIMIT, LOGIN_WINDOW_MS);
  if (!ipLimit.ok) return tooManyRequests(ipLimit.retryAfterSeconds);

  const response = await handlers.POST(request);

  const setCookies =
    typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
  const signedIn = setCookies.some((cookie) => cookie.toLowerCase().includes('session-token'));
  if (signedIn && email) resetRateLimit(emailKey);

  return response;
}
