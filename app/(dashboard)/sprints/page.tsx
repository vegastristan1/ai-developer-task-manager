import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, Timer } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { SprintCard } from '@/components/sprints/sprint-card';
import { SprintFilters } from '@/components/sprints/sprint-filters';
import { Button } from '@/components/ui/button';
import { getSessionUser } from '@/lib/auth/session';
import { listProjects } from '@/services/projects';
import { listSprints } from '@/services/sprints';

export const metadata: Metadata = { title: 'Sprints' };

export const instant = false;

interface SprintsPageProps {
  searchParams: Promise<{
    projectId?: string;
  }>;
}

export default async function SprintsPage({ searchParams }: SprintsPageProps) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const filters = await searchParams;
  const projectId = filters.projectId?.trim() || undefined;

  const [sprints, projects] = await Promise.all([
    listSprints(user.id, { projectId }),
    listProjects(user.id),
  ]);

  return (
    <>
      <PageHeader title="Sprints" description="Plan and track development sprints.">
        <Button asChild>
          <Link href="/sprints/new">
            <Plus />
            New sprint
          </Link>
        </Button>
      </PageHeader>

      <SprintFilters
        projects={projects.map((project) => ({ id: project.id, name: project.name }))}
        projectId={projectId}
      />

      {sprints.length === 0 ? (
        <EmptyState
          icon={<Timer />}
          title={projectId ? 'No sprints match this filter' : 'No sprints yet'}
          description={
            projectId
              ? 'Try a different project or clear the filter.'
              : 'Create your first sprint to start planning work in timeboxes.'
          }
        >
          {projectId ? (
            <Button variant="outline" asChild>
              <Link href="/sprints">Clear filter</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/sprints/new">
                <Plus />
                New sprint
              </Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sprints.map((sprint) => (
            <SprintCard key={sprint.id} sprint={sprint} />
          ))}
        </div>
      )}
    </>
  );
}
