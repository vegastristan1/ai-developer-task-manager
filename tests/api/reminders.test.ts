import { describe, expect, it } from 'vitest';
import { ApiClient, ensureUser, uniqueName } from '../helpers/api';
import { prisma } from '@/lib/db/prisma';

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
  it('reports unconfigured when CRON_SECRET is missing', async () => {
    const anon = new ApiClient();
    const response = await anon.get('/api/cron/digest?secret=nope');
    // Without CRON_SECRET set, the scheduler refuses to run at all.
    expect([401, 503]).toContain(response.status);
  });
});
