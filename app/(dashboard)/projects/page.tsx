import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FolderKanban, Plus } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { ProjectCard } from '@/components/projects/project-card';
import { Button } from '@/components/ui/button';
import { getSessionUser } from '@/lib/auth/session';
import { listProjects } from '@/services/projects';

export const metadata: Metadata = { title: 'Projects' };

export const instant = false;

export default async function ProjectsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  const projects = await listProjects(user.id);

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

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban />}
          title="No projects yet"
          description="Create your first project to start organising tasks, sprints, and labels."
        >
          <Button asChild>
            <Link href="/projects/new">
              <Plus />
              New project
            </Link>
          </Button>
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
