import { NextResponse } from 'next/server';
import { checkRateLimit } from './rate-limit';

export function tooManyRequests(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests', retryAfterSeconds },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
  );
}

export function rateLimitResponse(
  key: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const result = checkRateLimit(key, limit, windowMs);
  if (result.ok) return null;
  return tooManyRequests(result.retryAfterSeconds);
}
