import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { updateSprintSchema } from '@/lib/validations/sprint';
import { deleteSprint, getSprint, updateSprint } from '@/services/sprints';

type RouteContext = { params: Promise<{ id: string }> };

function invalidDatesResponse() {
  return NextResponse.json(
    {
      error: 'Invalid input',
      issues: [{ path: ['endDate'], message: 'End date must be on or after the start date' }],
    },
    { status: 422 },
  );
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const { id } = await params;
  const sprint = await getSprint(id, session.user.id);

  if (!sprint) {
    return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
  }

  return NextResponse.json({ sprint });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateSprintSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const result = await updateSprint(id, session.user.id, parsed.data);

  if (!result.ok) {
    if (result.reason === 'sprint-not-found') {
      return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
    }
    if (result.reason === 'invalid-dates') {
      return invalidDatesResponse();
    }
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json({ sprint: result.sprint });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const { id } = await params;
  const deleted = await deleteSprint(id, session.user.id);

  if (!deleted) {
    return NextResponse.json({ error: 'Sprint not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
