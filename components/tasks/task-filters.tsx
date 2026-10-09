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
  taskSorts,
  taskSortLabels,
  taskStatuses,
  taskStatusLabels,
  taskTypes,
  taskTypeLabels,
  technicalAreas,
  technicalAreaLabels,
} from '@/lib/validations/task';

const ALL = 'all';

interface ProjectOption {
  id: string;
  name: string;
}

export interface TaskFilterValues {
  projectId?: string;
  sprintId?: string;
  status?: string;
  priority?: string;
  type?: string;
  technicalArea?: string;
  sort?: string;
  q?: string;
}

interface TaskFiltersProps {
  projects: ProjectOption[];
  sprints?: ProjectOption[];
  initial: TaskFilterValues;
  basePath?: string;
  showStatus?: boolean;
  showSort?: boolean;
  defaultSort?: string;
}

export function TaskFilters({
  projects,
  sprints,
  initial,
  basePath = '/tasks',
  showStatus = true,
  showSort = false,
  defaultSort = 'updatedAt',
}: TaskFiltersProps) {
  const router = useRouter();

  function apply(patch: Record<string, string | undefined>) {
    const next: Record<string, string | undefined> = {
      projectId: initial.projectId,
      sprintId: initial.sprintId,
      status: showStatus ? initial.status : undefined,
      priority: initial.priority,
      type: initial.type,
      technicalArea: initial.technicalArea,
      sort: showSort ? initial.sort : undefined,
      q: initial.q,
      ...patch,
    };

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value && value !== ALL) params.set(key, value);
    }

    const query = params.toString();
    router.replace(query ? `${basePath}?${query}` : basePath);
  }

  const hasFilters = !!(
    initial.projectId ||
    initial.sprintId ||
    (showStatus && initial.status) ||
    initial.priority ||
    initial.type ||
    initial.technicalArea ||
    initial.q
  );

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

      {showStatus && (
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
      )}

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

      <Select value={initial.type ?? ALL} onValueChange={(value) => apply({ type: value })}>
        <SelectTrigger className="w-44" aria-label="Filter by task type">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All types</SelectItem>
          {taskTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {taskTypeLabels[type]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={initial.technicalArea ?? ALL}
        onValueChange={(value) => apply({ technicalArea: value })}
      >
        <SelectTrigger className="w-44" aria-label="Filter by technical area">
          <SelectValue placeholder="All areas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All areas</SelectItem>
          {technicalAreas.map((area) => (
            <SelectItem key={area} value={area}>
              {technicalAreaLabels[area]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {sprints && sprints.length > 0 && (
        <Select
          value={initial.sprintId ?? ALL}
          onValueChange={(value) => apply({ sprintId: value })}
        >
          <SelectTrigger className="w-44" aria-label="Filter by sprint">
            <SelectValue placeholder="All sprints" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All sprints</SelectItem>
            {sprints.map((sprint) => (
              <SelectItem key={sprint.id} value={sprint.id}>
                {sprint.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showSort && (
        <Select
          value={initial.sort ?? defaultSort}
          onValueChange={(value) => apply({ sort: value })}
        >
          <SelectTrigger className="w-48" aria-label="Sort tasks">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {taskSorts.map((sort) => (
              <SelectItem key={sort} value={sort}>
                {taskSortLabels[sort]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

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
        <Button type="button" variant="ghost" onClick={() => router.replace(basePath)}>
          <X />
          Clear
        </Button>
      )}
    </div>
  );
}
