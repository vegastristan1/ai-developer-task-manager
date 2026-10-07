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
import { taskPriorities, taskStatuses, taskTypes } from '@/lib/validations/task';
import { listProjects } from '@/services/projects';
import { listTasks } from '@/services/tasks';

export const metadata: Metadata = { title: 'Tasks' };

export const instant = false;

interface TasksPageProps {
  searchParams: Promise<{
    projectId?: string;
    status?: string;
    priority?: string;
    type?: string;
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
  const status = oneOf(taskStatuses, filters.status?.trim());
  const priority = oneOf(taskPriorities, filters.priority?.trim());
  const type = oneOf(taskTypes, filters.type?.trim());
  const q = filters.q?.trim() || undefined;

  const [tasks, projects] = await Promise.all([
    listTasks(user.id, { projectId, status, priority, type, q }),
    listProjects(user.id),
  ]);

  const hasFilters = !!(projectId || status || priority || type || q);

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
        initial={{ projectId, status, priority, q }}
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
