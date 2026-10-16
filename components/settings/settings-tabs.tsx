'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Palette, Sparkles, UserRound } from 'lucide-react';
import { cn } from 'cn';
import type { LoadingStyle } from '@/components/loading/loading-style';
import { LoadingStyleForm } from '@/components/settings/loading-style-form';
import { AIPreferencesForm, type AiToneOption } from '@/components/settings/ai-preferences-form';
import { AppearanceForm } from '@/components/settings/appearance-form';
import { DangerZoneForm } from '@/components/settings/danger-zone-form';
import { ExportDataForm } from '@/components/settings/export-data-form';
import { ImportDataForm } from '@/components/settings/import-data-form';
import { PasswordForm } from '@/components/settings/password-form';
import { SessionsForm } from '@/components/settings/sessions-form';
import { ProfileForm } from '@/components/settings/profile-form';

export type SettingsTab = 'account' | 'appearance' | 'ai';

const tabs: Array<{
  value: SettingsTab;
  label: string;
  description: string;
  icon: typeof UserRound;
}> = [
  { value: 'account', label: 'Account', description: 'Profile, password, data', icon: UserRound },
  {
    value: 'appearance',
    label: 'Appearance',
    description: 'Theme and loading style',
    icon: Palette,
  },
  { value: 'ai', label: 'AI', description: 'Response style', icon: Sparkles },
];

interface SettingsTabsProps {
  defaultTab: SettingsTab;
  profileInitial: { name: string; email: string; image: string | null };
  aiInitial: { name: string; tone: AiToneOption };
  loadingStyle: LoadingStyle;
}

export function SettingsTabs({
  defaultTab,
  profileInitial,
  aiInitial,
  loadingStyle,
}: SettingsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<SettingsTab>(defaultTab);

  function choose(next: SettingsTab) {
    if (next === tab) return;
    setTab(next);
    router.replace(next === 'account' ? pathname : `${pathname}?tab=${next}`, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label="Settings sections"
        className="grid max-w-2xl gap-2 sm:grid-cols-3"
      >
        {tabs.map(({ value, label, description, icon: Icon }) => {
          const selected = value === tab;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`settings-panel-${value}`}
              id={`settings-tab-${value}`}
              onClick={() => choose(value)}
              className={cn(
                'flex items-center gap-3 rounded-xl border p-4 text-left transition-colors',
                selected
                  ? 'border-primary bg-muted'
                  : 'hover:bg-muted/50 hover:border-muted-foreground/40',
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <span>
                <span className="block text-sm font-medium">{label}</span>
                <span className="text-muted-foreground block text-xs">{description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`settings-panel-${tab}`}
        aria-labelledby={`settings-tab-${tab}`}
        className="flex flex-col gap-6"
      >
        {tab === 'account' ? (
          <>
            <ProfileForm initial={profileInitial} />
            <PasswordForm />
            <SessionsForm />
            <ExportDataForm email={profileInitial.email} />
            <ImportDataForm />
            <DangerZoneForm email={profileInitial.email} />
          </>
        ) : tab === 'appearance' ? (
          <>
            <AppearanceForm />
            <LoadingStyleForm initial={loadingStyle} />
          </>
        ) : (
          <AIPreferencesForm initial={aiInitial} />
        )}
      </div>
    </div>
  );
}
