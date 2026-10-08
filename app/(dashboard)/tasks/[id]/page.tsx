import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { CheckCircle2, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { DeleteTaskButton } from '@/components/tasks/delete-task-button';
import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';
import { TaskStatusBadge } from '@/components/tasks/task-status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getSessionUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/utils';
import { complexityLabels, taskTypeLabels, technicalAreaLabels } from '@/lib/validations/task';
import { getTask } from '@/services/tasks';

export const metadata: Metadata = { title: 'Task' };

export const instant = false;

interface TaskPageProps {
  params: Promise<{ id: string }>;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

export default async function TaskDetailsPage({ params }: TaskPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const task = await getTask(id, user.id);
  if (!task) {
    notFound();
  }

  const criteria = Array.isArray(task.acceptanceCriteria)
    ? task.acceptanceCriteria.filter((item): item is string => typeof item === 'string')
    : [];

  return (
    <>
      <PageHeader title={task.title} description={`In ${task.project.name}`}>
        <Button variant="outline" asChild>
          <Link href={`/tasks/${task.id}/edit`}>
            <Pencil />
            Edit
          </Link>
        </Button>
        <DeleteTaskButton taskId={task.id} taskTitle={task.title} />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid content-start gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {task.description ? (
                <p className="text-sm whitespace-pre-wrap">{task.description}</p>
              ) : (
                <p className="text-muted-foreground text-sm">No description yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acceptance criteria</CardTitle>
            </CardHeader>
            <CardContent>
              {criteria.length === 0 ? (
                <p className="text-muted-foreground text-sm">No acceptance criteria yet.</p>
              ) : (
                <ul className="grid gap-2">
                  {criteria.map((criterion, index) => (
                    <li key={`${index}-${criterion}`} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {task.technicalNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Technical notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{task.technicalNotes}</p>
              </CardContent>
            </Card>
          )}

          {task.subtasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Subtasks</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2">
                  {task.subtasks.map((subtask) => (
                    <li key={subtask.id}>
                      <Link
                        href={`/tasks/${subtask.id}`}
                        className="hover:bg-muted/50 flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors"
                      >
                        <TaskStatusBadge status={subtask.status as never} />
                        <span className="flex-1">{subtask.title}</span>
                        <TaskPriorityBadge priority={subtask.priority as never} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <DetailRow label="Status" value={<TaskStatusBadge status={task.status} />} />
              <DetailRow label="Priority" value={<TaskPriorityBadge priority={task.priority} />} />
              <Separator />
              <DetailRow label="Type" value={taskTypeLabels[task.type]} />
              <DetailRow
                label="Technical area"
                value={task.technicalArea ? technicalAreaLabels[task.technicalArea] : 'Not set'}
              />
              <DetailRow
                label="Complexity"
                value={task.complexity ? complexityLabels[task.complexity] : 'Not set'}
              />
              <Separator />
              <DetailRow
                label="Project"
                value={
                  <Link
                    href={`/projects/${task.project.id}`}
                    className="hover:text-primary underline-offset-4 hover:underline"
                  >
                    {task.project.name}
                  </Link>
                }
              />
              <DetailRow
                label="Sprint"
                value={
                  task.sprint ? (
                    <Link
                      href={`/sprints/${task.sprint.id}`}
                      className="hover:text-primary underline-offset-4 hover:underline"
                    >
                      {task.sprint.name}
                    </Link>
                  ) : (
                    'Backlog'
                  )
                }
              />
              <DetailRow
                label="Due date"
                value={task.dueDate ? formatDate(task.dueDate) : 'None'}
              />
              <DetailRow label="Est. effort" value={task.estimatedEffort ?? '—'} />
              <DetailRow label="Actual effort" value={task.actualEffort ?? '—'} />
              <Separator />
              <div className="grid gap-2">
                <span className="text-muted-foreground text-sm">Labels</span>
                {task.labels.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {task.labels.map(({ label }) => (
                      <span
                        key={label.id}
                        className="bg-muted inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium"
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: label.color }}
                          aria-hidden
                        />
                        {label.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">No labels</span>
                )}
              </div>
              <Separator />
              <DetailRow label="Created" value={formatDate(task.createdAt)} />
              <DetailRow label="Updated" value={formatDate(task.updatedAt)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
