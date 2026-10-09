import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FolderKanban, Plus } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { SprintForm } from '@/components/sprints/sprint-form';
import { Button } from '@/components/ui/button';
import { getSessionUser } from '@/lib/auth/session';
import { listProjects } from '@/services/projects';

export const metadata: Metadata = { title: 'New sprint' };

export const instant = false;

export default async function NewSprintPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const projects = await listProjects(user.id);

  return (
    <>
      <PageHeader title="New sprint" description="Define a timebox with a goal for your project." />
      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban />}
          title="Create a project first"
          description="Sprints belong to a project — add one before planning a sprint."
        >
          <Button asChild>
            <Link href="/projects/new">
              <Plus />
              New project
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <SprintForm
          mode="create"
          projects={projects.map((project) => ({ id: project.id, name: project.name }))}
        />
      )}
    </>
  );
}
