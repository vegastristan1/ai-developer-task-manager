'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from 'cn';
import { setLoadingStyle } from '@/app/(dashboard)/settings/actions';
import { TvLoader } from '@/components/loading/tv-loader';
import {
  LOADING_STYLES,
  LOADING_STYLE_META,
  type LoadingStyle,
} from '@/components/loading/loading-style';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function LoadingStyleForm({ initial }: { initial: LoadingStyle }) {
  const router = useRouter();
  const [style, setStyle] = useState<LoadingStyle>(initial);
  const [isPending, startTransition] = useTransition();

  function choose(next: LoadingStyle) {
    if (next === style || isPending) return;
    setStyle(next);
    startTransition(async () => {
      try {
        await setLoadingStyle(next);
        toast.success(`Loading style set to ${LOADING_STYLE_META[next].label}`);
        router.refresh();
      } catch {
        toast.error('Could not save loading style');
        setStyle(initial);
      }
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Loading style</CardTitle>
        <CardDescription>
          Choose the loading look for dashboard pages. It is remembered in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Loading style">
          {LOADING_STYLES.map((option) => {
            const selected = option === style;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={isPending}
                onClick={() => choose(option)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors disabled:opacity-60',
                  selected
                    ? 'border-primary bg-muted'
                    : 'hover:bg-muted/50 hover:border-muted-foreground/40',
                )}
              >
                <TvLoader size="sm" />
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {selected && <Check className="size-3.5" aria-hidden />}
                  {LOADING_STYLE_META[option].label}
                </span>
                <span className="text-muted-foreground text-center text-xs">
                  {LOADING_STYLE_META[option].description}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
