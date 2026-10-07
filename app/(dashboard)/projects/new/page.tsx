import type { Metadata } from 'next';
import { PageHeader } from '@/components/common/page-header';
import { ProjectForm } from '@/components/projects/project-form';

export const metadata: Metadata = { title: 'New project' };

export default function NewProjectPage() {
  return (
    <>
      <PageHeader
        title="New project"
        description="Set up a project and add it to your workspace."
      />
      <ProjectForm mode="create" />
    </>
  );
}
