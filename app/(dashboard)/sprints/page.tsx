import type { Metadata } from 'next';
import { Timer } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';

export const metadata: Metadata = { title: 'Sprints' };

export default function SprintsPage() {
  return (
    <>
      <PageHeader title="Sprints" description="Plan and track development sprints." />
      <EmptyState
        icon={<Timer />}
        title="No sprints yet"
        description="Sprint creation, progress tracking, and analytics arrive in Phase 7 — Sprints."
      />
    </>
  );
}
