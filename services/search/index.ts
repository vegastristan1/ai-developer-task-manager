import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/db/prisma';
import type { SearchQuery } from '@/lib/validations/search';
import type { ProjectStatusValue } from '@/lib/validations/project';
import type { TaskPriorityValue, TaskStatusValue, TaskTypeValue } from '@/lib/validations/task';

const RESULT_LIMITS = { projects: 10, tasks: 15, labels: 10 } as const;

export interface SearchProjectResult {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatusValue;
  taskCount: number;
}

export interface SearchTaskResult {
  id: string;
  title: string;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  type: TaskTypeValue;
  projectId: string;
  project: { id: string; name: string };
}

export interface SearchLabelResult {
  id: string;
  name: string;
  color: string;
  project: { id: string; name: string };
}

export interface SearchResults {
  query: string;
  counts: { projects: number; tasks: number; labels: number };
  projects: SearchProjectResult[];
  tasks: SearchTaskResult[];
  labels: SearchLabelResult[];
}

function projectWhere(userId: string, q: string): Prisma.ProjectWhereInput {
  return {
    userId,
    OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ],
  };
}

function taskWhere(userId: string, params: SearchQuery): Prisma.TaskWhereInput {
  const { q, status, priority, type, technicalArea, projectId, sprintId } = params;
  return {
    project: { userId },
    OR: [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ],
    ...(status && { status }),
    ...(priority && { priority }),
    ...(type && { type }),
    ...(technicalArea && { technicalArea }),
    ...(projectId && { projectId }),
    ...(sprintId && { sprintId }),
  };
}

export async function searchAll(userId: string, params: SearchQuery): Promise<SearchResults> {
  const { q } = params;

  const [projects, projectCount, tasks, taskCount, labels, labelCount] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere(userId, q),
      orderBy: { updatedAt: 'desc' },
      take: RESULT_LIMITS.projects,
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        _count: { select: { tasks: true } },
      },
    }),
    prisma.project.count({ where: projectWhere(userId, q) }),
    prisma.task.findMany({
      where: taskWhere(userId, params),
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      take: RESULT_LIMITS.tasks,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        type: true,
        projectId: true,
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.task.count({ where: taskWhere(userId, params) }),
    prisma.label.findMany({
      where: { project: { userId }, name: { contains: q, mode: 'insensitive' } },
      orderBy: { name: 'asc' },
      take: RESULT_LIMITS.labels,
      select: {
        id: true,
        name: true,
        color: true,
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.label.count({
      where: { project: { userId }, name: { contains: q, mode: 'insensitive' } },
    }),
  ]);

  return {
    query: q,
    counts: { projects: projectCount, tasks: taskCount, labels: labelCount },
    projects: projects.map(({ _count, ...project }) => ({ ...project, taskCount: _count.tasks })),
    tasks,
    labels,
  };
}
