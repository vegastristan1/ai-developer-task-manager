import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { listConversations } from '@/services/ai/chat';

export async function GET(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const projectId = request.nextUrl.searchParams.get('projectId');
  const conversations = await listConversations(session.user.id, projectId ?? undefined);

  return NextResponse.json({ conversations });
}
