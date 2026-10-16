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
import type { ChatAction } from '@/lib/ai/actions';
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

function appendLast(messages: UiMessage[], chunk: string): UiMessage[] {
  if (messages.length === 0) return messages;
  const copy = messages.slice();
  const last = copy[copy.length - 1];
  copy[copy.length - 1] = { ...last, content: last.content + chunk };
  return copy;
}

export function ChatShell({ conversations, projects, active, initialProjectId }: ChatShellProps) {
  const router = useRouter();
  const activeId = active?.id ?? null;

  const [messages, setMessages] = useState<UiMessage[]>(() => toUiMessages(active));
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(activeId);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});
  const [listOpen, setListOpen] = useState(false);

  function chatUrl(projectId: string | null): string {
    return projectId ? `/chat?p=${projectId}` : '/chat';
  }

  function startNewChat() {
    if (isStreaming) return;
    router.push(chatUrl(selectedProjectId));
  }

  function handleSelectProject(value: string) {
    const next = value === 'none' ? null : value;
    setSelectedProjectId(next);
    router.replace(chatUrl(next));
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
        router.push(chatUrl(selectedProjectId));
      } else {
        router.refresh();
      }
    } catch {
      toast.error('Could not delete conversation');
    }
  }

  async function handleSend(text: string) {
    if (isStreaming) return;
    setIsStreaming(true);

    const userKey = `local-user-${crypto.randomUUID()}`;
    const assistantKey = `local-assistant-${crypto.randomUUID()}`;
    setMessages((current) => [
      ...current,
      { id: userKey, role: 'USER', content: text },
      { id: assistantKey, role: 'ASSISTANT', content: '' },
    ]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          conversationId: currentConversationId ?? undefined,
          projectId: selectedProjectId ?? undefined,
        }),
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        setMessages((current) => current.slice(0, -2));
        toast.error(payload?.error ?? 'The AI request failed');
        return;
      }

      const conversationHeader = response.headers.get('x-conversation-id');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let received = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          received = true;
          setMessages((current) => appendLast(current, chunk));
        }
      }

      if (!received) {
        setMessages((current) => appendLast(current, '[No response received.]'));
      }

      if (conversationHeader && conversationHeader !== currentConversationId) {
        setCurrentConversationId(conversationHeader);
        router.replace(`/chat?c=${conversationHeader}`);
      } else {
        router.refresh();
      }
    } catch {
      setMessages((current) => current.slice(0, -2));
      toast.error('The AI request failed');
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleApprove(action: ChatAction) {
    setIsApproving(true);
    try {
      if (action.type === 'create_task') {
        if (!selectedProjectId) {
          toast.error('Bind a project to this chat first');
          return;
        }
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: selectedProjectId,
            title: action.params.title,
            description: action.params.description,
            priority: action.params.priority,
          }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          toast.error(payload?.error ?? 'Could not create task');
          return;
        }
        toast.success('Task created');
        router.refresh();
        return;
      }

      const response = await fetch(`/api/tasks/${action.params.taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action.params.status }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        toast.error(payload?.error ?? 'Could not update the task');
        return;
      }
      toast.success('Task status updated');
      router.refresh();
    } catch {
      toast.error('The action failed');
    } finally {
      setIsApproving(false);
    }
  }

  return (
    <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <div className="grid gap-2 lg:hidden">
        <ConversationControls
          projects={projects}
          selectedProjectId={selectedProjectId}
          isStreaming={isStreaming}
          onSelectProject={handleSelectProject}
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
        onSelectProject={handleSelectProject}
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
        messages={messages}
        isStreaming={isStreaming}
        isApproving={isApproving}
        projectBound={!!selectedProjectId}
        dismissed={dismissed}
        onSend={handleSend}
        onApprove={handleApprove}
        onDismiss={(key) => setDismissed((current) => ({ ...current, [key]: true }))}
      />
    </div>
  );
}
