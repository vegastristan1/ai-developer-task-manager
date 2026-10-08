import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkRateLimit,
  clientIp,
  resetRateLimit,
  resetRateLimits,
} from '@/lib/security/rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimits();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows up to the limit and blocks the next attempt', () => {
    for (let i = 0; i < 3; i += 1) {
      const result = checkRateLimit('key', 3, 60_000);
      expect(result.ok).toBe(true);
      expect(result.remaining).toBe(2 - i);
    }

    const blocked = checkRateLimit('key', 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('tracks keys independently', () => {
    expect(checkRateLimit('a', 1, 60_000).ok).toBe(true);
    expect(checkRateLimit('a', 1, 60_000).ok).toBe(false);
    expect(checkRateLimit('b', 1, 60_000).ok).toBe(true);
  });

  it('frees capacity once the window slides', () => {
    expect(checkRateLimit('key', 1, 60_000).ok).toBe(true);
    expect(checkRateLimit('key', 1, 60_000).ok).toBe(false);

    vi.setSystemTime(new Date('2026-01-01T00:01:01.000Z'));
    expect(checkRateLimit('key', 1, 60_000).ok).toBe(true);
  });

  it('computes retry-after from the oldest hit in the window', () => {
    expect(checkRateLimit('key', 2, 60_000).ok).toBe(true);
    vi.setSystemTime(new Date('2026-01-01T00:00:30.000Z'));
    expect(checkRateLimit('key', 2, 60_000).ok).toBe(true);

    const blocked = checkRateLimit('key', 2, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(30);
  });

  it('resets a key on demand', () => {
    expect(checkRateLimit('key', 1, 60_000).ok).toBe(true);
    expect(checkRateLimit('key', 1, 60_000).ok).toBe(false);
    resetRateLimit('key');
    expect(checkRateLimit('key', 1, 60_000).ok).toBe(true);
  });
});

describe('clientIp', () => {
  it('prefers the first x-forwarded-for hop', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' },
    });
    expect(clientIp(request)).toBe('203.0.113.9');
  });

  it('falls back to x-real-ip and then a placeholder', () => {
    const withRealIp = new Request('http://localhost', {
      headers: { 'x-real-ip': '198.51.100.2' },
    });
    expect(clientIp(withRealIp)).toBe('198.51.100.2');
    expect(clientIp(new Request('http://localhost'))).toBe('unknown');
  });
});
