import type { Sprint, Task } from '@/generated/prisma/client';
import { prisma } from '@/lib/db/prisma';
import type { SprintInput, UpdateSprintInput } from '@/lib/validations/sprint';
import {
  taskPriorities,
  taskStatuses,
  taskTypes,
  type TaskPriorityValue,
  type TaskStatusValue,
  type TaskTypeValue,
} from '@/lib/validations/task';

export type SprintResult =
  | { ok: true; sprint: Sprint }
  | { ok: false; reason: 'project-not-found' | 'sprint-not-found' | 'invalid-dates' };

export type SprintListEntry = Sprint & {
  project: { id: string; name: string };
  stats: { total: number; completed: number };
};

export type SprintDetails = Sprint & {
  project: { id: string; name: string };
  _count: { tasks: number };
};

interface SprintTaskStat {
  status: string;
  priority: string;
  type: string;
  dueDate?: Date | string | null;
}

export interface SprintStats {
  total: number;
  completed: number;
  remaining: number;
  inProgress: number;
  inReview: number;
  blocked: number;
  todo: number;
  overdue: number;
  progressPercent: number;
  byStatus: Record<TaskStatusValue, number>;
  byPriority: Record<TaskPriorityValue, number>;
  byType: Record<TaskTypeValue, number>;
}

export function computeSprintStats(
  tasks: readonly SprintTaskStat[],
  now: Date = new Date(),
): SprintStats {
  const byStatus = Object.fromEntries(taskStatuses.map((status) => [status, 0])) as Record<
    TaskStatusValue,
    number
  >;
  const byPriority = Object.fromEntries(taskPriorities.map((priority) => [priority, 0])) as Record<
    TaskPriorityValue,
    number
  >;
  const byType = Object.fromEntries(taskTypes.map((type) => [type, 0])) as Record<
    TaskTypeValue,
    number
  >;

  let completed = 0;
  let inProgress = 0;
  let inReview = 0;
  let blocked = 0;
  let overdue = 0;

  for (const task of tasks) {
    byStatus[task.status as TaskStatusValue] = (byStatus[task.status as TaskStatusValue] ?? 0) + 1;
    byPriority[task.priority as TaskPriorityValue] =
      (byPriority[task.priority as TaskPriorityValue] ?? 0) + 1;
    byType[task.type as TaskTypeValue] = (byType[task.type as TaskTypeValue] ?? 0) + 1;

    if (task.status === 'DONE') completed += 1;
    if (task.status === 'IN_PROGRESS') inProgress += 1;
    if (task.status === 'IN_REVIEW') inReview += 1;
    if (task.status === 'BLOCKED') blocked += 1;

    if (task.dueDate && task.status !== 'DONE') {
      const due = new Date(task.dueDate).getTime();
      if (due < now.getTime()) overdue += 1;
    }
  }

  const total = tasks.length;

  return {
    total,
    completed,
    remaining: total - completed,
    inProgress,
    inReview,
    blocked,
    todo: byStatus.TODO,
    overdue,
    progressPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
    byStatus,
    byPriority,
    byType,
  };
}

const listInclude = {
  project: { select: { id: true, name: true } },
  tasks: { select: { status: true, priority: true, type: true } },
} satisfies object;

const detailsInclude = {
  project: { select: { id: true, name: true } },
  _count: { select: { tasks: true } },
} satisfies object;

function toListEntry(
  sprint: Sprint & {
    project: { id: string; name: string };
    tasks: { status: Task['status']; priority: Task['priority']; type: Task['type'] }[];
  },
): SprintListEntry {
  const { tasks, ...rest } = sprint;
  const stats = computeSprintStats(tasks);
  return { ...rest, stats: { total: stats.total, completed: stats.completed } };
}

export async function listSprints(
  userId: string,
  filters: { projectId?: string } = {},
): Promise<SprintListEntry[]> {
  const sprints = await prisma.sprint.findMany({
    where: {
      project: { userId },
      ...(filters.projectId && { projectId: filters.projectId }),
    },
    orderBy: { startDate: 'desc' },
    include: listInclude,
  });

  return sprints.map(toListEntry);
}

export async function getSprint(id: string, userId: string): Promise<SprintDetails | null> {
  return prisma.sprint.findFirst({
    where: { id, project: { userId } },
    include: detailsInclude,
  });
}

async function projectExists(projectId: string, userId: string): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  return !!project;
}

export async function createSprint(userId: string, input: SprintInput): Promise<SprintResult> {
  if (input.endDate.getTime() < input.startDate.getTime()) {
    return { ok: false, reason: 'invalid-dates' };
  }

  if (!(await projectExists(input.projectId, userId))) {
    return { ok: false, reason: 'project-not-found' };
  }

  const sprint = await prisma.sprint.create({
    data: {
      name: input.name,
      goal: input.goal ?? null,
      startDate: input.startDate,
      endDate: input.endDate,
      projectId: input.projectId,
    },
  });

  return { ok: true, sprint };
}

export async function updateSprint(
  id: string,
  userId: string,
  input: UpdateSprintInput,
): Promise<SprintResult> {
  const existing = await prisma.sprint.findFirst({
    where: { id, project: { userId } },
    select: { id: true, projectId: true, startDate: true, endDate: true },
  });
  if (!existing) return { ok: false, reason: 'sprint-not-found' };

  const targetProjectId = input.projectId ?? existing.projectId;
  if (targetProjectId !== existing.projectId && !(await projectExists(targetProjectId, userId))) {
    return { ok: false, reason: 'project-not-found' };
  }

  const startDate = input.startDate ?? existing.startDate;
  const endDate = input.endDate ?? existing.endDate;
  if (endDate.getTime() < startDate.getTime()) {
    return { ok: false, reason: 'invalid-dates' };
  }

  const sprint = await prisma.sprint.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.goal !== undefined && { goal: input.goal }),
      ...(input.startDate !== undefined && { startDate: input.startDate }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
      ...(input.projectId !== undefined && { projectId: input.projectId }),
    },
  });

  return { ok: true, sprint };
}

export async function deleteSprint(id: string, userId: string): Promise<boolean> {
  const existing = await prisma.sprint.findFirst({
    where: { id, project: { userId } },
    select: { id: true },
  });
  if (!existing) return false;

  await prisma.sprint.delete({ where: { id } });
  return true;
}
