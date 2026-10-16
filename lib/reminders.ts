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

export type ReminderTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  projectId: string;
  project: { id: string; name: string };
};

export interface Reminders {
  overdue: ReminderTask[];
  dueSoon: ReminderTask[];
  blocked: ReminderTask[];
  counts: { overdue: number; dueSoon: number; blocked: number };
}

/**
 * Computed-live reminders for one user — no stored state.
 * overdue: past due and not done. dueSoon: due within DUE_SOON_DAYS (not
 * overdue, not done). blocked: status BLOCKED (and not done).
 */
export async function getReminders(userId: string): Promise<Reminders> {
  const now = new Date();
  const soon = new Date(now.getTime() + DUE_SOON_DAYS * 24 * 60 * 60 * 1000);
  const owned = { project: { userId } };

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

  return {
    overdue,
    dueSoon,
    blocked,
    counts: { overdue: overdue.length, dueSoon: dueSoon.length, blocked: blocked.length },
  };
}
