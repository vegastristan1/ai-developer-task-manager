import { Prisma, type Task } from '@/generated/prisma/client';
import { prisma } from '@/lib/db/prisma';
import { normalizeTitle } from '@/lib/utils';
import type { BulkTaskInput, TaskInput, UpdateTaskInput } from '@/lib/validations/task';

export type TaskWithCounts = Task & {
  project: { id: string; name: string };
  labels: { label: { id: string; name: string; color: string } }[];
  _count: { subtasks: number };
  blockedCount: number;
  overdue: boolean;
};

export type TaskDetails = Task & {
  project: { id: string; name: string; status: string };
  sprint: { id: string; name: string } | null;
  labels: { label: { id: string; name: string; color: string } }[];
  subtasks: { id: string; title: string; status: string; priority: string }[];
  dependencies: {
    id: string;
    dependsOn: { id: string; title: string; status: Task['status']; priority: Task['priority'] };
  }[];
  dependents: {
    id: string;
    task: { id: string; title: string; status: Task['status']; priority: Task['priority'] };
  }[];
};

export type TaskMutationResult =
  | { ok: true; task: TaskDetails }
  | {
      ok: false;
      reason:
        | 'project-not-found'
        | 'task-not-found'
        | 'label-not-found'
        | 'sprint-not-found'
        | 'parent-not-found'
        | 'self-parent';
    };

export type BulkTaskMutationResult =
  | { ok: true; tasks: TaskDetails[]; skipped: string[] }
  | {
      ok: false;
      reason: 'project-not-found' | 'parent-not-found' | 'label-not-found' | 'sprint-not-found';
    };

export interface TaskFilters {
  projectId?: string;
  sprintId?: string;
  status?: string;
  priority?: string;
  type?: string;
  technicalArea?: string;
  q?: string;
  sort?: string;
}

const listInclude = {
  project: { select: { id: true, name: true } },
  labels: { include: { label: { select: { id: true, name: true, color: true } } } },
  _count: { select: { subtasks: true } },
  dependencies: {
    where: { dependsOn: { status: { not: 'DONE' as const } } },
    select: { dependsOnId: true },
  },
} satisfies object;

const detailsInclude = {
  project: { select: { id: true, name: true, status: true } },
  sprint: { select: { id: true, name: true } },
  labels: { include: { label: { select: { id: true, name: true, color: true } } } },
  subtasks: {
    select: { id: true, title: true, status: true, priority: true },
    orderBy: { position: 'asc' as const },
  },
  dependencies: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true,
      dependsOn: { select: { id: true, title: true, status: true, priority: true } },
    },
  },
  dependents: {
    orderBy: { createdAt: 'asc' as const },
    select: { id: true, task: { select: { id: true, title: true, status: true, priority: true } } },
  },
} satisfies object;

function orderByForSort(sort?: string): Prisma.TaskOrderByWithRelationInput[] {
  switch (sort) {
    case 'position':
      return [{ position: 'asc' }, { updatedAt: 'desc' }];
    case 'priority':
      return [{ priority: 'desc' }, { position: 'asc' }];
    case 'dueDate':
      return [{ dueDate: 'asc' }, { position: 'asc' }];
    case 'title':
      return [{ title: 'asc' }];
    case 'updatedAt':
      return [{ updatedAt: 'desc' }, { position: 'asc' }];
    default:
      return [{ updatedAt: 'desc' }];
  }
}

export async function listTasks(
  userId: string,
  filters: TaskFilters = {},
): Promise<TaskWithCounts[]> {
  const { projectId, sprintId, status, priority, type, technicalArea, q, sort } = filters;

  const tasks = await prisma.task.findMany({
    where: {
      project: { userId },
      ...(projectId && { projectId }),
      ...(sprintId && { sprintId }),
      ...(status && { status: status as Task['status'] }),
      ...(priority && { priority: priority as Task['priority'] }),
      ...(type && { type: type as Task['type'] }),
      ...(technicalArea && { technicalArea: technicalArea as Task['technicalArea'] }),
      ...(q && {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      }),
    },
    orderBy: orderByForSort(sort),
    include: listInclude,
  });

  const now = Date.now();
  return tasks.map(({ dependencies, ...task }) => ({
    ...task,
    blockedCount: dependencies.length,
    overdue: !!task.dueDate && task.dueDate.getTime() < now && task.status !== 'DONE',
  }));
}

export async function getTask(id: string, userId: string): Promise<TaskDetails | null> {
  return prisma.task.findFirst({
    where: { id, project: { userId } },
    include: detailsInclude,
  });
}

async function validateLabelIds(labelIds: string[], projectId: string): Promise<boolean> {
  if (labelIds.length === 0) return true;
  const count = await prisma.label.count({
    where: { id: { in: labelIds }, projectId },
  });
  return count === labelIds.length;
}

async function sprintInProject(sprintId: string, projectId: string): Promise<boolean> {
  const sprint = await prisma.sprint.findFirst({
    where: { id: sprintId, projectId },
    select: { id: true },
  });
  return !!sprint;
}

async function parentInProject(parentTaskId: string, projectId: string): Promise<boolean> {
  const parent = await prisma.task.findFirst({
    where: { id: parentTaskId, projectId },
    select: { id: true },
  });
  return !!parent;
}

async function nextPosition(projectId: string): Promise<number> {
  const last = await prisma.task.findFirst({
    where: { projectId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  return (last?.position ?? 0) + 1;
}

export async function createTask(userId: string, input: TaskInput): Promise<TaskMutationResult> {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, userId },
    select: { id: true },
  });
  if (!project) return { ok: false, reason: 'project-not-found' };

  const labelIds = input.labelIds ?? [];
  if (!(await validateLabelIds(labelIds, input.projectId))) {
    return { ok: false, reason: 'label-not-found' };
  }

  if (input.sprintId && !(await sprintInProject(input.sprintId, input.projectId))) {
    return { ok: false, reason: 'sprint-not-found' };
  }

  if (input.parentTaskId && !(await parentInProject(input.parentTaskId, input.projectId))) {
    return { ok: false, reason: 'parent-not-found' };
  }

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description ?? null,
      status: input.status ?? 'TODO',
      priority: input.priority ?? 'MEDIUM',
      type: input.type ?? 'FEATURE',
      technicalArea: input.technicalArea ?? null,
      complexity: input.complexity ?? null,
      dueDate: input.dueDate ?? null,
      estimatedEffort: input.estimatedEffort ?? null,
      actualEffort: input.actualEffort ?? null,
      technicalNotes: input.technicalNotes ?? null,
      implementationPlan: input.implementationPlan ?? null,
      acceptanceCriteria: input.acceptanceCriteria ?? Prisma.JsonNull,
      position: await nextPosition(input.projectId),
      project: { connect: { id: input.projectId } },
      ...(input.sprintId && { sprint: { connect: { id: input.sprintId } } }),
      ...(input.parentTaskId && { parentTask: { connect: { id: input.parentTaskId } } }),
      labels: { create: labelIds.map((labelId) => ({ labelId })) },
    },
    include: detailsInclude,
  });

  return { ok: true, task };
}

export async function updateTask(
  id: string,
  userId: string,
  input: UpdateTaskInput,
): Promise<TaskMutationResult> {
  const existing = await prisma.task.findFirst({
    where: { id, project: { userId } },
    select: { id: true, projectId: true },
  });
  if (!existing) return { ok: false, reason: 'task-not-found' };

  const targetProjectId = input.projectId ?? existing.projectId;
  const projectChanged = targetProjectId !== existing.projectId;

  if (projectChanged) {
    const project = await prisma.project.findFirst({
      where: { id: targetProjectId, userId },
      select: { id: true },
    });
    if (!project) return { ok: false, reason: 'project-not-found' };
  }

  if (input.labelIds !== undefined && !(await validateLabelIds(input.labelIds, targetProjectId))) {
    return { ok: false, reason: 'label-not-found' };
  }

  if (input.sprintId && !(await sprintInProject(input.sprintId, targetProjectId))) {
    return { ok: false, reason: 'sprint-not-found' };
  }

  if (input.parentTaskId !== undefined && input.parentTaskId !== null) {
    if (input.parentTaskId === id) return { ok: false, reason: 'self-parent' };
    if (!(await parentInProject(input.parentTaskId, targetProjectId))) {
      return { ok: false, reason: 'parent-not-found' };
    }
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(projectChanged && {
        project: { connect: { id: targetProjectId } },
        position: await nextPosition(targetProjectId),
      }),
      ...(input.position !== undefined && { position: input.position }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.technicalArea !== undefined && { technicalArea: input.technicalArea }),
      ...(input.complexity !== undefined && { complexity: input.complexity }),
      ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
      ...(input.estimatedEffort !== undefined && { estimatedEffort: input.estimatedEffort }),
      ...(input.actualEffort !== undefined && { actualEffort: input.actualEffort }),
      ...(input.technicalNotes !== undefined && { technicalNotes: input.technicalNotes }),
      ...(input.implementationPlan !== undefined && {
        implementationPlan: input.implementationPlan,
      }),
      ...(input.acceptanceCriteria !== undefined && {
        acceptanceCriteria: input.acceptanceCriteria ?? Prisma.JsonNull,
      }),
      ...(input.labelIds !== undefined && {
        labels: {
          deleteMany: {},
          create: input.labelIds.map((labelId) => ({ labelId })),
        },
      }),
      ...(input.sprintId !== undefined && {
        sprint: input.sprintId ? { connect: { id: input.sprintId } } : { disconnect: true },
      }),
      ...(input.parentTaskId !== undefined && {
        parentTask: input.parentTaskId
          ? { connect: { id: input.parentTaskId } }
          : { disconnect: true },
      }),
    },
    include: detailsInclude,
  });

  return { ok: true, task };
}

export async function deleteTask(id: string, userId: string): Promise<boolean> {
  const existing = await prisma.task.findFirst({
    where: { id, project: { userId } },
    select: { id: true },
  });
  if (!existing) return false;

  await prisma.task.delete({ where: { id } });
  return true;
}

export async function createTasksBulk(
  userId: string,
  input: BulkTaskInput,
): Promise<BulkTaskMutationResult> {
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, userId },
    select: { id: true },
  });
  if (!project) return { ok: false, reason: 'project-not-found' };

  if (input.parentTaskId && !(await parentInProject(input.parentTaskId, input.projectId))) {
    return { ok: false, reason: 'parent-not-found' };
  }

  const labelIds = [...new Set(input.tasks.flatMap((task) => task.labelIds ?? []))];
  if (labelIds.length > 0 && !(await validateLabelIds(labelIds, input.projectId))) {
    return { ok: false, reason: 'label-not-found' };
  }

  const sprintIds = [
    ...new Set(input.tasks.map((task) => task.sprintId).filter((id): id is string => !!id)),
  ];
  for (const sprintId of sprintIds) {
    if (!(await sprintInProject(sprintId, input.projectId))) {
      return { ok: false, reason: 'sprint-not-found' };
    }
  }

  const existingTitles = await prisma.task.findMany({
    where: {
      projectId: input.projectId,
      parentTaskId: input.parentTaskId ?? null,
    },
    select: { title: true },
  });
  const seen = new Set(existingTitles.map((task) => normalizeTitle(task.title)));

  const accepted: BulkTaskInput['tasks'] = [];
  const skipped: string[] = [];
  for (const taskInput of input.tasks) {
    const key = normalizeTitle(taskInput.title);
    if (seen.has(key)) {
      skipped.push(taskInput.title);
      continue;
    }
    seen.add(key);
    accepted.push(taskInput);
  }

  if (accepted.length === 0) {
    return { ok: true, tasks: [], skipped };
  }

  const start = await nextPosition(input.projectId);

  const tasks = await prisma.$transaction(
    accepted.map((taskInput, index) =>
      prisma.task.create({
        data: {
          title: taskInput.title,
          description: taskInput.description ?? null,
          status: taskInput.status ?? 'TODO',
          priority: taskInput.priority ?? 'MEDIUM',
          type: taskInput.type ?? 'FEATURE',
          technicalArea: taskInput.technicalArea ?? null,
          complexity: taskInput.complexity ?? null,
          dueDate: taskInput.dueDate ?? null,
          estimatedEffort: taskInput.estimatedEffort ?? null,
          actualEffort: taskInput.actualEffort ?? null,
          technicalNotes: taskInput.technicalNotes ?? null,
          implementationPlan: taskInput.implementationPlan ?? null,
          acceptanceCriteria: taskInput.acceptanceCriteria ?? Prisma.JsonNull,
          position: start + index,
          project: { connect: { id: input.projectId } },
          ...(input.parentTaskId && { parentTask: { connect: { id: input.parentTaskId } } }),
          ...(taskInput.sprintId && { sprint: { connect: { id: taskInput.sprintId } } }),
          labels: {
            create: (taskInput.labelIds ?? []).map((labelId) => ({ labelId })),
          },
        },
        include: detailsInclude,
      }),
    ),
    { timeout: 15_000 },
  );

  return { ok: true, tasks, skipped };
}
