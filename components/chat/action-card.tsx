'use client';

import { Loader2, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ChatAction } from '@/lib/ai/actions';
import { taskPriorityLabels, taskStatusLabels } from '@/lib/validations/task';

interface ActionCardProps {
  action: ChatAction;
  canApprove: boolean;
  isApproving: boolean;
  onApprove: () => void;
  onDismiss: () => void;
}

export function ActionCard({ action, canApprove, isApproving, onApprove, onDismiss }: ActionCardProps) {
  return (
    <div className="border-bg-background mt-2 grid gap-2 rounded-md border p-3">
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
        <Wrench className="size-3.5" />
        Proposed action
      </p>

      {action.type === 'create_task' ? (
        <div className="grid gap-1">
          <p className="text-sm font-medium">{action.params.title}</p>
          {action.params.description && (
            <p className="text-muted-foreground text-xs">{action.params.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">New task</Badge>
            {action.params.priority && (
              <Badge variant="secondary">{taskPriorityLabels[action.params.priority]}</Badge>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-1">
          <p className="text-sm font-medium">{action.params.taskTitle ?? action.params.taskId}</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">Status → {taskStatusLabels[action.params.status]}</Badge>
          </div>
        </div>
      )}

      {!canApprove && action.type === 'create_task' && (
        <p className="text-muted-foreground text-xs">
          Bind a project to this chat to enable task creation.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onDismiss} disabled={isApproving}>
          Dismiss
        </Button>
        <Button size="sm" onClick={onApprove} disabled={isApproving || !canApprove}>
          {isApproving && <Loader2 className="animate-spin" />}
          Approve
        </Button>
      </div>
    </div>
  );
}
