import type { Metadata } from 'next';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BellRing, CalendarClock, OctagonAlert, Timer } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { RemindersEmailButton } from '@/components/reminders/email-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSessionUser } from '@/lib/auth/session';
import { DUE_SOON_DAYS, getReminders } from '@/lib/reminders';

export const metadata: Metadata = { title: 'Reminders' };

export const instant = false;

function formatDue(value: Date | null): string {
  if (!value) return 'No due date';
  return new Date(value).toLocaleDateString();
}

async function Section({
  title,
  icon,
  tasks,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: Date | null;
    project: { id: string; name: string };
  }>;
  empty: string;
}) {
  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title} ({tasks.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-sm">{empty}</p>
        ) : (
          <ul className="grid gap-2">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 text-sm">
                <Link
                  href={`/tasks/${task.id}`}
                  className="truncate font-medium underline-offset-4 hover:underline"
                >
                  {task.title}
                </Link>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {task.project.name} · {formatDue(task.dueDate)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default async function RemindersPage() {
  await connection();
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const { overdue, dueSoon, blocked } = await getReminders(user.id);

  const total = overdue.length + dueSoon.length + blocked.length;

  return (
    <>
      <PageHeader
        title="Reminders"
        description="Overdue, due soon, and blocked tasks across your workspace."
      >
        <RemindersEmailButton />
      </PageHeader>
      {total === 0 ? (
        <EmptyState
          icon={<BellRing />}
          title="All clear"
          description="Nothing overdue, due soon, or blocked."
        />
      ) : (
        <div className="flex flex-col gap-6">
          <Section
            title="Overdue"
            icon={<OctagonAlert className="size-4" aria-hidden />}
            tasks={overdue}
            empty="Nothing overdue."
          />
          <Section
            title={`Due within ${DUE_SOON_DAYS} days`}
            icon={<CalendarClock className="size-4" aria-hidden />}
            tasks={dueSoon}
            empty="Nothing due soon."
          />
          <Section
            title="Blocked"
            icon={<Timer className="size-4" aria-hidden />}
            tasks={blocked}
            empty="Nothing blocked."
          />
        </div>
      )}
    </>
  );
}
