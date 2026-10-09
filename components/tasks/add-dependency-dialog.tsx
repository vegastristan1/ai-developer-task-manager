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
import { TaskStatusBadge } from '@/components/tasks/task-status-badge';
import type { TaskStatusValue } from '@/lib/validations/task';

interface CandidateTask {
  id: string;
  title: string;
  status: TaskStatusValue;
}

interface AddDependencyDialogProps {
  taskId: string;
  candidates: CandidateTask[];
}

export function AddDependencyDialog({ taskId, candidates }: AddDependencyDialogProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  function toggle(id: string) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]));
  }

  async function handleAdd() {
    if (selectedIds.length === 0) return;
    setIsAdding(true);

    let failed = 0;
    for (const dependsOnId of selectedIds) {
      try {
        const response = await fetch(`/api/tasks/${taskId}/dependencies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dependsOnId }),
        });
        if (!response.ok) failed += 1;
      } catch {
        failed += 1;
      }
    }

    setIsAdding(false);

    if (failed > 0) {
      toast.error(`Could not add ${failed} dependenc${failed === 1 ? 'y' : 'ies'}`);
    }

    const added = selectedIds.length - failed;
    if (added > 0) {
      toast.success(`Added ${added} dependenc${added === 1 ? 'y' : 'ies'}`);
      setSelectedIds([]);
      router.refresh();
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus />
          Add dependency
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add a dependency</AlertDialogTitle>
          <AlertDialogDescription>
            Select tasks from this project that must be completed before this task can start.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {candidates.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No tasks available — every other task in this project is already linked to this one.
          </p>
        ) : (
          <ul className="grid max-h-72 gap-1.5 overflow-y-auto">
            {candidates.map((task) => {
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
                    <TaskStatusBadge status={task.status} />
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isAdding}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleAdd} disabled={isAdding || selectedIds.length === 0}>
            {isAdding && <Loader2 className="animate-spin" />}
            Add {selectedIds.length > 0 ? `${selectedIds.length} ` : ''}
            dependenc{selectedIds.length === 1 ? 'y' : 'ies'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
