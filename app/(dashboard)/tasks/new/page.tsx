import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FolderKanban, Plus } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { TaskForm } from '@/components/tasks/task-form';
import { Button } from '@/components/ui/button';
import { getSessionUser } from '@/lib/auth/session';
import { listProjects } from '@/services/projects';

export const metadata: Metadata = { title: 'New task' };

export const instant = false;

export default async function NewTaskPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const projects = await listProjects(user.id);

  return (
    <>
      <PageHeader title="New task" description="Add work to one of your projects." />

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban />}
          title="Create a project first"
          description="Tasks belong to projects, so create a project before adding tasks."
        >
          <Button asChild>
            <Link href="/projects/new">
              <Plus />
              New project
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <TaskForm
          mode="create"
          projects={projects.map((project) => ({ id: project.id, name: project.name }))}
        />
      )}
    </>
  );
}
