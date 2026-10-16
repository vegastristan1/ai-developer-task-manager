'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessagesSquare } from 'lucide-react';
import { toast } from 'sonner';
import { ChatWindow, type UiMessage } from '@/components/chat/chat-window';
import {
  ConversationControls,
  ConversationList,
  ConversationSidebar,
} from '@/components/chat/conversation-sidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useChatSession } from '@/hooks/use-chat-session';
import type { ConversationDetail, ConversationSummary } from '@/services/ai/chat';

interface ChatShellProps {
  conversations: ConversationSummary[];
  projects: { id: string; name: string }[];
  active: ConversationDetail | null;
  initialProjectId: string | null;
}

function toUiMessages(conversation: ConversationDetail | null): UiMessage[] {
  return (conversation?.messages ?? []).map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
  }));
}

export function ChatShell({ conversations, projects, active, initialProjectId }: ChatShellProps) {
  const router = useRouter();
  const activeId = active?.id ?? null;

  const session = useChatSession({
    initialConversationId: activeId,
    initialProjectId,
    initialMessages: toUiMessages(active),
    onConversationCreated: (conversationId) => router.replace(`/chat?c=${conversationId}`),
    onSynced: () => router.refresh(),
    onProjectChanged: (projectId) => router.replace(projectId ? `/chat?p=${projectId}` : '/chat'),
  });
  const { isStreaming, selectedProjectId } = session;

  const [listOpen, setListOpen] = useState(false);

  function startNewChat() {
    if (isStreaming) return;
    router.push(selectedProjectId ? `/chat?p=${selectedProjectId}` : '/chat');
  }

  function handleSelectConversation(id: string) {
    if (isStreaming) return;
    setListOpen(false);
    router.push(`/chat?c=${id}`);
  }

  async function handleDelete(id: string) {
    if (isStreaming) return;
    try {
      const response = await fetch(`/api/ai/conversations/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        toast.error(payload?.error ?? 'Could not delete conversation');
        return;
      }
      toast.success('Conversation deleted');
      if (id === activeId) {
        router.push(selectedProjectId ? `/chat?p=${selectedProjectId}` : '/chat');
      } else {
        router.refresh();
      }
    } catch {
      toast.error('Could not delete conversation');
    }
  }

  return (
    <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <div className="grid gap-2 lg:hidden">
        <ConversationControls
          projects={projects}
          selectedProjectId={selectedProjectId}
          isStreaming={isStreaming}
          onSelectProject={session.handleSelectProject}
          onNewChat={startNewChat}
          className="grid-cols-2 items-center [&>button]:w-full"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setListOpen(true)}
          aria-label={`Open conversations (${conversations.length})`}
        >
          <MessagesSquare />
          Conversations
          <span className="text-muted-foreground tabular-nums">({conversations.length})</span>
        </Button>
      </div>
      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        projects={projects}
        selectedProjectId={selectedProjectId}
        isStreaming={isStreaming}
        onSelectProject={session.handleSelectProject}
        onNewChat={startNewChat}
        onSelect={handleSelectConversation}
        onDelete={handleDelete}
        className="hidden lg:grid"
      />
      <Sheet open={listOpen} onOpenChange={setListOpen}>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Conversations</SheetTitle>
          </SheetHeader>
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            isStreaming={isStreaming}
            onSelect={handleSelectConversation}
            onDelete={handleDelete}
          />
        </SheetContent>
      </Sheet>
      <ChatWindow
        messages={session.messages}
        isStreaming={session.isStreaming}
        isApproving={session.isApproving}
        projectBound={!!selectedProjectId}
        dismissed={session.dismissed}
        onSend={session.handleSend}
        onApprove={session.handleApprove}
        onDismiss={session.dismissKey}
      />
    </div>
  );
}
