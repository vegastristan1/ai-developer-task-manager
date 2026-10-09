export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const MAX_TRACKED_KEYS = 10_000;

const buckets = new Map<string, number[]>();

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((time) => time > cutoff);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    const oldest = hits[0] ?? now;
    const waitMs = Math.max(0, oldest + windowMs - now);
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1000)),
    };
  }

  hits.push(now);
  buckets.set(key, hits);
  prune(cutoff);
  return { ok: true, remaining: limit - hits.length, retryAfterSeconds: 0 };
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

export function resetRateLimits(): void {
  buckets.clear();
}

function prune(cutoff: number): void {
  if (buckets.size <= MAX_TRACKED_KEYS) return;
  for (const [key, hits] of buckets) {
    const live = hits.filter((time) => time > cutoff);
    if (live.length === 0) buckets.delete(key);
    else buckets.set(key, live);
  }
  if (buckets.size > MAX_TRACKED_KEYS) buckets.clear();
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  return realIp || 'unknown';
}
