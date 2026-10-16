import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { readJsonBody } from '@/lib/security/body';
import { clientIp } from '@/lib/security/rate-limit';
import { rateLimitResponse } from '@/lib/security/responses';
import { importSchema } from '@/lib/validations/import';

const IMPORT_WINDOW_MS = 60 * 60 * 1000;
const IMPORT_LIMIT = 5;
const IMPORT_MAX_BODY_BYTES = 5 * 1024 * 1024;

function toDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Restores a workspace export file into the signed-in account. Additive only:
 * everything is created as new rows owned by the caller, old ids are remapped,
 * nothing is deleted. Accepts files produced by GET /api/auth/export.
 */
export async function POST(request: Request) {
  const { session, response } = await requireAuth();

  if (!session) {
    return response;
  }

  const limited = rateLimitResponse(
    `import:${session.user.id}:${clientIp(request)}`,
    IMPORT_LIMIT,
    IMPORT_WINDOW_MS,
  );
  if (limited) return limited;

  const parsedBody = await readJsonBody(request, IMPORT_MAX_BODY_BYTES);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = importSchema.safeParse(parsedBody.body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'This file is not a valid workspace export', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const userId = session.user.id;
  const imported = { projects: 0, tasks: 0, conversations: 0, messages: 0 };
  const projectIds = new Map<string, string>();

  for (const source of parsed.data.data.user.projects) {
    const project = await prisma.project.create({
      data: {
        name: source.name,
        description: source.description,
        repositoryUrl: source.repositoryUrl,
        technologyStack: source.technologyStack,
        status: source.status,
        userId,
      },
    });
    imported.projects += 1;
    projectIds.set(source.id, project.id);

    const labelIds = new Map<string, string>();
    for (const label of source.labels) {
      const created = await prisma.label.create({
        data: { name: label.name, color: label.color, projectId: project.id },
      });
      labelIds.set(label.name, created.id);
    }

    const sprintIds = new Map<string, string>();
    for (const sprint of source.sprints) {
      const created = await prisma.sprint.create({
        data: {
          name: sprint.name,
          goal: sprint.goal,
          startDate: toDate(sprint.startDate) ?? new Date(),
          endDate: toDate(sprint.endDate) ?? new Date(),
          projectId: project.id,
        },
      });
      sprintIds.set(sprint.id, created.id);
    }

    // Pass 1: tasks without relations that may point forward.
    const taskIds = new Map<string, string>();
    for (const task of source.tasks) {
      const created = await prisma.task.create({
        data: {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          type: task.type,
          technicalArea: task.technicalArea,
          complexity: task.complexity,
          estimatedEffort: task.estimatedEffort,
          actualEffort: task.actualEffort,
          dueDate: toDate(task.dueDate),
          position: task.position,
          implementationPlan: task.implementationPlan,
          acceptanceCriteria: (task.acceptanceCriteria ?? undefined) as never,
          technicalNotes: task.technicalNotes,
          projectId: project.id,
          sprintId: task.sprintId ? (sprintIds.get(task.sprintId) ?? null) : null,
        },
      });
      taskIds.set(task.id, created.id);
      imported.tasks += 1;
    }

    // Pass 2: parents, labels, dependencies (all targets exist now).
    for (const task of source.tasks) {
      const id = taskIds.get(task.id);
      if (!id) continue;
      const parentId = task.parentTaskId ? (taskIds.get(task.parentTaskId) ?? null) : null;
      if (parentId && parentId !== id) {
        await prisma.task.update({ where: { id }, data: { parentTaskId: parentId } });
      }
      for (const { label } of task.labels) {
        let labelId = labelIds.get(label.name);
        if (!labelId) {
          const created = await prisma.label.create({
            data: { name: label.name, color: label.color, projectId: project.id },
          });
          labelId = created.id;
          labelIds.set(label.name, labelId);
        }
        await prisma.taskLabel.create({ data: { taskId: id, labelId } });
      }
      for (const { dependsOnId } of task.dependencies) {
        const target = taskIds.get(dependsOnId);
        if (target && target !== id) {
          await prisma.taskDependency.create({ data: { taskId: id, dependsOnId: target } });
        }
      }
    }
  }

  for (const source of parsed.data.data.user.conversations) {
    await prisma.aIConversation.create({
      data: {
        title: source.title,
        userId,
        projectId: source.projectId ? (projectIds.get(source.projectId) ?? null) : null,
        messages: {
          create: source.messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        },
      },
    });
    imported.conversations += 1;
    imported.messages += source.messages.length;
  }

  return NextResponse.json({ ok: true, imported });
}
