import type { AIRole } from '@/generated/prisma/client';
import { prisma } from '@/lib/db/prisma';

export interface ConversationSummary {
  id: string;
  title: string | null;
  projectId: string | null;
  project: { name: string } | null;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessageItem {
  id: string;
  role: AIRole;
  content: string;
  createdAt: Date;
}

export interface ConversationDetail {
  id: string;
  title: string | null;
  projectId: string | null;
  messages: ChatMessageItem[];
  createdAt: Date;
  updatedAt: Date;
}

export async function listConversations(
  userId: string,
  projectId?: string,
): Promise<ConversationSummary[]> {
  const conversations = await prisma.aIConversation.findMany({
    where: { userId, ...(projectId && { projectId }) },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      projectId: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });

  const projectIds = [
    ...new Set(
      conversations
        .map((conversation) => conversation.projectId)
        .filter((id): id is string => !!id),
    ),
  ];
  const projects = projectIds.length
    ? await prisma.project.findMany({
        where: { id: { in: projectIds }, userId },
        select: { id: true, name: true },
      })
    : [];
  const projectNameById = new Map(projects.map((project) => [project.id, project.name]));

  return conversations.map(({ _count, ...conversation }) => ({
    ...conversation,
    messageCount: _count.messages,
    project: conversation.projectId
      ? { name: projectNameById.get(conversation.projectId) ?? 'Unknown project' }
      : null,
  }));
}

export async function getConversation(
  id: string,
  userId: string,
): Promise<ConversationDetail | null> {
  const conversation = await prisma.aIConversation.findFirst({
    where: { id, userId },
    select: {
      id: true,
      title: true,
      projectId: true,
      createdAt: true,
      updatedAt: true,
      messages: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, role: true, content: true, createdAt: true },
      },
    },
  });

  return conversation;
}

export async function deleteConversation(id: string, userId: string): Promise<boolean> {
  const conversation = await prisma.aIConversation.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!conversation) return false;

  await prisma.aIConversation.delete({ where: { id } });
  return true;
}

export async function createConversation(
  userId: string,
  projectId: string | null,
  title: string,
): Promise<{ id: string }> {
  const conversation = await prisma.aIConversation.create({
    data: { userId, projectId, title },
    select: { id: true },
  });
  return conversation;
}

export async function appendMessage(
  conversationId: string,
  role: AIRole,
  content: string,
): Promise<ChatMessageItem> {
  return prisma.aIMessage.create({
    data: { conversationId, role, content },
    select: { id: true, role: true, content: true, createdAt: true },
  });
}
