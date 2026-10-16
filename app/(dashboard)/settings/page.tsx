import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import { LOADING_STYLE_COOKIE, parseLoadingStyle } from '@/components/loading/loading-style';
import { SettingsTabs, type SettingsTab } from '@/components/settings/settings-tabs';
import { getSessionUser } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Settings' };

export const instant = false;

interface SettingsPageProps {
  searchParams?: Promise<{ tab?: string | string[] }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  await connection();
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  const resolved = await searchParams;
  const raw = resolved?.tab;
  const requested = Array.isArray(raw) ? raw[0] : raw;
  const defaultTab: SettingsTab = requested === 'appearance' ? 'appearance' : 'account';

  const cookieStore = await cookies();
  const loadingStyle = parseLoadingStyle(cookieStore.get(LOADING_STYLE_COOKIE)?.value);

  return (
    <>
      <PageHeader title="Settings" description="Manage your account and application preferences." />
      <SettingsTabs
        defaultTab={defaultTab}
        profileInitial={{ name: user.name ?? '', email: user.email, image: user.image ?? null }}
        loadingStyle={loadingStyle}
      />
    </>
  );
}
