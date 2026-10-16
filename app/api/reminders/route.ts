import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export const DUE_SOON_DAYS = 3;
const LIMIT = 50;

const select = {
  id: true,
  title: true,
  status: true,
  priority: true,
  dueDate: true,
  projectId: true,
  project: { select: { id: true, name: true } },
} as const;

/**
 * Computed-live reminders for the caller — no stored state.
 * overdue: past due and not done. dueSoon: due within DUE_SOON_DAYS (not
 * overdue, not done). blocked: status BLOCKED (and not done).
 */
export async function GET() {
  const { session, response } = await requireAuth();

  if (!session) {
    return response;
  }

  const now = new Date();
  const soon = new Date(now.getTime() + DUE_SOON_DAYS * 24 * 60 * 60 * 1000);
  const owned = { project: { userId: session.user.id } };

  const [overdue, dueSoon, blocked] = await Promise.all([
    prisma.task.findMany({
      where: { ...owned, status: { not: 'DONE' }, dueDate: { lt: now } },
      select,
      orderBy: { dueDate: 'asc' },
      take: LIMIT,
    }),
    prisma.task.findMany({
      where: {
        ...owned,
        status: { not: 'DONE' },
        dueDate: { gte: now, lte: soon },
      },
      select,
      orderBy: { dueDate: 'asc' },
      take: LIMIT,
    }),
    prisma.task.findMany({
      where: { ...owned, status: 'BLOCKED' },
      select,
      orderBy: { updatedAt: 'desc' },
      take: LIMIT,
    }),
  ]);

  return NextResponse.json({
    overdue,
    dueSoon,
    blocked,
    counts: { overdue: overdue.length, dueSoon: dueSoon.length, blocked: blocked.length },
  });
}
