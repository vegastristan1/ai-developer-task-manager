'use client';

import { useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ConversationSummary } from '@/services/ai/chat';

interface ConversationSidebarProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  projects: { id: string; name: string }[];
  selectedProjectId: string | null;
  isStreaming: boolean;
  onSelectProject: (value: string) => void;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  className?: string;
}

export function ConversationControls({
  projects,
  selectedProjectId,
  isStreaming,
  onSelectProject,
  onNewChat,
  className,
}: Pick<
  ConversationSidebarProps,
  'projects' | 'selectedProjectId' | 'isStreaming' | 'onSelectProject' | 'onNewChat'
> & { className?: string }) {
  return (
    <div className={cn('grid content-start gap-3', className)}>
      <Button variant="outline" size="sm" onClick={onNewChat} disabled={isStreaming}>
        <Plus />
        New chat
      </Button>

      {projects.length > 0 && (
        <Select
          value={selectedProjectId ?? 'none'}
          onValueChange={onSelectProject}
          disabled={isStreaming}
        >
          <SelectTrigger className="w-full" aria-label="Bind a project">
            <SelectValue placeholder="Bind a project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No project (overview)</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export function ConversationList({
  conversations,
  activeId,
  isStreaming,
  onSelect,
  onDelete,
  className,
}: Pick<
  ConversationSidebarProps,
  'conversations' | 'activeId' | 'isStreaming' | 'onSelect' | 'onDelete'
> & { className?: string }) {
  const groups = useMemo(() => {
    const byProject = new Map<string, { name: string; items: typeof conversations }>();
    for (const conversation of conversations) {
      const key = conversation.projectId ?? 'none';
      const name = conversation.project?.name ?? 'No project (overview)';
      const group = byProject.get(key);
      if (group) {
        group.items.push(conversation);
      } else {
        byProject.set(key, { name, items: [conversation] });
      }
    }
    // Most recently active group first; unbound chats last.
    return [...byProject.entries()].sort(([keyA], [keyB]) => {
      if (keyA === 'none') return 1;
      if (keyB === 'none') return -1;
      return 0;
    });
  }, [conversations]);

  return (
    <div className={cn('ms:p-4 grid gap-3', className)}>
      <p className="text-muted-foreground px-1 text-xs font-medium tracking-wide uppercase">
        Conversations
      </p>
      {conversations.length === 0 ? (
        <p className="text-muted-foreground px-1 text-sm">No conversations yet.</p>
      ) : (
        groups.map(([key, group]) => (
          <div key={key} className="grid gap-1">
            <p className="flex items-center justify-between px-1 text-xs font-medium">
              <span className="min-w-0 truncate">{group.name}</span>
              <span className="text-muted-foreground tabular-nums">{group.items.length}</span>
            </p>
            {group.items.map((conversation) => (
              <div
                key={conversation.id}
                className={`group ml-6 flex min-w-0 items-center gap-1 rounded-md border px-2 py-1.5 text-sm transition-colors ${
                  activeId === conversation.id
                    ? 'border-primary/40 bg-muted font-medium'
                    : 'hover:bg-muted/50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className="min-w-0 flex-1 cursor-pointer text-left disabled:opacity-50"
                  title={conversation.title ?? 'Untitled chat'}
                  disabled={isStreaming}
                >
                  <span className="block truncate">{conversation.title ?? 'Untitled chat'}</span>
                  <span className="text-muted-foreground block text-xs font-normal">
                    {conversation.messageCount} message{conversation.messageCount === 1 ? '' : 's'}
                    {conversation.project ? ` · ${conversation.project.name}` : ''}
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={() => onDelete(conversation.id)}
                  aria-label="Delete conversation"
                  disabled={isStreaming}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

export function ConversationSidebar({
  conversations,
  activeId,
  projects,
  selectedProjectId,
  isStreaming,
  onSelectProject,
  onNewChat,
  onSelect,
  onDelete,
  className,
}: ConversationSidebarProps) {
  return (
    <aside className={cn('grid min-w-0 content-start gap-3', className)}>
      <ConversationControls
        projects={projects}
        selectedProjectId={selectedProjectId}
        isStreaming={isStreaming}
        onSelectProject={onSelectProject}
        onNewChat={onNewChat}
      />
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        isStreaming={isStreaming}
        onSelect={onSelect}
        onDelete={onDelete}
      />
    </aside>
  );
}
