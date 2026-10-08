'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { BoardColumn } from '@/components/board/board-column';
import { resolveMove } from '@/components/board/move';
import { TaskCard } from '@/components/board/task-card';
import { taskStatuses } from '@/lib/validations/task';
import type { TaskWithCounts } from '@/services/tasks';

interface BoardProps {
  tasks: TaskWithCounts[];
  sort?: string;
}

export function Board({ tasks, sort }: BoardProps) {
  const router = useRouter();
  const [items, setItems] = useState<TaskWithCounts[]>(tasks);
  const [lastTasks, setLastTasks] = useState<TaskWithCounts[]>(tasks);
  const [activeId, setActiveId] = useState<string | null>(null);

  if (tasks !== lastTasks) {
    setLastTasks(tasks);
    setItems(tasks);
  }

  const dragDisabled = sort !== 'position';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const activeTask = activeId ? (items.find((task) => task.id === activeId) ?? null) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    if (dragDisabled) return;

    const { active, over } = event;
    if (!over) return;

    const activeIdValue = String(active.id);
    const overIdValue = String(over.id);
    if (activeIdValue === overIdValue) return;

    const overIsColumn = over.data.current?.type === 'column';

    let insertAfter = false;
    if (!overIsColumn && active.rect.current.translated && over.rect) {
      const dragged = active.rect.current.translated;
      insertAfter = dragged.top + dragged.height / 2 > over.rect.top + over.rect.height / 2;
    }

    const result = resolveMove(items, activeIdValue, overIdValue, overIsColumn, insertAfter);
    if (!result) return;

    const previous = items;
    setItems(result.nextTasks);

    try {
      const response = await fetch(`/api/tasks/${result.movedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: result.status, position: result.position }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(data?.error ?? 'Could not move the task');
        setItems(previous);
        return;
      }

      router.refresh();
    } catch {
      toast.error('Could not move the task');
      setItems(previous);
    }
  }

  const columns = taskStatuses.map((status) => {
    const columnTasks = items.filter((task) => task.status === status);
    if (sort === 'position') {
      columnTasks.sort((a, b) => a.position - b.position);
    }
    return { status, tasks: columnTasks };
  });

  return (
    <div className="flex flex-col gap-3">
      {dragDisabled && (
        <p className="text-muted-foreground text-xs">
          Sorting is active — switch to &ldquo;Manual order&rdquo; to drag and drop cards.
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex items-start gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <BoardColumn
              key={column.status}
              status={column.status}
              tasks={column.tasks}
              dragDisabled={dragDisabled}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="w-72 rotate-1 cursor-grabbing opacity-90">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {!dragDisabled && (
        <p className="text-muted-foreground flex items-center gap-1 text-xs">
          <GripVertical className="size-3" aria-hidden />
          Drag cards between columns to update their status, or reorder within a column.
        </p>
      )}
    </div>
  );
}
