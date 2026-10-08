'use client';

import { Plus, Trash2 } from 'lucide-react';
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
}: ConversationSidebarProps) {
  return (
    <aside className="grid content-start gap-3">
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

      <div className="grid gap-1">
        <p className="text-muted-foreground px-1 text-xs font-medium tracking-wide uppercase">
          Conversations
        </p>
        {conversations.length === 0 ? (
          <p className="text-muted-foreground px-1 text-sm">No conversations yet.</p>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group flex items-center gap-1 rounded-md border px-2 py-1.5 text-sm transition-colors ${
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
          ))
        )}
      </div>
    </aside>
  );
}
