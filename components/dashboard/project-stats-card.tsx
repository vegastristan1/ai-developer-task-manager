import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { DashboardProjectStat } from '@/services/dashboard';

export function ProjectStatsCard({ projects }: { projects: DashboardProjectStat[] }) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Project statistics</CardTitle>
        <CardDescription>Completion across your projects</CardDescription>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <p className="text-muted-foreground text-sm">No projects yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {projects.map((project) => (
              <li key={project.id} className="grid gap-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <Link
                    href={`/projects/${project.id}`}
                    className="min-w-0 truncate font-medium hover:underline"
                  >
                    {project.name}
                  </Link>
                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                    {project.taskCount > 0
                      ? `${project.completedCount}/${project.taskCount} · ${project.completionPercent}%`
                      : 'No tasks'}
                  </span>
                </div>
                <Progress value={project.completionPercent} className="h-1.5" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
