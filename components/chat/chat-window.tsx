'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MessageSquare, Send, Sparkles } from 'lucide-react';
import { ActionCard } from '@/components/chat/action-card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { parseActionBlocks, type ChatAction } from '@/lib/ai/actions';

export interface UiMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
}

interface ChatWindowProps {
  messages: UiMessage[];
  isStreaming: boolean;
  isApproving: boolean;
  projectBound: boolean;
  dismissed: Record<string, boolean>;
  onSend: (text: string) => void;
  onApprove: (action: ChatAction) => void;
  onDismiss: (key: string) => void;
}

const STARTERS = [
  'What should I work on next?',
  'Which tasks are currently blocked?',
  'Create a task to add rate limiting to the API',
];

export function ChatWindow({
  messages,
  isStreaming,
  isApproving,
  projectBound,
  dismissed,
  onSend,
  onApprove,
  onDismiss,
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages]);

  function submit() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput('');
    onSend(text);
  }

  return (
    <div className="border-border flex h-[calc(100vh-15rem)] min-h-96 flex-col overflow-hidden rounded-lg border">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <MessageSquare className="text-muted-foreground size-8" />
            <div>
              <p className="font-medium">Ask about your work</p>
              <p className="text-muted-foreground text-sm">
                Answers are scoped to your projects and tasks — nothing else is sent to the model.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTERS.map((starter) => (
                <Button
                  key={starter}
                  variant="outline"
                  size="sm"
                  onClick={() => onSend(starter)}
                  disabled={isStreaming}
                >
                  {starter}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, messageIndex) => {
            const isUser = message.role === 'USER';
            const { actions, cleanContent } = isUser
              ? { actions: [], cleanContent: message.content }
              : parseActionBlocks(message.content);

            return (
              <div key={message.id} className={isUser ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    isUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/40 border-border border'
                  }`}
                >
                  {!isUser && (
                    <p className="text-muted-foreground mb-1 flex items-center gap-1 text-xs font-medium">
                      <Sparkles className="size-3" />
                      Assistant
                    </p>
                  )}
                  <p className="whitespace-pre-wrap">
                    {cleanContent}
                    {isStreaming &&
                      messageIndex === messages.length - 1 &&
                      !isUser &&
                      cleanContent.length === 0 && (
                        <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
                      )}
                  </p>
                  {!isUser &&
                    actions.map((action, actionIndex) => {
                      const key = `${messageIndex}:${actionIndex}`;
                      if (dismissed[key]) return null;
                      return (
                        <ActionCard
                          key={key}
                          action={action}
                          canApprove={action.type !== 'create_task' || projectBound}
                          isApproving={isApproving}
                          onApprove={() => onApprove(action)}
                          onDismiss={() => onDismiss(key)}
                        />
                      );
                    })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="border-border flex items-end gap-2 border-t p-3"
      >
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Ask about your projects, tasks and sprints... (Enter to send, Shift+Enter for newline)"
          rows={2}
          className="max-h-40 min-h-12 resize-none"
          disabled={isStreaming}
          aria-label="Chat message"
        />
        <Button
          type="submit"
          size="icon"
          className="shrink-0"
          disabled={isStreaming || input.trim().length === 0}
          aria-label="Send message"
        >
          {isStreaming ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </form>
    </div>
  );
}
