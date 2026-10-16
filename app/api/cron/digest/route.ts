import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendDigestEmail } from '@/lib/email/digest';
import { getReminders } from '@/lib/reminders';

/**
 * Scheduler endpoint for digest mailouts (Vercel Cron, GitHub Actions, ...).
 * Guarded by CRON_SECRET. Optional ?email= targets a single account,
 * otherwise every approved user is mailed. Never throws per-user failures.
 */
export async function GET(request: Request) {
  const secret = process.env['CRON_SECRET'];
  if (!secret) {
    return NextResponse.json({ error: 'Digest scheduler is not configured' }, { status: 503 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get('secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const only = url.searchParams.get('email')?.trim().toLowerCase() || null;
  const users = await prisma.user.findMany({
    where: { approved: true, ...(only ? { email: only } : {}) },
    select: { id: true, email: true, name: true },
    orderBy: { email: 'asc' },
  });

  const results: Array<{ email: string; total: number; delivered: string }> = [];
  for (const user of users) {
    try {
      const reminders = await getReminders(user.id);
      const sent = await sendDigestEmail(user.email, user.name, reminders);
      results.push({ email: user.email, total: sent.total, delivered: sent.delivered });
    } catch (error) {
      results.push({
        email: user.email,
        total: -1,
        delivered: `error: ${error instanceof Error ? error.message : 'unknown'}`,
      });
    }
  }

  return NextResponse.json({ ok: true, mailed: results.length, results });
}
