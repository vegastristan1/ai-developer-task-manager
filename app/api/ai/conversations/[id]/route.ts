import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { deleteConversation, getConversation } from '@/services/ai/chat';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const { id } = await params;
  const conversation = await getConversation(id, session.user.id);

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  return NextResponse.json({ conversation });
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const { id } = await params;
  const deleted = await deleteConversation(id, session.user.id);

  if (!deleted) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
