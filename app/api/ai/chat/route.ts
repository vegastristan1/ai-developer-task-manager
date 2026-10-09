import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import type { AIRole } from '@/generated/prisma/client';
import { buildChatContext, buildSystemPrompt, mockChatReply } from '@/lib/ai/chat';
import { AiError, chatStream } from '@/lib/ai/client';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';
import { readJsonBody } from '@/lib/security/body';
import { rateLimitResponse } from '@/lib/security/responses';
import { chatRequestSchema } from '@/lib/validations/chat';
import { appendMessage, createConversation } from '@/services/ai/chat';

const CHAT_WINDOW_MS = 60 * 1000;
const CHAT_LIMIT_PER_USER = 20;
const CHAT_MAX_BODY_BYTES = 64 * 1024;

function titleFrom(content: string): string {
  const clean = content.replace(/\s+/g, ' ').trim();
  return clean.length > 60 ? `${clean.slice(0, 57)}...` : clean;
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAuth();
  if (!session) return response;
  const userId = session.user.id;

  const limited = rateLimitResponse(`ai-chat:${userId}`, CHAT_LIMIT_PER_USER, CHAT_WINDOW_MS);
  if (limited) return limited;

  const parsedBody = await readJsonBody<{ content?: unknown }>(request, CHAT_MAX_BODY_BYTES);
  if (!parsedBody.ok) return parsedBody.response;

  const parsed = chatRequestSchema.safeParse(parsedBody.body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 422 },
    );
  }

  const { content, conversationId, projectId } = parsed.data;

  let boundProjectId: string | null = null;
  if (projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    boundProjectId = project.id;
  }

  let targetConversationId: string;
  let history: { role: AIRole; content: string }[] = [];

  if (conversationId) {
    const conversation = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId },
      select: {
        id: true,
        projectId: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          select: { role: true, content: true },
        },
      },
    });
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    targetConversationId = conversation.id;
    history = conversation.messages;

    if (conversation.projectId) {
      boundProjectId = conversation.projectId;
    } else if (boundProjectId) {
      await prisma.aIConversation.update({
        where: { id: conversation.id },
        data: { projectId: boundProjectId },
      });
      revalidateTag('chat', { expire: 0 });
    }
  } else {
    const created = await createConversation(userId, boundProjectId, titleFrom(content));
    targetConversationId = created.id;
  }

  await appendMessage(targetConversationId, 'USER', content);

  const context = await buildChatContext(userId, boundProjectId);
  const system = buildSystemPrompt(context);

  const turns = [
    ...history.slice(-20).map((message) => ({
      role: (message.role === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: message.content,
    })),
    { role: 'user' as const, content },
  ];

  let stream;
  try {
    stream = await chatStream({
      system,
      messages: turns,
      mock: () => mockChatReply(context, content),
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

  const encoder = new TextEncoder();
  const iterator = stream.iterator;
  let accumulated = '';

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of iterator) {
          accumulated += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } catch {
        try {
          controller.enqueue(encoder.encode('\n\n[The AI stream was interrupted.]'));
        } catch {
          // client already disconnected
        }
      } finally {
        if (accumulated.trim().length > 0) {
          try {
            await appendMessage(targetConversationId, 'ASSISTANT', accumulated);
          } catch {
            // persistence failure must not break the stream
          }
        }
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      'X-AI-Source': stream.source,
      'X-Conversation-Id': targetConversationId,
    },
  });
}
