'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, MessageSquarePlus, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { ChatWindow, type UiMessage } from '@/components/chat/chat-window';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useChatSession } from '@/hooks/use-chat-session';
import type { ConversationDetail, ConversationSummary } from '@/services/ai/chat';

function toUiMessages(conversation: ConversationDetail | null): UiMessage[] {
  return (conversation?.messages ?? []).map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
  }));
}

const NEW_CHAT = 'new';
const NO_PROJECT = 'none';

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [recents, setRecents] = useState<ConversationSummary[]>([]);

  const session = useChatSession({
    initialConversationId: null,
    initialProjectId: null,
    initialMessages: [],
    onConversationCreated: () => void reloadRecents(),
    onSynced: () => void reloadRecents(),
  });
  const { currentConversationId, selectedProjectId, isStreaming } = session;

  const reloadRecents = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/conversations');
      if (!response.ok) return;
      const data = await response.json().catch(() => null);
      if (Array.isArray(data?.conversations)) setRecents(data.conversations.slice(0, 5));
    } catch {
      // Bubble stays usable without the recent list.
    }
  }, []);

  useEffect(() => {
    if (!open || loaded) return;
    let cancelled = false;
    (async () => {
      try {
        const [projectsResponse] = await Promise.all([fetch('/api/projects'), reloadRecents()]);
        if (projectsResponse.ok && !cancelled) {
          const data = await projectsResponse.json().catch(() => null);
          if (Array.isArray(data?.projects)) {
            setProjects(
              data.projects.map((project: { id: string; name: string }) => ({
                id: project.id,
                name: project.name,
              })),
            );
          }
        }
      } catch {
        // Bubble stays usable without the project list.
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loaded, open, reloadRecents]);

  async function resumeConversation(id: string) {
    if (isStreaming) return;
    if (id === NEW_CHAT) {
      session.startLocalNewChat();
      return;
    }
    try {
      const response = await fetch(`/api/ai/conversations/${id}`);
      if (!response.ok) {
        toast.error('Could not open conversation');
        return;
      }
      const data = await response.json().catch(() => null);
      if (!data?.conversation) {
        toast.error('Could not open conversation');
        return;
      }
      session.openConversation(id, toUiMessages(data.conversation));
      if (data.conversation.projectId && data.conversation.projectId !== selectedProjectId) {
        session.handleSelectProject(data.conversation.projectId);
      }
    } catch {
      toast.error('Could not open conversation');
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        size="icon-lg"
        className="fixed right-4 bottom-4 z-40 rounded-full shadow-lg"
        onClick={() => setOpen(true)}
        aria-expanded={false}
        aria-label="Open AI chat"
      >
        <Sparkles className="size-5" />
      </Button>
    );
  }

  const resumeValue = recents.some((recent) => recent.id === currentConversationId)
    ? (currentConversationId ?? NEW_CHAT)
    : NEW_CHAT;

  return (
    <div className="bg-background fixed right-4 bottom-4 z-40 flex h-[min(600px,calc(100dvh-6rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border shadow-xl max-sm:right-3 max-sm:bottom-3 max-sm:left-3 max-sm:h-[75dvh] max-sm:w-auto">
      <div className="flex flex-col gap-2 border-b p-3">
        <div className="flex items-center gap-1.5">
          <Select
            value={resumeValue}
            onValueChange={(value) => void resumeConversation(value)}
            disabled={isStreaming}
          >
            <SelectTrigger size="sm" className="min-w-0 flex-1" aria-label="Recent conversations">
              <SelectValue placeholder="Recent conversations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NEW_CHAT}>New conversation</SelectItem>
              {recents.map((recent) => (
                <SelectItem key={recent.id} value={recent.id}>
                  {recent.title ?? 'Untitled chat'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={session.startLocalNewChat}
            disabled={isStreaming}
            aria-label="Start new chat"
          >
            <MessageSquarePlus />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" asChild aria-label="Open full chat">
            <Link href="/chat">
              <ExternalLink />
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(false)}
            aria-expanded
            aria-label="Close AI chat"
          >
            <X />
          </Button>
        </div>
        {projects.length > 0 && (
          <Select
            value={selectedProjectId ?? NO_PROJECT}
            onValueChange={session.handleSelectProject}
            disabled={isStreaming}
          >
            <SelectTrigger size="sm" className="w-full" aria-label="Bind a project">
              <SelectValue placeholder="Bind a project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PROJECT}>No project (overview)</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <ChatWindow
        messages={session.messages}
        isStreaming={session.isStreaming}
        isApproving={session.isApproving}
        projectBound={!!selectedProjectId}
        dismissed={session.dismissed}
        onSend={session.handleSend}
        onApprove={session.handleApprove}
        onDismiss={session.dismissKey}
        className="h-auto min-h-0 flex-1 rounded-none border-0"
      />
    </div>
  );
}
