import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';
import { TaskStatusBadge } from '@/components/tasks/task-status-badge';
import { formatRelativeTime } from '@/lib/utils';
import type { DashboardRecentTask } from '@/services/dashboard';

export function RecentTasksCard({ tasks }: { tasks: DashboardRecentTask[] }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Recently updated</CardTitle>
        <CardDescription>Latest activity across your projects</CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tasks yet.</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/tasks/${task.id}`}
                  className="group flex items-center justify-between gap-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium group-hover:underline">
                      {task.title}
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {task.project.name} · {formatRelativeTime(task.updatedAt)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <TaskPriorityBadge priority={task.priority} />
                    <TaskStatusBadge status={task.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
