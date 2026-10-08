import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import type { SprintStats } from '@/services/sprints';

interface SprintProgressProps {
  stats: SprintStats;
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-muted/40 rounded-lg border p-3">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

export function SprintProgress({ stats }: SprintProgressProps) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Sprint progress</span>
          <span className="text-muted-foreground tabular-nums">{stats.progressPercent}%</span>
        </div>
        <Progress
          value={stats.completed}
          max={Math.max(stats.total, 1)}
          aria-label="Sprint progress"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Completed" value={stats.completed} />
        <Tile label="Remaining" value={stats.remaining} />
        <Tile label="Blocked" value={stats.blocked} />
        <Tile label="Total" value={stats.total} />
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span>{stats.todo} to do</span>
        <Separator orientation="vertical" className="h-3" />
        <span>{stats.inProgress} in progress</span>
        <Separator orientation="vertical" className="h-3" />
        <span>{stats.inReview} in review</span>
        <Separator orientation="vertical" className="h-3" />
        <span className={stats.overdue > 0 ? 'font-medium text-red-500' : undefined}>
          {stats.overdue} overdue
        </span>
      </div>
    </div>
  );
}
