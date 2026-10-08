import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { sprintSchema } from '@/lib/validations/sprint';
import { createSprint, listSprints } from '@/services/sprints';

export async function GET(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const projectId = request.nextUrl.searchParams.get('projectId') ?? undefined;
  const sprints = await listSprints(session.user.id, { projectId });

  return NextResponse.json({ sprints });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const body = await request.json().catch(() => null);
  const parsed = sprintSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const result = await createSprint(session.user.id, parsed.data);

  if (!result.ok) {
    if (result.reason === 'project-not-found') {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json(
      {
        error: 'Invalid input',
        issues: [{ path: ['endDate'], message: 'End date must be on or after the start date' }],
      },
      { status: 422 },
    );
  }

  return NextResponse.json({ sprint: result.sprint }, { status: 201 });
}
