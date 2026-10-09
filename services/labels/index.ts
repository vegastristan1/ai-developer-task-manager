import { cacheTag, revalidateTag } from 'next/cache';
import type { Label } from '@/generated/prisma/client';
import { prisma } from '@/lib/db/prisma';
import type { LabelInput, UpdateLabelInput } from '@/lib/validations/label';

export type LabelResult =
  | { ok: true; label: Label }
  | { ok: false; reason: 'project-not-found' | 'label-not-found' | 'conflict' };

function revalidateLabelCaches() {
  revalidateTag('labels', { expire: 0 });
  revalidateTag('tasks', { expire: 0 });
  revalidateTag('search', { expire: 0 });
}

async function projectExists(projectId: string, userId: string): Promise<boolean> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  return !!project;
}

export async function listLabels(userId: string, projectId: string): Promise<Label[] | null> {
  'use cache';
  cacheTag('labels');
  if (!(await projectExists(projectId, userId))) return null;

  return prisma.label.findMany({
    where: { projectId },
    orderBy: { name: 'asc' },
  });
}

export async function createLabel(userId: string, input: LabelInput): Promise<LabelResult> {
  if (!(await projectExists(input.projectId, userId))) {
    return { ok: false, reason: 'project-not-found' };
  }

  const existing = await prisma.label.findFirst({
    where: { projectId: input.projectId, name: input.name },
    select: { id: true },
  });
  if (existing) return { ok: false, reason: 'conflict' };

  const label = await prisma.label.create({
    data: {
      name: input.name,
      color: input.color ?? '#6b7280',
      projectId: input.projectId,
    },
  });

  revalidateLabelCaches();
  return { ok: true, label };
}

export async function updateLabel(
  id: string,
  userId: string,
  input: UpdateLabelInput,
): Promise<LabelResult> {
  const existing = await prisma.label.findFirst({
    where: { id, project: { userId } },
  });
  if (!existing) return { ok: false, reason: 'label-not-found' };

  if (input.name && input.name !== existing.name) {
    const conflict = await prisma.label.findFirst({
      where: { projectId: existing.projectId, name: input.name },
      select: { id: true },
    });
    if (conflict) return { ok: false, reason: 'conflict' };
  }

  const label = await prisma.label.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.color !== undefined && { color: input.color }),
    },
  });

  revalidateLabelCaches();
  return { ok: true, label };
}

export async function deleteLabel(id: string, userId: string): Promise<boolean> {
  const existing = await prisma.label.findFirst({
    where: { id, project: { userId } },
    select: { id: true },
  });
  if (!existing) return false;

  await prisma.label.delete({ where: { id } });
  revalidateLabelCaches();
  return true;
}
