'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableTaskCard } from '@/components/board/task-card';
import { TaskStatusBadge } from '@/components/tasks/task-status-badge';
import type { TaskStatusValue } from '@/lib/validations/task';
import type { TaskWithCounts } from '@/services/tasks';

interface BoardColumnProps {
  status: TaskStatusValue;
  tasks: TaskWithCounts[];
  dragDisabled: boolean;
}

export function BoardColumn({ status, tasks, dragDisabled }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: 'column' } });

  return (
    <div
      ref={setNodeRef}
      className="bg-muted/30 flex w-72 shrink-0 flex-col rounded-xl border"
      data-over={isOver || undefined}
    >
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
        <TaskStatusBadge status={status} />
        <span className="text-muted-foreground text-xs font-medium tabular-nums">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="flex min-h-40 flex-1 flex-col gap-2 overflow-y-auto p-2">
          {tasks.length === 0 ? (
            <p className="text-muted-foreground/70 px-2 py-6 text-center text-xs">No tasks</p>
          ) : (
            tasks.map((task) => (
              <SortableTaskCard key={task.id} task={task} disabled={dragDisabled} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
