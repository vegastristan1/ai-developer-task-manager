'use client';

import * as React from 'react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from 'cn';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const options = [
  { value: 'light', label: 'Light', description: 'Bright interface', icon: Sun },
  { value: 'dark', label: 'Dark', description: 'Dim interface', icon: Moon },
  { value: 'system', label: 'System', description: 'Follow your device', icon: Monitor },
] as const;

function useMounted() {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function AppearanceForm() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const current = mounted ? (theme ?? 'system') : 'system';

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>Choose how the app looks on this device.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Theme">
          {options.map(({ value, label, description, icon: Icon }) => {
            const selected = current === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTheme(value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors',
                  selected
                    ? 'border-primary bg-muted'
                    : 'hover:bg-muted/50 hover:border-muted-foreground/40',
                )}
              >
                <Icon className="size-5" aria-hidden />
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {selected && <Check className="size-3.5" aria-hidden />}
                  {label}
                </span>
                <span className="text-muted-foreground text-center text-xs">{description}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
