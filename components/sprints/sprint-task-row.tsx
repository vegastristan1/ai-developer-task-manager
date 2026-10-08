'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';
import { TaskStatusBadge } from '@/components/tasks/task-status-badge';
import { Button } from '@/components/ui/button';
import type { TaskStatusValue, TaskPriorityValue } from '@/lib/validations/task';

interface SprintTaskRowProps {
  task: {
    id: string;
    title: string;
    status: TaskStatusValue;
    priority: TaskPriorityValue;
    dueDate: Date | string | null;
    overdue: boolean;
  };
}

export function SprintTaskRow({ task }: SprintTaskRowProps) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleRemove() {
    setIsRemoving(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sprintId: null }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(data?.error ?? 'Could not remove the task');
        return;
      }

      toast.success('Task moved back to the backlog');
      router.refresh();
    } catch {
      toast.error('Could not remove the task');
    } finally {
      setIsRemoving(false);
    }
  }

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;

  return (
    <li className="flex items-center gap-2 rounded-md border px-3 py-2">
      <TaskStatusBadge status={task.status} />
      <Link
        href={`/tasks/${task.id}`}
        className="hover:text-primary min-w-0 flex-1 truncate text-sm font-medium underline-offset-4 hover:underline"
      >
        {task.title}
      </Link>
      {dueDate && (
        <span
          className={`hidden text-xs sm:inline ${task.overdue ? 'font-medium text-red-500' : 'text-muted-foreground'}`}
        >
          Due {dueDate.toLocaleDateString()}
        </span>
      )}
      <TaskPriorityBadge priority={task.priority} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Remove ${task.title} from sprint`}
        onClick={handleRemove}
        disabled={isRemoving}
        className="size-8"
      >
        {isRemoving ? <Loader2 className="animate-spin" /> : <X />}
      </Button>
    </li>
  );
}
