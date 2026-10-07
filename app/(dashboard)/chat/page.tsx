import type { Metadata } from 'next';
import { MessageSquare } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';

export const metadata: Metadata = { title: 'AI Chat' };

export default function ChatPage() {
  return (
    <>
      <PageHeader title="AI Chat" description="Ask AI about your projects, tasks, and sprints." />
      <EmptyState
        icon={<MessageSquare />}
        title="AI chat is coming soon"
        description="The context-aware AI developer chat with conversation history arrives in Phase 10 — AI Chat."
      />
    </>
  );
}
