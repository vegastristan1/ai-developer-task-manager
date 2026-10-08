import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BlockedBadge } from '@/components/tasks/blocked-badge';
import { TaskStatusBadge } from '@/components/tasks/task-status-badge';
import type { DashboardBlockedTask } from '@/services/dashboard';

export function BlockedTasksCard({ tasks }: { tasks: DashboardBlockedTask[] }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Blocked task analysis</CardTitle>
        <CardDescription>Tasks waiting on unfinished dependencies</CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nothing is blocked. Nice.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {tasks.map((task) => (
              <li key={task.id} className="py-2">
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="min-w-0 truncate text-sm font-medium hover:underline"
                  >
                    {task.title}
                  </Link>
                  {task.blockedBy.length > 0 ? (
                    <BlockedBadge count={task.blockedBy.length} />
                  ) : (
                    <TaskStatusBadge status={task.status} />
                  )}
                </div>
                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                  {task.project.name}
                  {task.blockedBy.length > 0 &&
                    ` · waiting on ${task.blockedBy.map((dep) => dep.title).join(', ')}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
