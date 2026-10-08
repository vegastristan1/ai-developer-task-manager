import { NextResponse } from 'next/server';
import { AiError } from '@/lib/ai/client';
import { requireAuth } from '@/lib/auth/session';
import type { AiServiceResult } from '@/services/ai';

export type AiRouteContext = { params: Promise<{ id: string }> };

export async function runAiRoute<T>(
  context: AiRouteContext,
  run: (taskId: string, userId: string) => Promise<AiServiceResult<T>>,
): Promise<NextResponse> {
  const { session, response } = await requireAuth();
  if (!session) return response;

  const { id } = await context.params;

  try {
    const result = await run(id, session.user.id);

    if (!result.ok) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: result.data,
      source: result.source,
      model: result.model || null,
    });
  } catch (error) {
    if (error instanceof AiError) {
      return NextResponse.json(
        { error: error.message, kind: error.kind },
        { status: error.kind === 'not-configured' ? 503 : 502 },
      );
    }
    throw error;
  }
}
