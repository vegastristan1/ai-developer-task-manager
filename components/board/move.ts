import { arrayMove } from '@dnd-kit/sortable';
import type { TaskStatusValue } from '@/lib/validations/task';
import type { TaskWithCounts } from '@/services/tasks';

export interface MoveResult {
  nextTasks: TaskWithCounts[];
  movedId: string;
  status: TaskStatusValue;
  position: number;
}

export function computePosition(column: TaskWithCounts[], movedId: string): number {
  const index = column.findIndex((task) => task.id === movedId);
  const previous = index > 0 ? column[index - 1] : undefined;
  const next = index >= 0 && index < column.length - 1 ? column[index + 1] : undefined;

  if (previous && next) return (previous.position + next.position) / 2;
  if (next) return next.position - 1;
  if (previous) return previous.position + 1;
  return 1;
}

export function resolveMove(
  tasks: TaskWithCounts[],
  activeId: string,
  overId: string,
  overIsColumn: boolean,
  insertAfter: boolean,
): MoveResult | null {
  const activeTask = tasks.find((task) => task.id === activeId);
  if (!activeTask) return null;

  const overTask = overIsColumn ? undefined : tasks.find((task) => task.id === overId);
  if (!overIsColumn && !overTask) return null;

  const byPosition = (a: TaskWithCounts, b: TaskWithCounts) => a.position - b.position;
  const targetStatus = (overIsColumn ? overId : overTask?.status) as TaskStatusValue;
  const sourceColumn = tasks.filter((task) => task.status === activeTask.status).sort(byPosition);
  let targetColumn: TaskWithCounts[];

  if (activeTask.status === targetStatus) {
    const oldIndex = sourceColumn.findIndex((task) => task.id === activeId);
    const newIndex = overTask
      ? sourceColumn.findIndex((task) => task.id === overId)
      : sourceColumn.length - 1;
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return null;
    targetColumn = arrayMove(sourceColumn, oldIndex, newIndex);
  } else if (overTask) {
    const withoutActive = tasks
      .filter((task) => task.status === targetStatus && task.id !== activeId)
      .sort(byPosition);
    const overIndex = withoutActive.findIndex((task) => task.id === overId);
    const insertIndex = overIndex + (insertAfter ? 1 : 0);
    targetColumn = [
      ...withoutActive.slice(0, insertIndex),
      activeTask,
      ...withoutActive.slice(insertIndex),
    ];
  } else {
    targetColumn = [
      ...tasks.filter((task) => task.status === targetStatus).sort(byPosition),
      activeTask,
    ];
  }

  const position = computePosition(targetColumn, activeId);

  const nextTasks = tasks.map((task) =>
    task.id === activeId ? { ...task, status: targetStatus, position } : task,
  );

  return { nextTasks, movedId: activeId, status: targetStatus, position };
}
