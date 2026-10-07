'use client';

import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  taskPriorities,
  taskPriorityLabels,
  taskStatuses,
  taskStatusLabels,
} from '@/lib/validations/task';

const ALL = 'all';

interface ProjectOption {
  id: string;
  name: string;
}

export interface TaskFilterValues {
  projectId?: string;
  status?: string;
  priority?: string;
  q?: string;
}

interface TaskFiltersProps {
  projects: ProjectOption[];
  initial: TaskFilterValues;
}

export function TaskFilters({ projects, initial }: TaskFiltersProps) {
  const router = useRouter();

  function apply(patch: Record<string, string | undefined>) {
    const next: Record<string, string | undefined> = {
      projectId: initial.projectId,
      status: initial.status,
      priority: initial.priority,
      q: initial.q,
      ...patch,
    };

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value && value !== ALL) params.set(key, value);
    }

    const query = params.toString();
    router.replace(query ? `/tasks?${query}` : '/tasks');
  }

  const hasFilters = !!initial.projectId || !!initial.status || !!initial.priority || !!initial.q;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={initial.projectId ?? ALL}
        onValueChange={(value) => apply({ projectId: value })}
      >
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

      <Select value={initial.status ?? ALL} onValueChange={(value) => apply({ status: value })}>
        <SelectTrigger className="w-44" aria-label="Filter by status">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {taskStatuses.map((status) => (
            <SelectItem key={status} value={status}>
              {taskStatusLabels[status]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={initial.priority ?? ALL} onValueChange={(value) => apply({ priority: value })}>
        <SelectTrigger className="w-44" aria-label="Filter by priority">
          <SelectValue placeholder="All priorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All priorities</SelectItem>
          {taskPriorities.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {taskPriorityLabels[priority]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get('q');
          apply({ q: typeof value === 'string' ? value.trim() : undefined });
        }}
      >
        <Input
          name="q"
          defaultValue={initial.q ?? ''}
          placeholder="Search tasks…"
          className="w-52"
          aria-label="Search tasks"
        />
        <Button type="submit" variant="outline" size="icon" aria-label="Search">
          <Search />
        </Button>
      </form>

      {hasFilters && (
        <Button type="button" variant="ghost" onClick={() => router.replace('/tasks')}>
          <X />
          Clear
        </Button>
      )}
    </div>
  );
}
