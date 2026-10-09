import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from 'cn';

interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
  className?: string;
}

export function MetricCard({ label, value, hint, icon, className }: MetricCardProps) {
  return (
    <Card className={cn('min-w-0', className)}>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          {hint && <p className="text-muted-foreground mt-0.5 truncate text-xs">{hint}</p>}
        </div>
        <span className="text-muted-foreground/70 shrink-0 [&>svg]:size-5" aria-hidden>
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}
