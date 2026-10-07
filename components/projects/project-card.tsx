import Link from 'next/link';
import { ProjectStatusBadge } from '@/components/projects/status-badge';
import { formatDate } from '@/lib/utils';
import type { ProjectStatusValue } from '@/lib/validations/project';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    repositoryUrl: string | null;
    technologyStack: string[];
    status: ProjectStatusValue;
    updatedAt: Date | string;
    _count: { tasks: number; sprints: number; labels: number };
  };
}

const MAX_TECHNOLOGIES = 4;

export function ProjectCard({ project }: ProjectCardProps) {
  const visibleTechnologies = project.technologyStack.slice(0, MAX_TECHNOLOGIES);
  const remaining = project.technologyStack.length - visibleTechnologies.length;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="border-bg-card group hover:border-ring/60 focus-visible:ring-ring/50 flex flex-col gap-4 rounded-xl border p-4 transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm leading-snug font-medium">{project.name}</h2>
        <ProjectStatusBadge status={project.status} />
      </div>

      <p className="text-muted-foreground line-clamp-2 text-sm">
        {project.description ?? 'No description yet.'}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {visibleTechnologies.map((technology) => (
          <span
            key={technology}
            className="text-muted-foreground bg-muted rounded-md border px-1.5 py-0.5 text-xs"
          >
            {technology}
          </span>
        ))}
        {remaining > 0 && (
          <span className="text-muted-foreground rounded-md border px-1.5 py-0.5 text-xs">
            +{remaining}
          </span>
        )}
        {project.technologyStack.length === 0 && (
          <span className="text-muted-foreground text-xs">No technologies</span>
        )}
      </div>

      <div className="text-muted-foreground mt-auto flex items-center justify-between border-t pt-3 text-xs">
        <span>
          {project._count.tasks} tasks · {project._count.sprints} sprints
        </span>
        <span>Updated {formatDate(project.updatedAt)}</span>
      </div>
    </Link>
  );
}
