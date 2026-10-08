import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth/session';
import {
  taskPriorities,
  taskSchema,
  taskSorts,
  taskStatuses,
  taskTypes,
} from '@/lib/validations/task';
import { createTask, listTasks } from '@/services/tasks';

const filterSchema = z.object({
  projectId: z.string().min(1),
  status: z.enum(taskStatuses),
  priority: z.enum(taskPriorities),
  type: z.enum(taskTypes),
  sort: z.enum(taskSorts),
  q: z.string().trim().max(200),
});

function parseFilters(request: NextRequest) {
  const raw = Object.fromEntries(
    [...request.nextUrl.searchParams.entries()].filter(([, value]) => value !== ''),
  );
  return filterSchema.partial().safeParse(raw);
}

export async function GET(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const parsed = parseFilters(request);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid filters', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const tasks = await listTasks(session.user.id, parsed.data);
  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const body = await request.json().catch(() => null);
  const parsed = taskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const result = await createTask(session.user.id, parsed.data);

  if (!result.ok) {
    if (result.reason === 'project-not-found') {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const error =
      result.reason === 'sprint-not-found'
        ? 'Sprint not found in this project'
        : 'Label not found in project';
    return NextResponse.json({ error }, { status: 422 });
  }

  return NextResponse.json({ task: result.task }, { status: 201 });
}
