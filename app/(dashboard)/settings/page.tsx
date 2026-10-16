import type { Metadata } from 'next';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import { ProfileForm } from '@/components/settings/profile-form';
import { getSessionUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Settings' };

export const instant = false;

export default async function SettingsPage() {
  await connection();
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
