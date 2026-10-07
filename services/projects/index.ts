import type { Prisma, Project } from '@/generated/prisma/client';
import { prisma } from '@/lib/db/prisma';
import type { ProjectInput, UpdateProjectInput } from '@/lib/validations/project';

type ProjectWithCounts = Project & {
  _count: { tasks: number; sprints: number; labels: number };
};

export type { ProjectWithCounts };

const withCounts = {
  include: { _count: { select: { tasks: true, sprints: true, labels: true } } },
} satisfies { include: Prisma.ProjectInclude };

export async function listProjects(userId: string): Promise<ProjectWithCounts[]> {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    ...withCounts,
  });
}

export async function getProject(id: string, userId: string): Promise<ProjectWithCounts | null> {
  return prisma.project.findFirst({ where: { id, userId }, ...withCounts });
}

export async function createProject(
  userId: string,
  input: ProjectInput,
): Promise<ProjectWithCounts> {
  return prisma.project.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      repositoryUrl: input.repositoryUrl ?? null,
      technologyStack: input.technologyStack ?? [],
      status: input.status ?? 'ACTIVE',
      userId,
    },
    ...withCounts,
  });
}

export async function updateProject(
  id: string,
  userId: string,
  input: UpdateProjectInput,
): Promise<ProjectWithCounts | null> {
  const existing = await prisma.project.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return null;

  return prisma.project.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.repositoryUrl !== undefined && { repositoryUrl: input.repositoryUrl }),
      ...(input.technologyStack !== undefined && { technologyStack: input.technologyStack }),
      ...(input.status !== undefined && { status: input.status }),
    },
    ...withCounts,
  });
}

export async function deleteProject(id: string, userId: string): Promise<boolean> {
  const existing = await prisma.project.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return false;

  await prisma.project.delete({ where: { id } });
  return true;
}
