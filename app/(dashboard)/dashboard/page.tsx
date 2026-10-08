import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  AlertTriangle,
  CalendarClock,
  CircleCheck,
  FolderKanban,
  Gauge,
  ListTodo,
} from 'lucide-react';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { BlockedTasksCard } from '@/components/dashboard/blocked-tasks-card';
import { CompletionDonut } from '@/components/dashboard/completion-donut';
import { DistributionCard, type DistributionDatum } from '@/components/dashboard/distribution-card';
import { MetricCard } from '@/components/dashboard/metric-card';
import { ProjectStatsCard } from '@/components/dashboard/project-stats-card';
import { RecentTasksCard } from '@/components/dashboard/recent-tasks-card';
import { SprintProgressCard } from '@/components/dashboard/sprint-progress-card';
import { Button } from '@/components/ui/button';
import { getSessionUser } from '@/lib/auth/session';
import {
  taskPriorityLabels,
  taskStatusLabels,
  taskTypeLabels,
  technicalAreaLabels,
  type TaskPriorityValue,
  type TaskStatusValue,
  type TaskTypeValue,
  type TechnicalAreaValue,
} from '@/lib/validations/task';
import { getDashboardStats } from '@/services/dashboard';

export const metadata: Metadata = { title: 'Dashboard' };

export const instant = false;

const statusColors: Record<TaskStatusValue, string> = {
  TODO: 'bg-slate-400 dark:bg-slate-500',
  IN_PROGRESS: 'bg-blue-500 dark:bg-blue-400',
  IN_REVIEW: 'bg-violet-500 dark:bg-violet-400',
  BLOCKED: 'bg-red-500 dark:bg-red-400',
  DONE: 'bg-emerald-500 dark:bg-emerald-400',
};

const priorityColors: Record<TaskPriorityValue, string> = {
  LOW: 'bg-slate-400 dark:bg-slate-500',
  MEDIUM: 'bg-sky-500 dark:bg-sky-400',
  HIGH: 'bg-amber-500 dark:bg-amber-400',
  CRITICAL: 'bg-red-500 dark:bg-red-400',
};

const typeColors: Record<TaskTypeValue, string> = {
  FEATURE: 'bg-indigo-500 dark:bg-indigo-400',
  BUG: 'bg-rose-500 dark:bg-rose-400',
  REFACTOR: 'bg-violet-500 dark:bg-violet-400',
  DOCUMENTATION: 'bg-cyan-500 dark:bg-cyan-400',
  TESTING: 'bg-teal-500 dark:bg-teal-400',
  DEVOPS: 'bg-orange-500 dark:bg-orange-400',
};

const areaColors: Record<TechnicalAreaValue | 'NONE', string> = {
  FRONTEND: 'bg-indigo-500 dark:bg-indigo-400',
  BACKEND: 'bg-sky-500 dark:bg-sky-400',
  DATABASE: 'bg-emerald-500 dark:bg-emerald-400',
  API: 'bg-violet-500 dark:bg-violet-400',
  DEVOPS: 'bg-orange-500 dark:bg-orange-400',
  TESTING: 'bg-teal-500 dark:bg-teal-400',
  AI: 'bg-fuchsia-500 dark:bg-fuchsia-400',
  NONE: 'bg-slate-400 dark:bg-slate-500',
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const stats = await getDashboardStats(user.id);
  const { totals } = stats;
  const isEmpty = totals.projects === 0 && totals.tasks === 0;

  const statusData: DistributionDatum[] = stats.byStatus.map(({ key, count }) => ({
    label: taskStatusLabels[key],
    count,
    barClassName: statusColors[key],
  }));
  const priorityData: DistributionDatum[] = stats.byPriority.map(({ key, count }) => ({
    label: taskPriorityLabels[key],
    count,
    barClassName: priorityColors[key],
  }));
  const typeData: DistributionDatum[] = stats.byType.map(({ key, count }) => ({
    label: taskTypeLabels[key],
    count,
    barClassName: typeColors[key],
  }));
  const areaData: DistributionDatum[] = stats.byTechnicalArea.map(({ key, count }) => ({
    label: key === 'NONE' ? 'Unset' : technicalAreaLabels[key],
    count,
    barClassName: areaColors[key],
  }));

  return (
    <>
      <PageHeader title="Dashboard" description="An overview of your development activity." />

      {isEmpty ? (
        <EmptyState
          icon={<Gauge />}
          title="No data to show yet"
          description="Create a project and add tasks to see metrics, charts, and sprint progress here."
        >
          <Button asChild>
            <Link href="/projects/new">New project</Link>
          </Button>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <MetricCard label="Projects" value={totals.projects} icon={<FolderKanban />} />
            <MetricCard
              label="Open tasks"
              value={totals.open}
              hint="Not done yet"
              icon={<ListTodo />}
            />
            <MetricCard
              label="Completed"
              value={totals.completed}
              hint="Done tasks"
              icon={<CircleCheck />}
            />
            <MetricCard
              label="Blocked"
              value={totals.blocked}
              hint={totals.blocked > 0 ? 'Needs attention' : 'All clear'}
              icon={<AlertTriangle />}
            />
            <MetricCard
              label="Due soon"
              value={totals.dueSoon}
              hint="Next 7 days or late"
              icon={<CalendarClock />}
            />
            <MetricCard
              label="Completion"
              value={`${totals.completionPercent}%`}
              hint={`${totals.completed} of ${totals.tasks} tasks`}
              icon={<Gauge />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <CompletionDonut
              percent={totals.completionPercent}
              completed={totals.completed}
              open={totals.open}
              total={totals.tasks}
            />
            <DistributionCard
              title="Tasks by status"
              data={statusData}
              total={totals.tasks}
              description={`${totals.tasks} tasks tracked`}
            />
            <DistributionCard title="Tasks by priority" data={priorityData} total={totals.tasks} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <DistributionCard title="Tasks by type" data={typeData} total={totals.tasks} />
            <DistributionCard
              title="Tasks by technical area"
              data={areaData}
              total={totals.tasks}
            />
            <SprintProgressCard sprint={stats.currentSprint} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <ProjectStatsCard projects={stats.projectBreakdown} />
            <RecentTasksCard tasks={stats.recentTasks} />
            <BlockedTasksCard tasks={stats.blockedTasks} />
          </div>
        </div>
      )}
    </>
  );
}
