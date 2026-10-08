import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { updateTaskSchema } from '@/lib/validations/task';
import { deleteTask, getTask, updateTask } from '@/services/tasks';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const { id } = await params;
  const task = await getTask(id, session.user.id);

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json({ task });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const result = await updateTask(id, session.user.id, parsed.data);

  if (!result.ok) {
    const status = result.reason === 'task-not-found' ? 404 : 422;
    const error =
      result.reason === 'task-not-found'
        ? 'Task not found'
        : result.reason === 'project-not-found'
          ? 'Project not found'
          : result.reason === 'sprint-not-found'
            ? 'Sprint not found in this project'
            : result.reason === 'parent-not-found'
              ? 'Parent task not found in this project'
              : result.reason === 'self-parent'
                ? 'A task cannot be its own parent'
                : 'Label not found in project';
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ task: result.task });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const { id } = await params;
  const deleted = await deleteTask(id, session.user.id);

  if (!deleted) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
