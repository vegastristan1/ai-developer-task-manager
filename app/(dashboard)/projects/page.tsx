import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FolderKanban, Plus } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectFilters } from '@/components/projects/project-filters';
import { Button } from '@/components/ui/button';
import { getSessionUser } from '@/lib/auth/session';
import { projectStatuses, type ProjectStatusValue } from '@/lib/validations/project';
import { listProjects } from '@/services/projects';

export const metadata: Metadata = { title: 'Projects' };

export const instant = false;

interface ProjectsPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  const filters = await searchParams;
  const q = filters.q?.trim() || undefined;
  const statusRaw = filters.status?.trim();
  const status = statusRaw && (projectStatuses as readonly string[]).includes(statusRaw)
    ? (statusRaw as ProjectStatusValue)
    : undefined;
  const hasFilters = !!(q || status);

  const projects = await listProjects(user.id, { q, status });

  return (
    <>
      <PageHeader title="Projects" description="Create and manage your software projects.">
        <Button asChild>
          <Link href="/projects/new">
            <Plus />
            New project
          </Link>
        </Button>
      </PageHeader>

      <ProjectFilters initial={{ q, status }} />

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban />}
          title={hasFilters ? 'No projects match your filters' : 'No projects yet'}
          description={
            hasFilters
              ? 'Try adjusting or clearing the filters.'
              : 'Create your first project to start organising tasks, sprints, and labels.'
          }
        >
          {hasFilters ? (
            <Button variant="outline" asChild>
              <Link href="/projects">Clear filters</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/projects/new">
                <Plus />
                New project
              </Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </>
  );
}
