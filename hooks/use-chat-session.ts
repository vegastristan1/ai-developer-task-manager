'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { UiMessage } from '@/components/chat/chat-window';
import type { ChatAction } from '@/lib/ai/actions';

function appendLast(messages: UiMessage[], chunk: string): UiMessage[] {
  if (messages.length === 0) return messages;
  const copy = messages.slice();
  const last = copy[copy.length - 1];
  copy[copy.length - 1] = { ...last, content: last.content + chunk };
  return copy;
}

interface UseChatSessionOptions {
  initialConversationId: string | null;
  initialProjectId: string | null;
  initialMessages: UiMessage[];
  onConversationCreated?: (conversationId: string) => void;
  onSynced?: () => void;
  onProjectChanged?: (projectId: string | null) => void;
}

/**
 * Shared chat state: streaming send, action approval, dismissal, and the
 * active conversation/project ids. Used by the full /chat page and the
 * floating quick-chat bubble so both behave identically.
 */
export function useChatSession({
  initialConversationId,
  initialProjectId,
  initialMessages,
  onConversationCreated,
  onSynced,
  onProjectChanged,
}: UseChatSessionOptions) {
  const [messages, setMessages] = useState<UiMessage[]>(initialMessages);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    initialConversationId,
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(initialProjectId);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  const handleSelectProject = useCallback(
    (value: string) => {
      const next = value === 'none' ? null : value;
      setSelectedProjectId(next);
      onProjectChanged?.(next);
    },
    [onProjectChanged],
  );

  const openConversation = useCallback((conversationId: string | null, next: UiMessage[]) => {
    setCurrentConversationId(conversationId);
    setMessages(next);
    setDismissed({});
  }, []);

  const startLocalNewChat = useCallback(() => {
    setCurrentConversationId(null);
    setMessages([]);
    setDismissed({});
  }, []);

  const dismissKey = useCallback((key: string) => {
    setDismissed((current) => ({ ...current, [key]: true }));
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
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
          onConversationCreated?.(conversationHeader);
        } else {
          onSynced?.();
        }
      } catch {
        setMessages((current) => current.slice(0, -2));
        toast.error('The AI request failed');
      } finally {
        setIsStreaming(false);
      }
    },
    [currentConversationId, isStreaming, onConversationCreated, onSynced, selectedProjectId],
  );

  const handleApprove = useCallback(
    async (action: ChatAction) => {
      if (isStreaming || isApproving) return;
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
          onSynced?.();
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
        onSynced?.();
      } catch {
        toast.error('The action failed');
      } finally {
        setIsApproving(false);
      }
    },
    [isApproving, isStreaming, onSynced, selectedProjectId],
  );

  return {
    messages,
    currentConversationId,
    selectedProjectId,
    isStreaming,
    isApproving,
    dismissed,
    handleSend,
    handleApprove,
    handleSelectProject,
    openConversation,
    startLocalNewChat,
    dismissKey,
  };
}
