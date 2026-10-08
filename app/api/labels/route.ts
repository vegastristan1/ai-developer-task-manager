import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { labelQuerySchema, labelSchema } from '@/lib/validations/label';
import { createLabel, listLabels } from '@/services/labels';

export async function GET(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const parsedQuery = labelQuerySchema.safeParse({
    projectId: request.nextUrl.searchParams.get('projectId') ?? undefined,
  });
  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsedQuery.error.issues },
      { status: 422 },
    );
  }

  const { projectId } = parsedQuery.data;
  const labels = await listLabels(session.user.id, projectId);
  if (!labels) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json({ labels });
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const body = await request.json().catch(() => null);
  const parsed = labelSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const result = await createLabel(session.user.id, parsed.data);

  if (!result.ok) {
    if (result.reason === 'conflict') {
      return NextResponse.json(
        { error: 'A label with this name already exists in this project' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  return NextResponse.json({ label: result.label }, { status: 201 });
}
