'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';
import type { TaskPriorityValue } from '@/lib/validations/task';

interface BacklogTask {
  id: string;
  title: string;
  priority: TaskPriorityValue;
}

interface AssignTasksDialogProps {
  sprintId: string;
  tasks: BacklogTask[];
}

export function AssignTasksDialog({ sprintId, tasks }: AssignTasksDialogProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  function toggle(id: string) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  }

  async function handleAssign() {
    if (selectedIds.length === 0) return;
    setIsAssigning(true);

    let failed = 0;
    for (const taskId of selectedIds) {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sprintId }),
        });
        if (!response.ok) failed += 1;
      } catch {
        failed += 1;
      }
    }

    setIsAssigning(false);

    if (failed > 0) {
      toast.error(`Could not add ${failed} task${failed === 1 ? '' : 's'}`);
    }

    const added = selectedIds.length - failed;
    if (added > 0) {
      toast.success(`${added} task${added === 1 ? '' : 's'} added to the sprint`);
      setSelectedIds([]);
      router.refresh();
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <Plus />
          Add tasks
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add tasks to this sprint</AlertDialogTitle>
          <AlertDialogDescription>
            Select backlog tasks from this project to include in the sprint.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No backlog tasks available — every task in this project is already in a sprint.
          </p>
        ) : (
          <ul className="grid max-h-72 gap-1.5 overflow-y-auto">
            {tasks.map((task) => {
              const checked = selectedIds.includes(task.id);
              return (
                <li key={task.id}>
                  <label className="hover:bg-muted/50 flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-colors">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(task.id)}
                      className="accent-primary size-4"
                    />
                    <span className="min-w-0 flex-1 truncate">{task.title}</span>
                    <TaskPriorityBadge priority={task.priority} />
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isAssigning}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAssign}
            disabled={isAssigning || selectedIds.length === 0}
          >
            {isAssigning && <Loader2 className="animate-spin" />}
            Add {selectedIds.length > 0 ? `${selectedIds.length} ` : ''}
            task{selectedIds.length === 1 ? '' : 's'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
