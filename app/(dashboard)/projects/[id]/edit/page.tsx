import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import { ProjectForm } from '@/components/projects/project-form';
import { getSessionUser } from '@/lib/auth/session';
import { getProject } from '@/services/projects';

export const metadata: Metadata = { title: 'Edit project' };

export const instant = false;

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  const { id } = await params;
  const project = await getProject(id, user.id);

  if (!project) {
    notFound();
  }

  return (
    <>
      <PageHeader title="Edit project" description={`Update ${project.name}.`} />
      <ProjectForm
        mode="edit"
        initial={{
          id: project.id,
          name: project.name,
          description: project.description,
          repositoryUrl: project.repositoryUrl,
          technologyStack: project.technologyStack,
          status: project.status,
        }}
      />
    </>
  );
}
