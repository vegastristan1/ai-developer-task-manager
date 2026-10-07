import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { updateLabelSchema } from '@/lib/validations/label';
import { deleteLabel, updateLabel } from '@/services/labels';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateLabelSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const result = await updateLabel(id, session.user.id, parsed.data);

  if (!result.ok) {
    if (result.reason === 'conflict') {
      return NextResponse.json(
        { error: 'A label with this name already exists in this project' },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: 'Label not found' }, { status: 404 });
  }

  return NextResponse.json({ label: result.label });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const { id } = await params;
  const deleted = await deleteLabel(id, session.user.id);

  if (!deleted) {
    return NextResponse.json({ error: 'Label not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
