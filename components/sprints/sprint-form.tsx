'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface ProjectOption {
  id: string;
  name: string;
}

interface SprintFormInitial {
  id: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  projectId: string;
}

interface SprintFormProps {
  mode: 'create' | 'edit';
  initial?: SprintFormInitial;
  projects?: ProjectOption[];
}

interface ApiIssue {
  path: (string | number)[];
  message: string;
}

export function SprintForm({ mode, initial, projects }: SprintFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [goal, setGoal] = useState(initial?.goal ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? '');
  const [endDate, setEndDate] = useState(initial?.endDate ?? '');
  const [projectId, setProjectId] = useState(initial?.projectId ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const url = mode === 'create' ? '/api/sprints' : `/api/sprints/${initial?.id}`;
    const method = mode === 'create' ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          goal,
          startDate,
          endDate,
          ...(mode === 'create' && { projectId }),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 422 && Array.isArray(data?.issues)) {
          const fieldErrors: Record<string, string> = {};
          for (const issue of data.issues as ApiIssue[]) {
            const key = String(issue.path[0] ?? 'form');
            if (!fieldErrors[key]) fieldErrors[key] = issue.message;
          }
          setErrors(fieldErrors);
          toast.error('Please fix the highlighted fields');
        } else {
          toast.error(data?.error ?? 'Something went wrong');
        }
        return;
      }

      toast.success(mode === 'create' ? 'Sprint created' : 'Sprint updated');
      router.push(`/sprints/${data.sprint.id}`);
      router.refresh();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'New sprint' : 'Edit sprint'}</CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Define a timebox with a goal, then assign tasks to it.'
            : 'Update the sprint details below.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-5">
          {mode === 'create' && (
            <div className="grid gap-2">
              <span className="text-sm font-medium">Project</span>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="w-full" aria-label="Project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {(projects ?? []).map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && <p className="text-destructive text-sm">{errors.projectId}</p>}
              {(projects ?? []).length === 0 && (
                <p className="text-muted-foreground text-sm">
                  No projects yet — create a project before adding sprints.
                </p>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Sprint 1"
              aria-invalid={!!errors.name}
              required
            />
            {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
          </div>

          <div className="grid gap-2">
            <label htmlFor="goal" className="text-sm font-medium">
              Goal
            </label>
            <Textarea
              id="goal"
              name="goal"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              placeholder="What should this sprint achieve?"
              rows={3}
              aria-invalid={!!errors.goal}
            />
            {errors.goal && <p className="text-destructive text-sm">{errors.goal}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="startDate" className="text-sm font-medium">
                Start date
              </label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                aria-invalid={!!errors.startDate}
                required
              />
              {errors.startDate && <p className="text-destructive text-sm">{errors.startDate}</p>}
            </div>

            <div className="grid gap-2">
              <label htmlFor="endDate" className="text-sm font-medium">
                End date
              </label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                aria-invalid={!!errors.endDate}
                required
              />
              {errors.endDate && <p className="text-destructive text-sm">{errors.endDate}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2 border-t pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {mode === 'create' ? 'Create sprint' : 'Save changes'}
            </Button>
            <Button type="button" variant="ghost" asChild>
              <Link href={mode === 'edit' && initial ? `/sprints/${initial.id}` : '/sprints'}>
                Cancel
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
