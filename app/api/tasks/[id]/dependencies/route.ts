import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { createDependencySchema, dependencyReasonMessages } from '@/lib/validations/dependency';
import { addDependency } from '@/services/dependencies';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = createDependencySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const result = await addDependency(session.user.id, id, parsed.data.dependsOnId);

  if (!result.ok) {
    const status =
      result.reason === 'task-not-found' || result.reason === 'target-not-found'
        ? 404
        : result.reason === 'duplicate'
          ? 409
          : 422;
    return NextResponse.json({ error: dependencyReasonMessages[result.reason] }, { status });
  }

  return NextResponse.json({ dependency: result.dependency }, { status: 201 });
}
