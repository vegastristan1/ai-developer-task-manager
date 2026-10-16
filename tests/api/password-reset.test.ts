import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { ApiClient, ensureUser, uniqueName } from '../helpers/api';
import { prisma } from '@/lib/db/prisma';

function uniqueEmail(prefix: string): string {
  return `${uniqueName(prefix).replace(/\s+/g, '-')}-reset@example.com`;
}

async function latestTokenFor(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!user) return null;
  const record = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, usedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { tokenHash: true },
  });
  return record?.tokenHash ?? null;
}

describe('forgot password API', () => {
  it('always returns ok, even for unknown emails', async () => {
    const anon = new ApiClient();
    const response = await anon.post('/api/auth/forgot', {
      email: uniqueEmail('vitest-forgot-unknown'),
    });
    expect(response.status).toBe(200);
    expect(response.json.ok).toBe(true);
  });

  it('rejects invalid email payloads', async () => {
    const anon = new ApiClient();
    expect((await anon.post('/api/auth/forgot', { email: 'bad-email' })).status).toBe(422);
  });
});

describe('reset password API', () => {
  it('creates a reset token for a known email (still returns plain ok)', async () => {
    const email = uniqueEmail('vitest-reset-ok');
    await ensureUser(email, 'Reset Ok');
    const anon = new ApiClient();
    const response = await anon.post('/api/auth/forgot', { email });
    expect(response.status).toBe(200);
    expect(response.json.ok).toBe(true);

    const stored = await latestTokenFor(email);
    expect(stored).not.toBeNull();

    // A guessed token is rejected without revealing anything.
    const garbage = await anon.post('/api/auth/reset', {
      token: '0'.repeat(64),
      newPassword: `reset-ok-${Date.now()}`,
      confirmPassword: `reset-ok-${Date.now()}`,
    });
    expect(garbage.status).toBe(400);
  });

  it('rejects mismatched confirmation', async () => {
    const anon = new ApiClient();
    const response = await anon.post('/api/auth/reset', {
      token: 'a'.repeat(64),
      newPassword: 'brand-new-pass-1',
      confirmPassword: 'different-pass-2',
    });
    expect(response.status).toBe(422);
  });

  it('rejects short passwords', async () => {
    const anon = new ApiClient();
    const response = await anon.post('/api/auth/reset', {
      token: 'b'.repeat(64),
      newPassword: 'short',
      confirmPassword: 'short',
    });
    expect(response.status).toBe(422);
  });
});

describe('reset token single-use and expiry', () => {
  it('marks a consumed token used so it cannot be replayed', async () => {
    const email = uniqueEmail('vitest-reset-once');
    const next = `reset-once-${Date.now()}`;
    await ensureUser(email, 'Reset Once');
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    expect(user).not.toBeNull();

    // Simulate an issued token directly (raw token never leaves the email).
    const raw = `raw-token-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const tokenHash = createHash('sha256').update(raw).digest('hex');
    await prisma.passwordResetToken.create({
      data: { userId: user!.id, tokenHash, expiresAt: new Date(Date.now() + 3_600_000) },
    });

    const anon = new ApiClient();
    const first = await anon.post('/api/auth/reset', {
      token: raw,
      newPassword: next,
      confirmPassword: next,
    });
    expect(first.status).toBe(200);

    const replay = await anon.post('/api/auth/reset', {
      token: raw,
      newPassword: `other-${Date.now()}`,
      confirmPassword: `other-${Date.now()}`,
    });
    expect(replay.status).toBe(400);

    const fresh = new ApiClient();
    await fresh.login(email, next);
    expect((await fresh.get('/api/auth/me')).status).toBe(200);
  });

  it('rejects expired tokens', async () => {
    const email = uniqueEmail('vitest-reset-expired');
    await ensureUser(email, 'Reset Expired');
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    const raw = `expired-token-${Date.now()}`;
    await prisma.passwordResetToken.create({
      data: {
        userId: user!.id,
        tokenHash: createHash('sha256').update(raw).digest('hex'),
        expiresAt: new Date(Date.now() - 1_000),
      },
    });

    const anon = new ApiClient();
    const response = await anon.post('/api/auth/reset', {
      token: raw,
      newPassword: 'some-new-pass-9',
      confirmPassword: 'some-new-pass-9',
    });
    expect(response.status).toBe(400);
  });
});
