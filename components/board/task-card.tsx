'use client';

import Link from 'next/link';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BlockedBadge } from '@/components/tasks/blocked-badge';
import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';
import { taskTypeLabels, type TaskTypeValue } from '@/lib/validations/task';
import type { TaskWithCounts } from '@/services/tasks';

interface TaskCardProps {
  task: TaskWithCounts;
}

export function TaskCard({ task }: TaskCardProps) {
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;

  return (
    <Link
      href={`/tasks/${task.id}`}
      className="bg-background hover:bg-muted/40 block rounded-lg border p-3 shadow-sm transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="line-clamp-2 text-sm leading-snug font-medium">{task.title}</span>
        <span className="shrink-0">
          <TaskPriorityBadge priority={task.priority} />
        </span>
      </div>

      {task.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {task.labels.slice(0, 3).map(({ label }) => (
            <span
              key={label.id}
              className="bg-muted inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs"
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: label.color }}
                aria-hidden
              />
              {label.name}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="text-muted-foreground text-xs">+{task.labels.length - 3}</span>
          )}
        </div>
      )}

      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span>{task.project.name}</span>
        <span aria-hidden>·</span>
        <span>{taskTypeLabels[task.type as TaskTypeValue]}</span>
        {dueDate && (
          <>
            <span aria-hidden>·</span>
            <span className={task.overdue ? 'font-medium text-red-500' : undefined}>
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
        {task.blockedCount > 0 && <BlockedBadge count={task.blockedCount} />}
      </div>
    </Link>
  );
}

interface SortableTaskCardProps {
  task: TaskWithCounts;
  disabled?: boolean;
}

export function SortableTaskCard({ task, disabled = false }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled,
    data: { type: 'task' },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'opacity-40' : undefined}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} />
    </div>
  );
}
