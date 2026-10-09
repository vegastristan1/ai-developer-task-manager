import Link from 'next/link';
import { GitBranch } from 'lucide-react';
import { AddDependencyDialog } from '@/components/tasks/add-dependency-dialog';
import { RemoveDependencyButton } from '@/components/tasks/remove-dependency-button';
import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';
import { TaskStatusBadge } from '@/components/tasks/task-status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DependencyTask } from '@/services/dependencies';

interface DependencyCandidate {
  id: string;
  title: string;
  status: DependencyTask['status'];
}

interface DependenciesCardProps {
  taskId: string;
  blockedBy: DependencyTask[];
  blocks: DependencyTask[];
  candidates: DependencyCandidate[];
}

function DependencyRow({ ownerTaskId, task }: { ownerTaskId: string; task: DependencyTask }) {
  return (
    <li className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
      <TaskStatusBadge status={task.status} />
      <Link
        href={`/tasks/${task.id}`}
        className="hover:text-primary min-w-0 flex-1 truncate underline-offset-4 hover:underline"
      >
        {task.title}
      </Link>
      <TaskPriorityBadge priority={task.priority} />
      <RemoveDependencyButton
        taskId={ownerTaskId}
        dependencyId={task.dependencyId}
        taskTitle={task.title}
      />
    </li>
  );
}

export function DependenciesCard({ taskId, blockedBy, blocks, candidates }: DependenciesCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <GitBranch />
            Dependencies
          </CardTitle>
          <AddDependencyDialog taskId={taskId} candidates={candidates} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-5">
        <section className="grid gap-2">
          <p className="text-muted-foreground text-sm font-medium">Blocked by</p>
          {blockedBy.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nothing blocks this task — it can start right away.
            </p>
          ) : (
            <ul className="grid gap-1.5">
              {blockedBy.map((task) => (
                <DependencyRow key={task.dependencyId} ownerTaskId={taskId} task={task} />
              ))}
            </ul>
          )}
        </section>

        <section className="grid gap-2">
          <p className="text-muted-foreground text-sm font-medium">Blocks</p>
          {blocks.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              This task does not block any other task.
            </p>
          ) : (
            <ul className="grid gap-1.5">
              {blocks.map((task) => (
                <DependencyRow key={task.dependencyId} ownerTaskId={task.id} task={task} />
              ))}
            </ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
