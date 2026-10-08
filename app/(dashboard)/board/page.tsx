import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Columns3, Plus } from 'lucide-react';
import { Board } from '@/components/board/board';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { TaskFilters } from '@/components/tasks/task-filters';
import { Button } from '@/components/ui/button';
import { getSessionUser } from '@/lib/auth/session';
import { taskPriorities, taskSorts, taskTypes } from '@/lib/validations/task';
import { listProjects } from '@/services/projects';
import { listTasks } from '@/services/tasks';

export const metadata: Metadata = { title: 'Board' };

export const instant = false;

interface BoardPageProps {
  searchParams: Promise<{
    projectId?: string;
    priority?: string;
    type?: string;
    sort?: string;
    q?: string;
  }>;
}

function oneOf(values: readonly string[], value?: string): string | undefined {
  return value && values.includes(value) ? value : undefined;
}

export default async function BoardPage({ searchParams }: BoardPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const filters = await searchParams;
  const projectId = filters.projectId?.trim() || undefined;
  const priority = oneOf(taskPriorities, filters.priority?.trim());
  const type = oneOf(taskTypes, filters.type?.trim());
  const sort = oneOf(taskSorts, filters.sort?.trim()) ?? 'position';
  const q = filters.q?.trim() || undefined;

  const [tasks, projects] = await Promise.all([
    listTasks(user.id, { projectId, priority, type, sort, q }),
    listProjects(user.id),
  ]);

  const hasFilters = !!(projectId || priority || type || q);

  return (
    <>
      <PageHeader title="Board" description="Drag tasks across columns to update their status.">
        <Button asChild>
          <Link href="/tasks/new">
            <Plus />
            New task
          </Link>
        </Button>
      </PageHeader>

      <TaskFilters
        projects={projects.map((project) => ({ id: project.id, name: project.name }))}
        initial={{ projectId, priority, type, sort, q }}
        basePath="/board"
        showStatus={false}
        showSort
        defaultSort="position"
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={<Columns3 />}
          title={hasFilters ? 'No tasks match your filters' : 'No tasks yet'}
          description={
            hasFilters
              ? 'Try adjusting or clearing the filters.'
              : 'Create your first task to see it on the board.'
          }
        >
          {hasFilters ? (
            <Button variant="outline" asChild>
              <Link href="/board">Clear filters</Link>
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
        <Board tasks={tasks} sort={sort} />
      )}
    </>
  );
}
