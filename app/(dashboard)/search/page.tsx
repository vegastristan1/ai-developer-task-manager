import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SearchX } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { SearchBox } from '@/components/search/search-box';
import { TaskPriorityBadge } from '@/components/tasks/task-priority-badge';
import { TaskStatusBadge } from '@/components/tasks/task-status-badge';
import { ProjectStatusBadge } from '@/components/projects/status-badge';
import { getSessionUser } from '@/lib/auth/session';
import {
  taskPriorities,
  taskStatuses,
  taskTypes,
  technicalAreas,
  taskTypeLabels,
} from '@/lib/validations/task';
import { listProjects } from '@/services/projects';
import { listSprints } from '@/services/sprints';
import { searchAll } from '@/services/search';

export const metadata: Metadata = { title: 'Search' };

export const instant = false;

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    type?: string;
    technicalArea?: string;
    projectId?: string;
    sprintId?: string;
  }>;
}

function oneOf<T extends string>(values: readonly T[], value?: string): T | undefined {
  return value && (values as readonly string[]).includes(value) ? (value as T) : undefined;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const filters = await searchParams;
  const q = filters.q?.trim() || undefined;
  const status = oneOf(taskStatuses, filters.status?.trim());
  const priority = oneOf(taskPriorities, filters.priority?.trim());
  const type = oneOf(taskTypes, filters.type?.trim());
  const technicalArea = oneOf(technicalAreas, filters.technicalArea?.trim());
  const projectId = filters.projectId?.trim() || undefined;
  const sprintId = filters.sprintId?.trim() || undefined;

  const [projects, sprints, results] = await Promise.all([
    listProjects(user.id),
    listSprints(user.id),
    q
      ? searchAll(user.id, { q, status, priority, type, technicalArea, projectId, sprintId })
      : Promise.resolve(null),
  ]);

  const noResults =
    results && results.counts.projects === 0 && results.counts.tasks === 0 && results.counts.labels === 0;

  return (
    <>
      <PageHeader title="Search" description="Search across projects, tasks, labels, and descriptions." />

      <SearchBox
        initial={{ q, status, priority, type, technicalArea, projectId, sprintId }}
        projects={projects.map((project) => ({ id: project.id, name: project.name }))}
        sprints={sprints.map((sprint) => ({ id: sprint.id, name: sprint.name }))}
      />

      {!results ? (
        <EmptyState
          icon={<SearchX />}
          title="Search everything"
          description="Find tasks, projects, and labels by name or description, then narrow results with filters."
        />
      ) : noResults ? (
        <EmptyState
          icon={<SearchX />}
          title={`No results for “${q}”`}
          description="Try a different term or clear some filters."
        />
      ) : (
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">
              Tasks <span className="text-muted-foreground">({results.counts.tasks})</span>
            </h2>
            {results.tasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">No matching tasks.</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {results.tasks.map((task) => (
                  <li key={task.id}>
                    <Link
                      href={`/tasks/${task.id}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{task.title}</span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {task.project.name} · {taskTypeLabels[task.type]}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <TaskPriorityBadge priority={task.priority} />
                        <TaskStatusBadge status={task.status} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">
              Projects <span className="text-muted-foreground">({results.counts.projects})</span>
            </h2>
            {results.projects.length === 0 ? (
              <p className="text-muted-foreground text-sm">No matching projects.</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {results.projects.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/projects/${project.id}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{project.name}</span>
                        <span className="text-muted-foreground block truncate text-xs">
                          {project.description ?? 'No description'} · {project.taskCount} tasks
                        </span>
                      </span>
                      <ProjectStatusBadge status={project.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">
              Labels <span className="text-muted-foreground">({results.counts.labels})</span>
            </h2>
            {results.labels.length === 0 ? (
              <p className="text-muted-foreground text-sm">No matching labels.</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {results.labels.map((label) => (
                  <li key={label.id}>
                    <Link
                      href={`/tasks?q=${encodeURIComponent(label.name)}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted/50"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className="size-3 shrink-0 rounded-full"
                          style={{ backgroundColor: label.color }}
                          aria-hidden
                        />
                        <span className="truncate text-sm font-medium">{label.name}</span>
                      </span>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {label.project.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}
