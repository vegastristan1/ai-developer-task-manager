import type { Metadata } from 'next';
import { Gauge } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="An overview of your development activity." />
      <EmptyState
        icon={<Gauge />}
        title="Dashboard analytics are coming soon"
        description="Metrics, task charts, sprint progress, and blocked task analysis arrive in Phase 11 — Dashboard."
      />
    </>
  );
}
