import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ChatShell } from '@/components/chat/chat-shell';
import { PageHeader } from '@/components/common/page-header';
import { getSessionUser } from '@/lib/auth/session';
import { getConversation, listConversations } from '@/services/ai/chat';
import { listProjects } from '@/services/projects';

export const metadata: Metadata = { title: 'AI Chat' };

interface ChatPageProps {
  searchParams: Promise<{ c?: string; p?: string }>;
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const { c, p } = await searchParams;
  const [conversations, projects, active] = await Promise.all([
    listConversations(user.id),
    listProjects(user.id),
    c ? getConversation(c, user.id) : Promise.resolve(null),
  ]);

  const initialProjectId = active?.projectId ?? p ?? null;
  const knownProjectIds = new Set(projects.map((project) => project.id));
  const safeProjectId =
    initialProjectId && knownProjectIds.has(initialProjectId) ? initialProjectId : null;

  return (
    <>
      <PageHeader
        title="AI Chat"
        description="Ask AI about your projects, tasks, and sprints."
      />
      <ChatShell
        key={active?.id ?? 'new'}
        conversations={conversations}
        projects={projects.map((project) => ({ id: project.id, name: project.name }))}
        active={active}
        initialProjectId={safeProjectId}
      />
    </>
  );
}
