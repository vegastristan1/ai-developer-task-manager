import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { conversationQuerySchema } from '@/lib/validations/chat';
import { listConversations } from '@/services/ai/chat';

export async function GET(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const parsedQuery = conversationQuerySchema.safeParse({
    projectId: request.nextUrl.searchParams.get('projectId') ?? undefined,
  });
  if (!parsedQuery.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsedQuery.error.issues },
      { status: 422 },
    );
  }

  const conversations = await listConversations(session.user.id, parsedQuery.data.projectId);

  return NextResponse.json({ conversations });
}
