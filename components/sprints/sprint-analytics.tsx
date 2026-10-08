import {
  taskPriorityLabels,
  taskPriorities,
  taskTypeLabels,
  taskTypes,
} from '@/lib/validations/task';
import type { SprintStats } from '@/services/sprints';

function Breakdown({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const visible = rows.filter((row) => row.count > 0);
  const max = Math.max(...visible.map((row) => row.count), 1);

  return (
    <div className="grid gap-2.5">
      <span className="text-sm font-medium">{title}</span>
      {visible.length === 0 ? (
        <p className="text-muted-foreground text-xs">No tasks yet</p>
      ) : (
        visible.map((row) => (
          <div key={row.label} className="grid gap-1">
            <div className="flex items-center justify-between text-xs">
              <span>{row.label}</span>
              <span className="text-muted-foreground tabular-nums">{row.count}</span>
            </div>
            <div className="bg-muted h-1.5 rounded-full">
              <div
                className="bg-primary h-1.5 rounded-full"
                style={{ width: `${(row.count / max) * 100}%` }}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export function SprintAnalytics({ stats }: { stats: SprintStats }) {
  return (
    <div className="grid gap-5">
      <Breakdown
        title="By priority"
        rows={taskPriorities.map((priority) => ({
          label: taskPriorityLabels[priority],
          count: stats.byPriority[priority],
        }))}
      />
      <Breakdown
        title="By type"
        rows={taskTypes.map((type) => ({
          label: taskTypeLabels[type],
          count: stats.byType[type],
        }))}
      />
    </div>
  );
}
