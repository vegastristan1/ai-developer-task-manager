import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import { ProfileForm } from '@/components/settings/profile-form';
import { getSessionUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Settings' };

export const instant = false;

export default async function SettingsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <>
      <PageHeader title="Settings" description="Manage your account and application preferences." />
      <ProfileForm initial={{ name: user.name ?? '', email: user.email }} />
    </>
  );
}
