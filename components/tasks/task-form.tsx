'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from 'cn';
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
import { labelColors } from '@/lib/validations/label';
import {
  complexities,
  complexityLabels,
  taskPriorities,
  taskPriorityLabels,
  taskStatuses,
  taskStatusLabels,
  taskTypes,
  taskTypeLabels,
  technicalAreas,
  technicalAreaLabels,
  type ComplexityValue,
  type TaskPriorityValue,
  type TaskStatusValue,
  type TaskTypeValue,
  type TechnicalAreaValue,
} from '@/lib/validations/task';

const NONE = 'none';

interface ProjectOption {
  id: string;
  name: string;
}

interface LabelOption {
  id: string;
  name: string;
  color: string;
}

interface SprintOption {
  id: string;
  name: string;
}

interface TaskFormInitial {
  id: string;
  title: string;
  description: string | null;
  projectId: string;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  type: TaskTypeValue;
  technicalArea: TechnicalAreaValue | null;
  complexity: ComplexityValue | null;
  dueDate: string | null;
  estimatedEffort: string | null;
  actualEffort: string | null;
  technicalNotes: string | null;
  acceptanceCriteria: string[];
  labelIds: string[];
  sprintId: string | null;
}

interface TaskFormProps {
  mode: 'create' | 'edit';
  initial?: TaskFormInitial;
  projects?: ProjectOption[];
  labels?: LabelOption[];
  sprints?: SprintOption[];
}

interface ApiIssue {
  path: (string | number)[];
  message: string;
}

interface Option {
  value: string;
  label: string;
}

function FormSelect({
  value,
  onValueChange,
  placeholder,
  options,
  ariaLabel,
  disabled,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  options: Option[];
  ariaLabel: string;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full" aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TaskForm({ mode, initial, projects, labels, sprints }: TaskFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [projectId, setProjectId] = useState(initial?.projectId ?? '');
  const [status, setStatus] = useState<TaskStatusValue>(initial?.status ?? 'TODO');
  const [priority, setPriority] = useState<TaskPriorityValue>(initial?.priority ?? 'MEDIUM');
  const [type, setType] = useState<TaskTypeValue>(initial?.type ?? 'FEATURE');
  const [technicalArea, setTechnicalArea] = useState<string>(initial?.technicalArea ?? NONE);
  const [complexity, setComplexity] = useState<string>(initial?.complexity ?? NONE);
  const [sprintId, setSprintId] = useState<string>(initial?.sprintId ?? NONE);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '');
  const [estimatedEffort, setEstimatedEffort] = useState(initial?.estimatedEffort ?? '');
  const [actualEffort, setActualEffort] = useState(initial?.actualEffort ?? '');
  const [technicalNotes, setTechnicalNotes] = useState(initial?.technicalNotes ?? '');
  const [criteria, setCriteria] = useState<string[]>(initial?.acceptanceCriteria ?? []);
  const [criteriaDraft, setCriteriaDraft] = useState('');
  const [allLabels, setAllLabels] = useState<LabelOption[]>(labels ?? []);
  const [sprintOptions, setSprintOptions] = useState<SprintOption[]>(sprints ?? []);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(initial?.labelIds ?? []);
  const [labelSelectValue, setLabelSelectValue] = useState('');
  const [showNewLabel, setShowNewLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState<string>(labelColors[5]);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);
  const [isLoadingSprints, setIsLoadingSprints] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedLabels = allLabels.filter((label) => selectedLabelIds.includes(label.id));
  const availableLabels = allLabels.filter((label) => !selectedLabelIds.includes(label.id));

  async function handleProjectChange(value: string) {
    setProjectId(value);
    setSelectedLabelIds([]);
    setLabelSelectValue('');
    setSprintId(NONE);

    if (!value) {
      setAllLabels([]);
      setSprintOptions([]);
      return;
    }

    setIsLoadingLabels(true);
    setIsLoadingSprints(true);
    try {
      const [labelsResponse, sprintsResponse] = await Promise.all([
        fetch(`/api/labels?projectId=${encodeURIComponent(value)}`),
        fetch(`/api/sprints?projectId=${encodeURIComponent(value)}`),
      ]);
      const labelsData = await labelsResponse.json().catch(() => null);
      const sprintsData = await sprintsResponse.json().catch(() => null);
      setAllLabels(labelsResponse.ok ? (labelsData?.labels ?? []) : []);
      setSprintOptions(sprintsResponse.ok ? (sprintsData?.sprints ?? []) : []);
    } catch {
      setAllLabels([]);
      setSprintOptions([]);
    } finally {
      setIsLoadingLabels(false);
      setIsLoadingSprints(false);
    }
  }

  function addLabel(labelId: string) {
    if (!labelId) return;
    setSelectedLabelIds((ids) => (ids.includes(labelId) ? ids : [...ids, labelId]));
    setLabelSelectValue('');
  }

  function removeLabel(labelId: string) {
    setSelectedLabelIds((ids) => ids.filter((id) => id !== labelId));
  }

  async function handleCreateLabel() {
    const name = newLabelName.trim();
    if (!name) return;

    const targetProjectId = mode === 'edit' ? initial?.projectId : projectId;
    if (!targetProjectId) {
      toast.error('Select a project first');
      return;
    }

    try {
      const response = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: targetProjectId, name, color: newLabelColor }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(data?.error ?? 'Could not create the label');
        return;
      }

      const label: LabelOption = {
        id: data.label.id,
        name: data.label.name,
        color: data.label.color,
      };
      setAllLabels((items) => [...items, label].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedLabelIds((ids) => [...ids, label.id]);
      setNewLabelName('');
      setShowNewLabel(false);
      toast.success('Label created');
    } catch {
      toast.error('Could not create the label');
    }
  }

  function addCriterion() {
    const value = criteriaDraft.trim();
    if (!value) return;
    setCriteria((items) => [...items, value]);
    setCriteriaDraft('');
  }

  function removeCriterion(index: number) {
    setCriteria((items) => items.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const url = mode === 'create' ? '/api/tasks' : `/api/tasks/${initial?.id}`;
    const method = mode === 'create' ? 'POST' : 'PUT';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          projectId,
          status,
          priority,
          type,
          technicalArea: technicalArea === NONE ? null : technicalArea,
          complexity: complexity === NONE ? null : complexity,
          dueDate: dueDate || null,
          estimatedEffort,
          actualEffort,
          technicalNotes,
          acceptanceCriteria: criteria,
          labelIds: selectedLabelIds,
          sprintId: sprintId === NONE ? null : sprintId,
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

      toast.success(mode === 'create' ? 'Task created' : 'Task updated');
      router.push(`/tasks/${data.task.id}`);
      router.refresh();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  const labelsDisabled = mode === 'create' && !projectId;

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'New task' : 'Edit task'}</CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Describe the work, then classify it for filtering and planning.'
            : 'Update the task details below.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-5">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Implement login endpoint"
                aria-invalid={!!errors.title}
                required
              />
              {errors.title && <p className="text-destructive text-sm">{errors.title}</p>}
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
                placeholder="What needs to be done, and why?"
                rows={4}
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-destructive text-sm">{errors.description}</p>
              )}
            </div>

            {mode === 'create' && (
              <div className="grid gap-2">
                <span className="text-sm font-medium">Project</span>
                <Select value={projectId} onValueChange={handleProjectChange}>
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
                    No projects yet — create a project before adding tasks.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 border-t pt-5">
            <span className="text-sm font-medium">Classification</span>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <span className="text-sm font-medium">Status</span>
                <FormSelect
                  value={status}
                  onValueChange={(value) => setStatus(value as TaskStatusValue)}
                  placeholder="Status"
                  ariaLabel="Status"
                  options={taskStatuses.map((value) => ({
                    value,
                    label: taskStatusLabels[value],
                  }))}
                />
                {errors.status && <p className="text-destructive text-sm">{errors.status}</p>}
              </div>

              <div className="grid gap-2">
                <span className="text-sm font-medium">Priority</span>
                <FormSelect
                  value={priority}
                  onValueChange={(value) => setPriority(value as TaskPriorityValue)}
                  placeholder="Priority"
                  ariaLabel="Priority"
                  options={taskPriorities.map((value) => ({
                    value,
                    label: taskPriorityLabels[value],
                  }))}
                />
                {errors.priority && <p className="text-destructive text-sm">{errors.priority}</p>}
              </div>

              <div className="grid gap-2">
                <span className="text-sm font-medium">Type</span>
                <FormSelect
                  value={type}
                  onValueChange={(value) => setType(value as TaskTypeValue)}
                  placeholder="Type"
                  ariaLabel="Type"
                  options={taskTypes.map((value) => ({ value, label: taskTypeLabels[value] }))}
                />
                {errors.type && <p className="text-destructive text-sm">{errors.type}</p>}
              </div>

              <div className="grid gap-2">
                <span className="text-sm font-medium">Technical area</span>
                <FormSelect
                  value={technicalArea}
                  onValueChange={setTechnicalArea}
                  placeholder="Technical area"
                  ariaLabel="Technical area"
                  options={[
                    { value: NONE, label: 'Not set' },
                    ...technicalAreas.map((value) => ({
                      value,
                      label: technicalAreaLabels[value],
                    })),
                  ]}
                />
                {errors.technicalArea && (
                  <p className="text-destructive text-sm">{errors.technicalArea}</p>
                )}
              </div>

              <div className="grid gap-2">
                <span className="text-sm font-medium">Complexity</span>
                <FormSelect
                  value={complexity}
                  onValueChange={setComplexity}
                  placeholder="Complexity"
                  ariaLabel="Complexity"
                  options={[
                    { value: NONE, label: 'Not set' },
                    ...complexities.map((value) => ({ value, label: complexityLabels[value] })),
                  ]}
                />
                {errors.complexity && (
                  <p className="text-destructive text-sm">{errors.complexity}</p>
                )}
              </div>

              <div className="grid gap-2">
                <label htmlFor="dueDate" className="text-sm font-medium">
                  Due date
                </label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  aria-invalid={!!errors.dueDate}
                />
                {errors.dueDate && <p className="text-destructive text-sm">{errors.dueDate}</p>}
              </div>

              <div className="grid gap-2">
                <span className="text-sm font-medium">Sprint</span>
                <FormSelect
                  value={sprintId}
                  onValueChange={setSprintId}
                  placeholder="Sprint"
                  ariaLabel="Sprint"
                  disabled={isLoadingSprints}
                  options={[
                    { value: NONE, label: 'Backlog (no sprint)' },
                    ...sprintOptions.map((sprint) => ({ value: sprint.id, label: sprint.name })),
                  ]}
                />
                {errors.sprintId && <p className="text-destructive text-sm">{errors.sprintId}</p>}
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-t pt-5">
            <span className="text-sm font-medium">Effort</span>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="estimatedEffort" className="text-sm font-medium">
                  Estimated effort
                </label>
                <Input
                  id="estimatedEffort"
                  name="estimatedEffort"
                  value={estimatedEffort}
                  onChange={(event) => setEstimatedEffort(event.target.value)}
                  placeholder="e.g. 4–6 hours"
                  aria-invalid={!!errors.estimatedEffort}
                />
                {errors.estimatedEffort && (
                  <p className="text-destructive text-sm">{errors.estimatedEffort}</p>
                )}
              </div>
              <div className="grid gap-2">
                <label htmlFor="actualEffort" className="text-sm font-medium">
                  Actual effort
                </label>
                <Input
                  id="actualEffort"
                  name="actualEffort"
                  value={actualEffort}
                  onChange={(event) => setActualEffort(event.target.value)}
                  placeholder="e.g. 5 hours"
                  aria-invalid={!!errors.actualEffort}
                />
                {errors.actualEffort && (
                  <p className="text-destructive text-sm">{errors.actualEffort}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-2 border-t pt-5">
            <span className="text-sm font-medium">Labels</span>
            <div className="flex flex-wrap gap-2">
              {selectedLabels.map((label) => (
                <span
                  key={label.id}
                  className="bg-muted text-muted-foreground inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: label.color }}
                    aria-hidden
                  />
                  {label.name}
                  <button
                    type="button"
                    onClick={() => removeLabel(label.id)}
                    aria-label={`Remove label ${label.name}`}
                    className="hover:text-foreground transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              {selectedLabels.length === 0 && (
                <span className="text-muted-foreground text-xs">No labels attached</span>
              )}
            </div>
            <div className="flex gap-2">
              <Select
                value={labelSelectValue}
                onValueChange={addLabel}
                disabled={labelsDisabled || isLoadingLabels}
              >
                <SelectTrigger className="w-full" aria-label="Add a label">
                  <SelectValue
                    placeholder={
                      isLoadingLabels
                        ? 'Loading labels…'
                        : labelsDisabled
                          ? 'Select a project first'
                          : availableLabels.length === 0
                            ? 'No labels to add'
                            : 'Add a label…'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableLabels.map((label) => (
                    <SelectItem key={label.id} value={label.id}>
                      <span
                        className="mr-2 inline-block size-2 rounded-full"
                        style={{ backgroundColor: label.color }}
                        aria-hidden
                      />
                      {label.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewLabel((open) => !open)}
                disabled={labelsDisabled}
              >
                <Plus />
                New label
              </Button>
            </div>
            {showNewLabel && (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  value={newLabelName}
                  onChange={(event) => setNewLabelName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleCreateLabel();
                    }
                  }}
                  placeholder="Label name"
                  className="max-w-56"
                />
                <div className="flex items-center gap-1.5">
                  {labelColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewLabelColor(color)}
                      aria-label={`Color ${color}`}
                      className={cn(
                        'size-5 rounded-full transition-transform',
                        newLabelColor === color &&
                          'ring-ring ring-offset-background scale-110 ring-2 ring-offset-2',
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCreateLabel}
                  disabled={!newLabelName.trim()}
                >
                  Add label
                </Button>
              </div>
            )}
            {errors.labelIds && <p className="text-destructive text-sm">{errors.labelIds}</p>}
          </div>

          <div className="grid gap-2 border-t pt-5">
            <span className="text-sm font-medium">Acceptance criteria</span>
            <ul className="grid gap-1.5">
              {criteria.map((criterion, index) => (
                <li key={`${index}-${criterion}`} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="flex-1">{criterion}</span>
                  <button
                    type="button"
                    onClick={() => removeCriterion(index)}
                    aria-label="Remove criterion"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
              {criteria.length === 0 && (
                <li className="text-muted-foreground text-sm">No criteria yet</li>
              )}
            </ul>
            <div className="flex gap-2">
              <Input
                value={criteriaDraft}
                onChange={(event) => setCriteriaDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addCriterion();
                  }
                }}
                placeholder="e.g. Invalid credentials return an appropriate error"
                aria-invalid={!!errors.acceptanceCriteria}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addCriterion}
                disabled={!criteriaDraft.trim()}
              >
                <Plus />
                Add
              </Button>
            </div>
            {errors.acceptanceCriteria && (
              <p className="text-destructive text-sm">{errors.acceptanceCriteria}</p>
            )}
          </div>

          <div className="grid gap-2 border-t pt-5">
            <label htmlFor="technicalNotes" className="text-sm font-medium">
              Technical notes
            </label>
            <Textarea
              id="technicalNotes"
              name="technicalNotes"
              value={technicalNotes}
              onChange={(event) => setTechnicalNotes(event.target.value)}
              placeholder="Implementation hints, links, edge cases…"
              rows={3}
              aria-invalid={!!errors.technicalNotes}
            />
            {errors.technicalNotes && (
              <p className="text-destructive text-sm">{errors.technicalNotes}</p>
            )}
          </div>

          <div className="flex items-center gap-2 border-t pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {mode === 'create' ? 'Create task' : 'Save changes'}
            </Button>
            <Button type="button" variant="ghost" asChild>
              <Link href={mode === 'edit' && initial ? `/tasks/${initial.id}` : '/tasks'}>
                Cancel
              </Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
