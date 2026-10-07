import Link from 'next/link';
import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';
import { TaskStatusBadge } from '@/components/tasks/task-status-badge';
import { formatDate } from '@/lib/utils';
import { taskTypeLabels, type TaskTypeValue } from '@/lib/validations/task';
import type { TaskWithCounts } from '@/services/tasks';

function formatUpdated(value: Date | string): string {
  const timestamp = new Date(value);
  const minutes = Math.floor((Date.now() - timestamp.getTime()) / 60_000);
  if (minutes < 1) return 'Updated just now';
  if (minutes < 60) return `Updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Updated ${days}d ago`;
  return `Updated ${formatDate(timestamp)}`;
}

interface TaskListItemProps {
  task: TaskWithCounts;
}

export function TaskListItem({ task }: TaskListItemProps) {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = task.overdue;

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="hover:bg-muted/50 block rounded-lg border p-4 transition-colors"
    >
      <div className="flex flex-wrap items-center gap-2">
        <TaskStatusBadge status={task.status} />
        <span className="text-sm font-medium">{task.title}</span>
        <span className="ml-auto">
          <TaskPriorityBadge priority={task.priority} />
        </span>
      </div>

      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span>{task.project.name}</span>
        <span aria-hidden>·</span>
        <span>{taskTypeLabels[task.type as TaskTypeValue]}</span>
        {task.technicalArea && (
          <>
            <span aria-hidden>·</span>
            <span>{task.technicalArea}</span>
          </>
        )}
        {task.labels.length > 0 && (
          <span className="flex flex-wrap items-center gap-1">
            {task.labels.slice(0, 4).map(({ label }) => (
              <span
                key={label.id}
                className="bg-muted inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5"
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: label.color }}
                  aria-hidden
                />
                {label.name}
              </span>
            ))}
            {task.labels.length > 4 && <span>+{task.labels.length - 4}</span>}
          </span>
        )}
        {dueDate && (
          <>
            <span aria-hidden>·</span>
            <span className={overdue ? 'font-medium text-red-500' : undefined}>
              Due {dueDate.toLocaleDateString()}
            </span>
          </>
        )}
        {task._count.subtasks > 0 && (
          <>
            <span aria-hidden>·</span>
            <span>{task._count.subtasks} subtasks</span>
          </>
        )}
        <span aria-hidden>·</span>
        <span>{formatUpdated(task.updatedAt)}</span>
      </div>
    </Link>
  );
}
