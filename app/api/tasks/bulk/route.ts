import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { bulkTaskSchema } from '@/lib/validations/task';
import { createTasksBulk } from '@/services/tasks';

export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const body = await request.json().catch(() => null);
  const parsed = bulkTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const result = await createTasksBulk(session.user.id, parsed.data);

  if (!result.ok) {
    const status =
      result.reason === 'project-not-found' || result.reason === 'parent-not-found' ? 404 : 422;
    const error =
      result.reason === 'project-not-found'
        ? 'Project not found'
        : result.reason === 'parent-not-found'
          ? 'Parent task not found in this project'
          : result.reason === 'label-not-found'
            ? 'Label not found in project'
            : 'Sprint not found in this project';
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ tasks: result.tasks, skipped: result.skipped }, { status: 201 });
}
