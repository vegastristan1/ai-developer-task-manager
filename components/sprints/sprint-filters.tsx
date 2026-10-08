'use client';

import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ALL = 'all';

interface ProjectOption {
  id: string;
  name: string;
}

interface SprintFiltersProps {
  projects: ProjectOption[];
  projectId?: string;
}

export function SprintFilters({ projects, projectId }: SprintFiltersProps) {
  const router = useRouter();

  function apply(value: string) {
    const params = new URLSearchParams();
    if (value && value !== ALL) params.set('projectId', value);
    const query = params.toString();
    router.replace(query ? `/sprints?${query}` : '/sprints');
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={projectId ?? ALL} onValueChange={apply}>
        <SelectTrigger className="w-52" aria-label="Filter by project">
          <SelectValue placeholder="All projects" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All projects</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {projectId && (
        <Button type="button" variant="ghost" onClick={() => apply(ALL)}>
          <X />
          Clear
        </Button>
      )}
    </div>
  );
}
