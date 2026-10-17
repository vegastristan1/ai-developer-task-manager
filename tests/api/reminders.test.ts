import { describe, expect, it } from 'vitest';
import { ApiClient, ensureUser, TEST_BASE_URL, uniqueName } from '../helpers/api';
import { prisma } from '@/lib/db/prisma';
import { TEST_CRON_SECRET } from '../setup/global';

function uniqueEmail(prefix: string): string {
  return `${uniqueName(prefix).replace(/\s+/g, '-')}-digest@example.com`;
}

describe('reminders email API', () => {
  it('rejects unauthenticated requests', async () => {
    const anon = new ApiClient();
    expect((await anon.post('/api/reminders/email', {})).status).toBe(401);
  });

  it('emails the summary with live counts', async () => {
    const email = uniqueEmail('vitest-digest');
    await ensureUser(email, 'Digest Test');
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    const project = await prisma.project.create({
      data: { name: 'Digest Fixture', userId: user!.id },
    });
    await prisma.task.create({
      data: {
        title: 'Digest overdue',
        projectId: project.id,
        dueDate: new Date(Date.now() - 86400000),
      },
    });

    const client = new ApiClient();
    await client.login(email);
    const response = await client.post('/api/reminders/email', {});
    expect(response.status).toBe(200);
    expect(response.json.ok).toBe(true);
    expect(response.json.counts.overdue).toBe(1);

    await prisma.task.deleteMany({ where: { projectId: project.id } });
    await prisma.project.deleteMany({ where: { id: project.id } });
  });
});

describe('digest scheduler API', () => {
  // Every call targets a throwaway account via ?email= — an untargeted run
  // mails every approved user (RESEND_API_KEY is live in local env).
  it('rejects a wrong secret, as query and as bearer', async () => {
    const anon = new ApiClient();
    expect((await anon.get('/api/cron/digest?secret=nope')).status).toBe(401);

    const response = await fetch(`${TEST_BASE_URL}/api/cron/digest`, {
      headers: { Authorization: 'Bearer nope' },
    });
    expect(response.status).toBe(401);
  });

  it('accepts the Vercel Cron bearer header and skips users with nothing to report', async () => {
    // Created straight in the DB: registering would count against the shared
    // per-IP register rate limit the suite already runs near the edge of.
    const email = uniqueEmail('vitest-cron-bearer');
    await prisma.user.create({
      data: { email, name: 'Cron Bearer', passwordHash: 'test-only-no-login', approved: true },
    });

    const response = await fetch(`${TEST_BASE_URL}/api/cron/digest?email=${email}`, {
      headers: { Authorization: `Bearer ${TEST_CRON_SECRET}` },
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.ok).toBe(true);
    expect(json.mailed).toBe(1);
    // No overdue/due-soon/blocked tasks -> no email on Sunday.
    expect(json.results[0]).toMatchObject({ email, total: 0, delivered: 'skipped' });
  });

  it('accepts the ?secret= form and mails users with items', async () => {
    const email = uniqueEmail('vitest-cron-send');
    await prisma.user.create({
      data: { email, name: 'Cron Send', passwordHash: 'test-only-no-login', approved: true },
    });
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    const project = await prisma.project.create({
      data: { name: 'Cron Fixture', userId: user!.id },
    });
    await prisma.task.create({
      data: {
        title: 'Cron overdue',
        projectId: project.id,
        dueDate: new Date(Date.now() - 86400000),
      },
    });

    try {
      const anon = new ApiClient();
      const response = await anon.get(`/api/cron/digest?secret=${TEST_CRON_SECRET}&email=${email}`);
      expect(response.status).toBe(200);
      expect(response.json.ok).toBe(true);
      expect(response.json.mailed).toBe(1);
      expect(response.json.results[0].total).toBeGreaterThan(0);
      expect(['resend', 'log']).toContain(response.json.results[0].delivered);
    } finally {
      await prisma.task.deleteMany({ where: { projectId: project.id } });
      await prisma.project.deleteMany({ where: { id: project.id } });
    }
  });
});
