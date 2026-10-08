import Link from 'next/link';
import { SprintStatusBadge } from '@/components/sprints/sprint-status-badge';
import { Progress } from '@/components/ui/progress';
import { formatDate } from '@/lib/utils';
import type { SprintListEntry } from '@/services/sprints';

interface SprintCardProps {
  sprint: SprintListEntry;
}

export function SprintCard({ sprint }: SprintCardProps) {
  return (
    <Link
      href={`/sprints/${sprint.id}`}
      className="hover:bg-muted/50 block rounded-lg border p-4 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="grid gap-1">
          <span className="text-sm font-semibold">{sprint.name}</span>
          <span className="text-muted-foreground text-xs">{sprint.project.name}</span>
        </div>
        <SprintStatusBadge startDate={sprint.startDate} endDate={sprint.endDate} />
      </div>

      {sprint.goal && (
        <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">{sprint.goal}</p>
      )}

      <p className="text-muted-foreground mt-3 text-xs">
        {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
      </p>

      <div className="mt-3 grid gap-1.5">
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>
            {sprint.stats.completed}/{sprint.stats.total} completed
          </span>
          <span className="tabular-nums">
            {sprint.stats.total === 0
              ? 0
              : Math.round((sprint.stats.completed / sprint.stats.total) * 100)}
            %
          </span>
        </div>
        <Progress
          value={sprint.stats.completed}
          max={Math.max(sprint.stats.total, 1)}
          aria-label={`${sprint.name} progress`}
        />
      </div>
    </Link>
  );
}
