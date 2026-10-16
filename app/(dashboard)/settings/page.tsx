import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import { LOADING_STYLE_COOKIE, parseLoadingStyle } from '@/components/loading/loading-style';
import { LoadingStyleForm } from '@/components/settings/loading-style-form';
import { PasswordForm } from '@/components/settings/password-form';
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

  const cookieStore = await cookies();
  const loadingStyle = parseLoadingStyle(cookieStore.get(LOADING_STYLE_COOKIE)?.value);

  return (
    <>
      <PageHeader title="Settings" description="Manage your account and application preferences." />
      <div className="flex flex-col gap-6">
        <ProfileForm initial={{ name: user.name ?? '', email: user.email }} />
        <PasswordForm />
        <LoadingStyleForm initial={loadingStyle} />
      </div>
    </>
  );
}
