'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ListOrdered, Scale, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from 'cn';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type AiToneOption = 'CONCISE' | 'BALANCED' | 'DETAILED';

const options: Array<{
  value: AiToneOption;
  label: string;
  description: string;
  icon: typeof Scale;
}> = [
  {
    value: 'CONCISE',
    label: 'Concise',
    description: 'Short answers, no filler',
    icon: ListOrdered,
  },
  {
    value: 'BALANCED',
    label: 'Balanced',
    description: 'Structure when it helps',
    icon: Scale,
  },
  {
    value: 'DETAILED',
    label: 'Detailed',
    description: 'Reasoning and examples',
    icon: Sparkles,
  },
];

export function AIPreferencesForm({ initial }: { initial: { name: string; tone: AiToneOption } }) {
  const router = useRouter();
  const [tone, setTone] = useState<AiToneOption>(initial.tone);
  const [isPending, startTransition] = useTransition();

  function choose(next: AiToneOption) {
    if (next === tone || isPending) return;
    const previous = tone;
    setTone(next);
    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: initial.name, aiTone: next }),
        });
        if (!response.ok) throw new Error();
        toast.success(`AI style set to ${next.toLowerCase()}`);
        router.refresh();
      } catch {
        toast.error('Could not save AI preference');
        setTone(previous);
      }
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>AI response style</CardTitle>
        <CardDescription>
          Applies to AI chat and task actions like breakdowns, plans, and reviews.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="AI response style">
          {options.map(({ value, label, description, icon: Icon }) => {
            const selected = value === tone;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={isPending}
                onClick={() => choose(value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors disabled:opacity-60',
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
