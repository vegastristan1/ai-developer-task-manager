import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Pencil } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { AssignTasksDialog } from '@/components/sprints/assign-tasks-dialog';
import { DeleteSprintButton } from '@/components/sprints/delete-sprint-button';
import { SprintAnalytics } from '@/components/sprints/sprint-analytics';
import { SprintProgress } from '@/components/sprints/sprint-progress';
import { SprintStatusBadge } from '@/components/sprints/sprint-status-badge';
import { SprintTaskRow } from '@/components/sprints/sprint-task-row';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getSessionUser } from '@/lib/auth/session';
import { formatDate } from '@/lib/utils';
import { getSprint, computeSprintStats } from '@/services/sprints';
import { listTasks } from '@/services/tasks';

export const metadata: Metadata = { title: 'Sprint' };

export const instant = false;

interface SprintPageProps {
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

export default async function SprintDetailsPage({ params }: SprintPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const sprint = await getSprint(id, user.id);
  if (!sprint) {
    notFound();
  }

  const tasks = await listTasks(user.id, { projectId: sprint.projectId, sort: 'position' });
  const members = tasks.filter((task) => task.sprintId === sprint.id);
  const backlog = tasks.filter((task) => !task.sprintId && !task.parentTaskId);
  const stats = computeSprintStats(members);

  return (
    <>
      <PageHeader
        title={sprint.name}
        description={sprint.goal ?? `Sprint for ${sprint.project.name}`}
      >
        <Button variant="outline" asChild>
          <Link href={`/sprints/${sprint.id}/edit`}>
            <Pencil />
            Edit
          </Link>
        </Button>
        <DeleteSprintButton sprintId={sprint.id} sprintName={sprint.name} />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid content-start gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <SprintProgress stats={stats} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle>Tasks</CardTitle>
                <AssignTasksDialog
                  sprintId={sprint.id}
                  tasks={backlog.map((task) => ({
                    id: task.id,
                    title: task.title,
                    priority: task.priority,
                  }))}
                />
              </div>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No tasks in this sprint yet — add backlog tasks or set a task&rsquo;s sprint in
                  its form.
                </p>
              ) : (
                <ul className="grid gap-2">
                  {members.map((task) => (
                    <SprintTaskRow key={task.id} task={task} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <DetailRow
                label="Status"
                value={
                  <SprintStatusBadge startDate={sprint.startDate} endDate={sprint.endDate} />
                }
              />
              <Separator />
              <DetailRow
                label="Dates"
                value={`${formatDate(sprint.startDate)} – ${formatDate(sprint.endDate)}`}
              />
              <DetailRow
                label="Project"
                value={
                  <Link
                    href={`/projects/${sprint.project.id}`}
                    className="hover:text-primary underline-offset-4 hover:underline"
                  >
                    {sprint.project.name}
                  </Link>
                }
              />
              <DetailRow label="Tasks" value={sprint._count.tasks} />
              <Separator />
              <DetailRow label="Created" value={formatDate(sprint.createdAt)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <SprintAnalytics stats={stats} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
