import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CompletionDonutProps {
  percent: number;
  completed: number;
  open: number;
  total: number;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CompletionDonut({ percent, completed, open, total }: CompletionDonutProps) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Completion</CardTitle>
        <CardDescription>Share of tasks that are done</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-5">
        <div className="relative size-28 shrink-0">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              strokeWidth="10"
              className="stroke-muted"
            />
            <circle
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              className="stroke-primary transition-all duration-500"
              strokeDasharray={`${(clamped / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold tabular-nums">{clamped}%</span>
            <span className="text-muted-foreground text-[10px] tracking-wide uppercase">done</span>
          </div>
        </div>
        <dl className="grid min-w-0 gap-2 text-sm">
          <div className="flex items-center gap-3">
            <dt className="text-muted-foreground">Completed</dt>
            <dd className="font-medium tabular-nums">{completed}</dd>
          </div>
          <div className="flex items-center gap-3">
            <dt className="text-muted-foreground">Open</dt>
            <dd className="font-medium tabular-nums">{open}</dd>
          </div>
          <div className="flex items-center gap-3">
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-medium tabular-nums">{total}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
