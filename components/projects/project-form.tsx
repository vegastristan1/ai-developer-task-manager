'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  projectStatuses,
  projectStatusLabels,
  type ProjectStatusValue,
} from '@/lib/validations/project';

interface ProjectFormInitial {
  id: string;
  name: string;
  description: string | null;
  repositoryUrl: string | null;
  technologyStack: string[];
  status: ProjectStatusValue;
}

interface ProjectFormProps {
  mode: 'create' | 'edit';
  initial?: ProjectFormInitial;
}

interface ApiIssue {
  path: (string | number)[];
  message: string;
}

export function ProjectForm({ mode, initial }: ProjectFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [repositoryUrl, setRepositoryUrl] = useState(initial?.repositoryUrl ?? '');
  const [technologyStack, setTechnologyStack] = useState<string[]>(initial?.technologyStack ?? []);
  const [status, setStatus] = useState<ProjectStatusValue>(initial?.status ?? 'ACTIVE');
  const [techInput, setTechInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function addTechnology(value: string) {
    const technology = value.trim().replace(/,$/, '');
    if (!technology) return;
    if (technologyStack.some((item) => item.toLowerCase() === technology.toLowerCase())) {
      setTechInput('');
      return;
    }
    setTechnologyStack((items) => [...items, technology]);
    setTechInput('');
  }

  function removeTechnology(value: string) {
    setTechnologyStack((items) => items.filter((item) => item !== value));
  }

  function handleTechnologyKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTechnology(techInput);
    }
    if (event.key === 'Backspace' && !techInput && technologyStack.length > 0) {
      removeTechnology(technologyStack[technologyStack.length - 1]);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const url = mode === 'create' ? '/api/projects' : `/api/projects/${initial?.id}`;
    const method = mode === 'create' ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          repositoryUrl,
          technologyStack,
          status,
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

      toast.success(mode === 'create' ? 'Project created' : 'Project updated');
      router.push(`/projects/${data.project.id}`);
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
        <CardTitle>{mode === 'create' ? 'New project' : 'Edit project'}</CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Add a project to organise its tasks, sprints, and labels.'
            : 'Update the project details below.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="AI Developer Task Manager"
              aria-invalid={!!errors.name}
              required
            />
            {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
          </div>

          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this project about?"
              rows={4}
              aria-invalid={!!errors.description}
            />
            {errors.description && <p className="text-destructive text-sm">{errors.description}</p>}
          </div>

          <div className="grid gap-2">
            <label htmlFor="repositoryUrl" className="text-sm font-medium">
              Repository URL
            </label>
            <Input
              id="repositoryUrl"
              name="repositoryUrl"
              type="url"
              value={repositoryUrl}
              onChange={(event) => setRepositoryUrl(event.target.value)}
              placeholder="https://github.com/you/project"
              aria-invalid={!!errors.repositoryUrl}
            />
            {errors.repositoryUrl && (
              <p className="text-destructive text-sm">{errors.repositoryUrl}</p>
            )}
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-medium">Technology stack</span>
            <div className="flex flex-wrap gap-2">
              {technologyStack.map((technology) => (
                <span
                  key={technology}
                  className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium"
                >
                  {technology}
                  <button
                    type="button"
                    onClick={() => removeTechnology(technology)}
                    aria-label={`Remove ${technology}`}
                    className="hover:text-foreground transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              {technologyStack.length === 0 && (
                <span className="text-muted-foreground text-xs">No technologies added yet</span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={techInput}
                onChange={(event) => setTechInput(event.target.value)}
                onKeyDown={handleTechnologyKeyDown}
                placeholder="Add a technology, then press Enter"
                aria-invalid={!!errors.technologyStack}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => addTechnology(techInput)}
                disabled={!techInput.trim()}
              >
                <Plus />
                Add
              </Button>
            </div>
            {errors.technologyStack && (
              <p className="text-destructive text-sm">{errors.technologyStack}</p>
            )}
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-medium">Status</span>
            <div
              role="radiogroup"
              aria-label="Project status"
              className="border-input inline-flex w-fit rounded-lg border p-0.5"
            >
              {projectStatuses.map((value) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={status === value}
                  onClick={() => setStatus(value)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    status === value
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {projectStatusLabels[value]}
                </button>
              ))}
            </div>
            {errors.status && <p className="text-destructive text-sm">{errors.status}</p>}
          </div>

          <div className="flex items-center gap-2 border-t pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {mode === 'create' ? 'Create project' : 'Save changes'}
            </Button>
            <Button type="button" variant="ghost" asChild>
              <Link href={mode === 'edit' && initial ? `/projects/${initial.id}` : '/projects'}>
                Cancel
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
