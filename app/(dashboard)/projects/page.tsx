import type { Metadata } from 'next';
import { FolderKanban } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';

export const metadata: Metadata = { title: 'Projects' };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader title="Projects" description="Create and manage your software projects." />
      <EmptyState
        icon={<FolderKanban />}
        title="No projects yet"
        description="Project creation, editing, and details arrive in Phase 4 — Projects."
      />
    </>
  );
}
