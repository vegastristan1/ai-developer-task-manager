import { cacheTag } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { computeSprintStats, type SprintStats } from '@/services/sprints';
import {
  taskPriorities,
  taskStatuses,
  taskTypes,
  technicalAreas,
  type TaskPriorityValue,
  type TaskStatusValue,
  type TaskTypeValue,
  type TechnicalAreaValue,
} from '@/lib/validations/task';

export interface DistributionEntry<K extends string = string> {
  key: K;
  count: number;
}

export interface DashboardProjectStat {
  id: string;
  name: string;
  status: string;
  taskCount: number;
  completedCount: number;
  completionPercent: number;
}

export interface DashboardRecentTask {
  id: string;
  title: string;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  updatedAt: Date;
  project: { id: string; name: string };
}

export interface DashboardBlockedTask {
  id: string;
  title: string;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  project: { id: string; name: string };
  blockedBy: { id: string; title: string; status: TaskStatusValue }[];
}

export interface DashboardSprintStat extends SprintStats {
  id: string;
  name: string;
  projectName: string;
  startDate: Date;
  endDate: Date;
}

export interface DashboardStats {
  totals: {
    projects: number;
    tasks: number;
    open: number;
    completed: number;
    blocked: number;
    dueSoon: number;
    completionPercent: number;
  };
  projectBreakdown: DashboardProjectStat[];
  byStatus: DistributionEntry<TaskStatusValue>[];
  byPriority: DistributionEntry<TaskPriorityValue>[];
  byType: DistributionEntry<TaskTypeValue>[];
  byTechnicalArea: DistributionEntry<TechnicalAreaValue | 'NONE'>[];
  currentSprint: DashboardSprintStat | null;
  recentTasks: DashboardRecentTask[];
  blockedTasks: DashboardBlockedTask[];
}

const DAY_MS = 86_400_000;

function bump(counts: Map<string, number>, key: string): void {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function tally<K extends string>(
  keys: readonly K[],
  counts: Map<string, number>,
): DistributionEntry<K>[] {
  const entries: DistributionEntry<K>[] = [];
  for (const key of keys) {
    const count = counts.get(key) ?? 0;
    if (count > 0) entries.push({ key, count });
  }
  return entries;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  'use cache';
  cacheTag('dashboard');
  const now = new Date();
  const dueSoonCutoff = now.getTime() + 7 * DAY_MS;

  const [projects, tasks, sprint] = await Promise.all([
    prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, status: true },
    }),
    prisma.task.findMany({
      where: { project: { userId } },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        type: true,
        technicalArea: true,
        dueDate: true,
        updatedAt: true,
        project: { select: { id: true, name: true } },
        dependencies: {
          where: { dependsOn: { status: { not: 'DONE' } } },
          select: { dependsOn: { select: { id: true, title: true, status: true } } },
        },
      },
    }),
    prisma.sprint.findFirst({
      where: { project: { userId }, startDate: { lte: now }, endDate: { gte: now } },
      orderBy: { endDate: 'asc' },
      include: {
        project: { select: { name: true } },
        tasks: { select: { status: true, priority: true, type: true, dueDate: true } },
      },
    }),
  ]);

  const statusCounts = new Map<string, number>();
  const priorityCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();
  const areaCounts = new Map<string, number>();
  const perProject = new Map<string, { total: number; completed: number }>();

  let completed = 0;
  let dueSoon = 0;
  let blocked = 0;

  for (const task of tasks) {
    bump(statusCounts, task.status);
    bump(priorityCounts, task.priority);
    bump(typeCounts, task.type);
    bump(areaCounts, task.technicalArea ?? 'NONE');

    const projectTally = perProject.get(task.project.id) ?? { total: 0, completed: 0 };
    projectTally.total += 1;
    if (task.status === 'DONE') projectTally.completed += 1;
    perProject.set(task.project.id, projectTally);

    if (task.status === 'DONE') {
      completed += 1;
      continue;
    }

    if (task.dueDate && task.dueDate.getTime() <= dueSoonCutoff) dueSoon += 1;
    if (task.status === 'BLOCKED' || task.dependencies.length > 0) blocked += 1;
  }

  const total = tasks.length;

  const projectBreakdown: DashboardProjectStat[] = projects.map((project) => {
    const counts = perProject.get(project.id) ?? { total: 0, completed: 0 };
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      taskCount: counts.total,
      completedCount: counts.completed,
      completionPercent:
        counts.total === 0 ? 0 : Math.round((counts.completed / counts.total) * 100),
    };
  });

  const blockedTasks: DashboardBlockedTask[] = tasks
    .filter(
      (task) =>
        task.status !== 'DONE' && (task.status === 'BLOCKED' || task.dependencies.length > 0),
    )
    .map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      project: task.project,
      blockedBy: task.dependencies.map(({ dependsOn }) => dependsOn),
    }))
    .sort((a, b) => {
      const byPriority = taskPriorities.indexOf(b.priority) - taskPriorities.indexOf(a.priority);
      return byPriority !== 0 ? byPriority : a.title.localeCompare(b.title);
    })
    .slice(0, 10);

  const recentTasks: DashboardRecentTask[] = [...tasks]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 8)
    .map(({ id, title, status, priority, updatedAt, project }) => ({
      id,
      title,
      status,
      priority,
      updatedAt,
      project,
    }));

  const currentSprint: DashboardSprintStat | null = sprint
    ? {
        id: sprint.id,
        name: sprint.name,
        projectName: sprint.project.name,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        ...computeSprintStats(sprint.tasks, now),
      }
    : null;

  return {
    totals: {
      projects: projects.length,
      tasks: total,
      open: total - completed,
      completed,
      blocked,
      dueSoon,
      completionPercent: total === 0 ? 0 : Math.round((completed / total) * 100),
    },
    projectBreakdown,
    byStatus: tally(taskStatuses, statusCounts),
    byPriority: tally(taskPriorities, priorityCounts),
    byType: tally(taskTypes, typeCounts),
    byTechnicalArea: tally([...technicalAreas, 'NONE'], areaCounts),
    currentSprint,
    recentTasks,
    blockedTasks,
  };
}
