import type { Task, TaskDependency } from '@/generated/prisma/client';
import { prisma } from '@/lib/db/prisma';
import type { DependencyReason } from '@/lib/validations/dependency';

export type DependencyResult =
  | { ok: true; dependency: TaskDependency }
  | { ok: false; reason: DependencyReason };

export interface DependencyTask {
  dependencyId: string;
  id: string;
  title: string;
  status: Task['status'];
  priority: Task['priority'];
}

export interface TaskDependencies {
  blockedBy: DependencyTask[];
  blocks: DependencyTask[];
}

const taskSummary = { id: true, title: true, status: true, priority: true } as const;

async function findOwnTask(taskId: string, userId: string) {
  return prisma.task.findFirst({
    where: { id: taskId, project: { userId } },
    select: { id: true, projectId: true },
  });
}

export async function listTaskDependencies(
  userId: string,
  taskId: string,
): Promise<TaskDependencies | null> {
  const task = await findOwnTask(taskId, userId);
  if (!task) return null;

  const [dependencies, dependents] = await Promise.all([
    prisma.taskDependency.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, dependsOn: { select: taskSummary } },
    }),
    prisma.taskDependency.findMany({
      where: { dependsOnId: taskId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, task: { select: taskSummary } },
    }),
  ]);

  return {
    blockedBy: dependencies.map((dependency) => ({
      dependencyId: dependency.id,
      id: dependency.dependsOn.id,
      title: dependency.dependsOn.title,
      status: dependency.dependsOn.status,
      priority: dependency.dependsOn.priority,
    })),
    blocks: dependents.map((dependency) => ({
      dependencyId: dependency.id,
      id: dependency.task.id,
      title: dependency.task.title,
      status: dependency.task.status,
      priority: dependency.task.priority,
    })),
  };
}

async function createsCycle(taskId: string, dependsOnId: string): Promise<boolean> {
  const visited = new Set<string>();
  const queue: string[] = [dependsOnId];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (current === taskId) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const prerequisites = await prisma.taskDependency.findMany({
      where: { taskId: current },
      select: { dependsOnId: true },
    });
    for (const prerequisite of prerequisites) {
      queue.push(prerequisite.dependsOnId);
    }
  }

  return false;
}

export async function addDependency(
  userId: string,
  taskId: string,
  dependsOnId: string,
): Promise<DependencyResult> {
  const task = await findOwnTask(taskId, userId);
  if (!task) return { ok: false, reason: 'task-not-found' };

  const target = await prisma.task.findFirst({
    where: { id: dependsOnId },
    select: { id: true, projectId: true },
  });
  if (!target) return { ok: false, reason: 'target-not-found' };

  if (target.projectId !== task.projectId) {
    return { ok: false, reason: 'cross-project' };
  }

  if (dependsOnId === taskId) return { ok: false, reason: 'self' };

  const existing = await prisma.taskDependency.findUnique({
    where: { taskId_dependsOnId: { taskId, dependsOnId } },
    select: { id: true },
  });
  if (existing) return { ok: false, reason: 'duplicate' };

  if (await createsCycle(taskId, dependsOnId)) {
    return { ok: false, reason: 'cycle' };
  }

  const dependency = await prisma.taskDependency.create({
    data: { taskId, dependsOnId },
  });

  return { ok: true, dependency };
}

export async function removeDependency(
  userId: string,
  taskId: string,
  dependencyId: string,
): Promise<boolean> {
  const dependency = await prisma.taskDependency.findFirst({
    where: { id: dependencyId, taskId, task: { project: { userId } } },
    select: { id: true },
  });
  if (!dependency) return false;

  await prisma.taskDependency.delete({ where: { id: dependencyId } });
  return true;
}
