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
  taskTypes,
  taskTypeLabels,
  technicalAreas,
  technicalAreaLabels,
} from '@/lib/validations/task';

const ALL = 'all';

interface Option {
  id: string;
  name: string;
}

export interface SearchFilterValues {
  q?: string;
  status?: string;
  priority?: string;
  type?: string;
  technicalArea?: string;
  projectId?: string;
  sprintId?: string;
}

interface SearchBoxProps {
  initial: SearchFilterValues;
  projects: Option[];
  sprints: Option[];
}

export function SearchBox({ initial, projects, sprints }: SearchBoxProps) {
  const router = useRouter();

  function apply(patch: Record<string, string | undefined>) {
    const next = { ...initial, ...patch };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value && value !== ALL) params.set(key, value);
    }
    const query = params.toString();
    router.replace(query ? `/search?${query}` : '/search');
  }

  const hasFilters = !!(
    initial.q ||
    initial.status ||
    initial.priority ||
    initial.type ||
    initial.technicalArea ||
    initial.projectId ||
    initial.sprintId
  );

  return (
    <div className="flex flex-col gap-2">
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
          key={initial.q ?? ''}
          defaultValue={initial.q ?? ''}
          placeholder="Search tasks, projects, labels, descriptions…"
          className="max-w-xl flex-1"
          aria-label="Search everything"
        />
        <Button type="submit">
          <Search />
          Search
        </Button>
        {hasFilters && (
          <Button type="button" variant="ghost" onClick={() => router.replace('/search')}>
            <X />
            Clear
          </Button>
        )}
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={initial.projectId ?? ALL}
          onValueChange={(value) => apply({ projectId: value })}
        >
          <SelectTrigger className="w-48" aria-label="Filter by project">
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

        <Select value={initial.status ?? ALL} onValueChange={(value) => apply({ status: value })}>
          <SelectTrigger className="w-40" aria-label="Filter by status">
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

        <Select
          value={initial.priority ?? ALL}
          onValueChange={(value) => apply({ priority: value })}
        >
          <SelectTrigger className="w-40" aria-label="Filter by priority">
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
          <SelectTrigger className="w-40" aria-label="Filter by type">
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
          <SelectTrigger className="w-40" aria-label="Filter by technical area">
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
      </div>
    </div>
  );
}
