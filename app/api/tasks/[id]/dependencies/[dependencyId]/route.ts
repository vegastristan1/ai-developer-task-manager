import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { removeDependency } from '@/services/dependencies';

type RouteContext = { params: Promise<{ id: string; dependencyId: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const { id, dependencyId } = await params;
  const removed = await removeDependency(session.user.id, id, dependencyId);

  if (!removed) {
    return NextResponse.json({ error: 'Dependency not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
