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
import { projectStatuses, projectStatusLabels } from '@/lib/validations/project';

const ALL = 'all';

export interface ProjectFilterValues {
  q?: string;
  status?: string;
}

interface ProjectFiltersProps {
  initial: ProjectFilterValues;
}

export function ProjectFilters({ initial }: ProjectFiltersProps) {
  const router = useRouter();

  function apply(patch: Record<string, string | undefined>) {
    const next = { ...initial, ...patch };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value && value !== ALL) params.set(key, value);
    }
    const query = params.toString();
    router.replace(query ? `/projects?${query}` : '/projects');
  }

  const hasFilters = !!(initial.q || initial.status);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={initial.status ?? ALL} onValueChange={(value) => apply({ status: value })}>
        <SelectTrigger className="w-44" aria-label="Filter by status">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {projectStatuses.map((status) => (
            <SelectItem key={status} value={status}>
              {projectStatusLabels[status]}
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
          placeholder="Search projects…"
          className="w-52"
          aria-label="Search projects"
        />
        <Button type="submit" variant="outline" size="icon" aria-label="Search">
          <Search />
        </Button>
      </form>

      {hasFilters && (
        <Button type="button" variant="ghost" onClick={() => router.replace('/projects')}>
          <X />
          Clear
        </Button>
      )}
    </div>
  );
}
