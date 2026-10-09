import { CalendarRange } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/lib/utils';
import type { DashboardSprintStat } from '@/services/dashboard';

export function SprintProgressCard({ sprint }: { sprint: DashboardSprintStat | null }) {
  if (!sprint) {
    return (
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Current sprint</CardTitle>
          <CardDescription>Sprint progress for work in flight</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No active sprint right now. Create a sprint with dates spanning today to see progress
            here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const cells = [
    { label: 'Completed', value: sprint.completed },
    { label: 'Remaining', value: sprint.remaining },
    { label: 'Blocked', value: sprint.blocked },
    { label: 'Total', value: sprint.total },
  ];

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Current sprint</CardTitle>
        <CardDescription className="truncate">
          {sprint.name} · {sprint.projectName}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground inline-flex min-w-0 items-center gap-1.5 truncate">
            <CalendarRange className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
            </span>
          </span>
          <span className="shrink-0 font-semibold tabular-nums">{sprint.progressPercent}%</span>
        </div>
        <Progress value={sprint.progressPercent} />
        <dl className="grid grid-cols-4 gap-2 text-center">
          {cells.map((cell) => (
            <div key={cell.label} className="bg-muted/50 rounded-lg py-2">
              <dd className="text-base font-semibold tabular-nums">{cell.value}</dd>
              <dt className="text-muted-foreground text-xs">{cell.label}</dt>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
