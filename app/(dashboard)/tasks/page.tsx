import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ListTodo, Plus } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { TaskFilters } from '@/components/tasks/task-filters';
import { TaskListItem } from '@/components/tasks/task-list-item';
import { Button } from '@/components/ui/button';
import { getSessionUser } from '@/lib/auth/session';
import { taskPriorities, taskSorts, taskStatuses, taskTypes, technicalAreas } from '@/lib/validations/task';
import { listProjects } from '@/services/projects';
import { listSprints } from '@/services/sprints';
import { listTasks } from '@/services/tasks';

export const metadata: Metadata = { title: 'Tasks' };

export const instant = false;

interface TasksPageProps {
  searchParams: Promise<{
    projectId?: string;
    sprintId?: string;
    status?: string;
    priority?: string;
    type?: string;
    technicalArea?: string;
    sort?: string;
    q?: string;
  }>;
}

function oneOf(values: readonly string[], value?: string): string | undefined {
  return value && values.includes(value) ? value : undefined;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const filters = await searchParams;
  const projectId = filters.projectId?.trim() || undefined;
  const sprintId = filters.sprintId?.trim() || undefined;
  const status = oneOf(taskStatuses, filters.status?.trim());
  const priority = oneOf(taskPriorities, filters.priority?.trim());
  const type = oneOf(taskTypes, filters.type?.trim());
  const technicalArea = oneOf(technicalAreas, filters.technicalArea?.trim());
  const sort = oneOf(taskSorts, filters.sort?.trim());
  const q = filters.q?.trim() || undefined;

  const [tasks, projects, sprints] = await Promise.all([
    listTasks(user.id, { projectId, sprintId, status, priority, type, technicalArea, sort, q }),
    listProjects(user.id),
    listSprints(user.id),
  ]);

  const hasFilters = !!(projectId || sprintId || status || priority || type || technicalArea || q);

  return (
    <>
      <PageHeader title="Tasks" description="Track development work across your projects.">
        <Button asChild>
          <Link href="/tasks/new">
            <Plus />
            New task
          </Link>
        </Button>
      </PageHeader>

      <TaskFilters
        projects={projects.map((project) => ({ id: project.id, name: project.name }))}
        sprints={sprints.map((sprint) => ({ id: sprint.id, name: sprint.name }))}
        initial={{ projectId, sprintId, status, priority, type, technicalArea, sort, q }}
        showSort
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={<ListTodo />}
          title={hasFilters ? 'No tasks match your filters' : 'No tasks yet'}
          description={
            hasFilters
              ? 'Try adjusting or clearing the filters.'
              : 'Create your first task to start tracking development work.'
          }
        >
          {hasFilters ? (
            <Button variant="outline" asChild>
              <Link href="/tasks">Clear filters</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/tasks/new">
                <Plus />
                New task
              </Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-3">
          {tasks.map((task) => (
            <TaskListItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </>
  );
}
