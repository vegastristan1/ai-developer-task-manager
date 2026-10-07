import type { Metadata } from 'next';
import { Settings } from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Manage your account and application preferences." />
      <EmptyState
        icon={<Settings />}
        title="Settings are coming soon"
        description="The settings page is planned as part of Phase 4 — Projects."
      />
    </>
  );
}
