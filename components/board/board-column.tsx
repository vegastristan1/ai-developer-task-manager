'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { SortableTaskCard } from '@/components/board/task-card';
import { TaskStatusBadge } from '@/components/tasks/task-status-badge';
import { taskStatusLabels, type TaskStatusValue } from '@/lib/validations/task';
import type { TaskWithCounts } from '@/services/tasks';

interface BoardColumnProps {
  status: TaskStatusValue;
  tasks: TaskWithCounts[];
  dragDisabled: boolean;
  collapsed: boolean;
  onToggle: () => void;
}

export function BoardColumn({
  status,
  tasks,
  dragDisabled,
  collapsed,
  onToggle,
}: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status, data: { type: 'column' } });
  const label = taskStatusLabels[status];

  if (collapsed) {
    return (
      <div
        ref={setNodeRef}
        data-over={isOver || undefined}
        className="bg-muted/30 flex w-12 shrink-0 flex-col self-stretch rounded-xl border data-[over]:border-emerald-500"
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={false}
          aria-label={`Expand ${label} column (${tasks.length} tasks)`}
          title={`Expand ${label}`}
          className="hover:bg-muted/40 flex flex-1 flex-col items-center gap-2 rounded-xl py-3 transition-colors"
        >
          <ChevronsRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <span className="text-xs font-medium [writing-mode:vertical-rl]">{label}</span>
          <span className="text-muted-foreground text-xs font-medium tabular-nums">
            {tasks.length}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className="bg-muted/30 flex w-72 shrink-0 flex-col rounded-xl border"
      data-over={isOver || undefined}
    >
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
        <TaskStatusBadge status={status} />
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground text-xs font-medium tabular-nums">
            {tasks.length}
          </span>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded
            aria-label={`Collapse ${label} column`}
            title={`Collapse ${label}`}
            className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md p-1 transition-colors"
          >
            <ChevronsLeft className="size-4" aria-hidden />
          </button>
        </div>
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
