'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { AiSource } from '@/lib/ai/client';
import { normalizeTitle } from '@/lib/utils';
import { complexityLabels, complexities, type ComplexityValue } from '@/lib/validations/task';
import {
  reviewCategoryLabels,
  reviewSeverityLabels,
  type AiAction,
  type BreakdownResult,
  type CriteriaResult,
  type EstimateResult,
  type PlanResult,
  type ReviewResult,
} from '@/lib/validations/ai';

export interface AiActionResult {
  action: AiAction;
  source: AiSource;
  data: BreakdownResult | PlanResult | CriteriaResult | EstimateResult | ReviewResult;
}

interface AiActionDialogProps {
  taskId: string;
  projectId: string;
  existingSubtasks: string[];
  result: AiActionResult;
  onClose: () => void;
}

interface BreakdownRow {
  title: string;
  description?: string;
  priority?: BreakdownResult['subtasks'][number]['priority'];
  type?: BreakdownResult['subtasks'][number]['type'];
  selected: boolean;
}

function formatPlan(sections: PlanResult['sections']): string {
  return sections
    .map((section) => `${section.title}\n${section.items.map((item) => `- ${item}`).join('\n')}`)
    .join('\n\n');
}

const severityStyles: Record<ReviewResult['findings'][number]['severity'], string> = {
  info: 'border-sky-600/40 bg-sky-600/10 text-sky-700 dark:text-sky-400',
  warning: 'border-amber-600/40 bg-amber-600/10 text-amber-700 dark:text-amber-400',
  critical: 'border-red-600/40 bg-red-600/10 text-red-700 dark:text-red-400',
};

const dialogTitles: Record<AiAction, string> = {
  breakdown: 'Review subtasks',
  plan: 'Implementation plan',
  'acceptance-criteria': 'Acceptance criteria',
  estimate: 'Effort estimate',
  review: 'Technical review',
};

const dialogWidths: Record<AiAction, string> = {
  breakdown: 'sm:max-w-xl',
  plan: 'sm:max-w-2xl',
  'acceptance-criteria': 'sm:max-w-xl',
  estimate: 'sm:max-w-md',
  review: 'sm:max-w-2xl',
};

export function AiActionDialog({
  taskId,
  projectId,
  existingSubtasks,
  result,
  onClose,
}: AiActionDialogProps) {
  const router = useRouter();
  const { action, data, source } = result;
  const [isSaving, setIsSaving] = useState(false);
  const existingSet = new Set(existingSubtasks.map((title) => normalizeTitle(title)));

  const [rows, setRows] = useState<BreakdownRow[]>(() =>
    action === 'breakdown'
      ? (data as BreakdownResult).subtasks.map((subtask) => ({ ...subtask, selected: true }))
      : [],
  );
  const [planText, setPlanText] = useState(() =>
    action === 'plan' ? formatPlan((data as PlanResult).sections) : '',
  );
  const [criteria, setCriteria] = useState<string[]>(() =>
    action === 'acceptance-criteria' ? [...(data as CriteriaResult).criteria] : [],
  );
  const [complexity, setComplexity] = useState<ComplexityValue>(() =>
    action === 'estimate' ? (data as EstimateResult).complexity : 'M',
  );
  const [effort, setEffort] = useState(() =>
    action === 'estimate' ? (data as EstimateResult).estimatedEffort : '',
  );

  async function saveToTask(body: Record<string, unknown>, successMessage: string) {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        toast.error(payload?.error ?? 'Could not save changes');
        return;
      }
      toast.success(successMessage);
      router.refresh();
      onClose();
    } catch {
      toast.error('Could not save changes');
    } finally {
      setIsSaving(false);
    }
  }

  async function approveBreakdown() {
    const tasks = rows
      .filter(
        (row) =>
          row.selected &&
          row.title.trim().length > 0 &&
          !existingSet.has(normalizeTitle(row.title)),
      )
      .map((row) => ({
        title: row.title.trim(),
        description: row.description?.trim() || undefined,
        priority: row.priority,
        type: row.type,
      }));

    if (tasks.length === 0) {
      toast.error('Select at least one new subtask');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, parentTaskId: taskId, tasks }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? 'Could not create subtasks');
        return;
      }
      const created = Array.isArray(payload?.tasks) ? payload.tasks.length : tasks.length;
      const skipped = Array.isArray(payload?.skipped) ? payload.skipped.length : 0;
      toast.success(
        `Created ${created} subtask${created === 1 ? '' : 's'}` +
          (skipped > 0 ? ` (${skipped} duplicate${skipped === 1 ? '' : 's'} skipped)` : ''),
      );
      router.refresh();
      onClose();
    } catch {
      toast.error('Could not create subtasks');
    } finally {
      setIsSaving(false);
    }
  }

  const selectedCount = rows.filter(
    (row) =>
      row.selected && row.title.trim().length > 0 && !existingSet.has(normalizeTitle(row.title)),
  ).length;
  const criteriaValid =
    criteria.length > 0 &&
    criteria.length <= 50 &&
    criteria.every((item) => item.trim().length > 0 && item.trim().length <= 500);

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className={dialogWidths[action]}>
        <DialogHeader>
          <DialogTitle>{dialogTitles[action]}</DialogTitle>
          <DialogDescription>
            {action === 'breakdown' && 'Select the subtasks to create. Nothing is saved until you approve.'}
            {action === 'plan' &&
              'Edit the plan if needed, then save it to this task. Nothing is saved until you approve.'}
            {action === 'acceptance-criteria' &&
              'Edit the criteria if needed, then save them to this task. Nothing is saved until you approve.'}
            {action === 'estimate' &&
              'Adjust the estimate manually if you disagree, then apply it to this task.'}
            {action === 'review' &&
              'Findings are read-only. Apply the recommendations manually where they make sense.'}
          </DialogDescription>
        </DialogHeader>

        {source === 'mock' && (
          <p className="border-border text-muted-foreground rounded-md border border-dashed p-2 text-xs">
            Mock preview — no OpenAI key is configured, so this is sample output. Add
            <span className="font-mono"> OPENAI_API_KEY</span> to
            <span className="font-mono"> .env.local</span> to use a live model.
          </p>
        )}

        {action === 'breakdown' && rows.length === 0 && (
          <div className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm">
            All suggested subtasks already exist — nothing new to add.
          </div>
        )}

        {action === 'breakdown' && rows.length > 0 && (
          <ul className="grid max-h-[50vh] gap-2 overflow-y-auto pr-1">
            {rows.map((row, index) => {
              const exists = existingSet.has(normalizeTitle(row.title));
              return (
                <li
                  key={`${index}-${row.title}`}
                  className="grid gap-1.5 rounded-md border p-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={exists ? false : row.selected}
                      disabled={exists}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((item, i) =>
                            i === index ? { ...item, selected: event.target.checked } : item,
                          ),
                        )
                      }
                      className="accent-primary size-4 disabled:opacity-50"
                      aria-label={`Select ${row.title}`}
                    />
                    <Input
                      value={row.title}
                      onChange={(event) =>
                        setRows((current) =>
                          current.map((item, i) =>
                            i === index ? { ...item, title: event.target.value } : item,
                          ),
                        )
                      }
                      maxLength={200}
                      className="h-8"
                    />
                  </div>
                  {row.description && (
                    <p className="text-muted-foreground pl-6 text-xs">{row.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 pl-6">
                    {exists && (
                      <span className="border-amber-600/40 bg-amber-600/10 text-amber-700 dark:text-amber-400 rounded-md border px-1.5 py-0.5 text-[11px] font-medium">
                        already exists
                      </span>
                    )}
                    {row.priority && (
                      <span className="bg-muted rounded-md border px-1.5 py-0.5 text-[11px] font-medium">
                        {row.priority}
                      </span>
                    )}
                    {row.type && (
                      <span className="bg-muted rounded-md border px-1.5 py-0.5 text-[11px] font-medium">
                        {row.type}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {action === 'plan' && (
          <Textarea
            value={planText}
            onChange={(event) => setPlanText(event.target.value)}
            rows={16}
            maxLength={20000}
            aria-label="Implementation plan"
          />
        )}

        {action === 'acceptance-criteria' && (
          <div className="grid max-h-[50vh] gap-2 overflow-y-auto pr-1">
            {criteria.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <Textarea
                  value={item}
                  onChange={(event) =>
                    setCriteria((current) =>
                      current.map((value, i) => (i === index ? event.target.value : value)),
                    )
                  }
                  rows={2}
                  maxLength={500}
                  className="min-h-10"
                  aria-label={`Criterion ${index + 1}`}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setCriteria((current) => current.filter((_, i) => i !== index))}
                  aria-label="Remove criterion"
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="justify-self-start"
              disabled={criteria.length >= 50}
              onClick={() => setCriteria((current) => [...current, ''])}
            >
              <Plus />
              Add criterion
            </Button>
          </div>
        )}

        {action === 'estimate' && (
          <div className="grid gap-4">
            <div className="grid gap-2">
              <span className="text-muted-foreground text-sm font-medium">Complexity</span>
              <div className="flex flex-wrap gap-1.5">
                {complexities.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setComplexity(value)}
                    className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      complexity === value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/70'
                    }`}
                  >
                    {complexityLabels[value]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="ai-estimate-effort" className="text-muted-foreground text-sm font-medium">
                Estimated effort
              </label>
              <Input
                id="ai-estimate-effort"
                value={effort}
                onChange={(event) => setEffort(event.target.value)}
                maxLength={50}
                placeholder="e.g. 4-8h"
              />
            </div>
            <div className="grid gap-1.5">
              <span className="text-muted-foreground text-sm font-medium">Reasoning</span>
              <p className="bg-muted rounded-md border p-3 text-sm whitespace-pre-wrap">
                {(data as EstimateResult).reasoning}
              </p>
            </div>
          </div>
        )}

        {action === 'review' && (
          <ul className="grid max-h-[55vh] gap-2 overflow-y-auto pr-1">
            {(data as ReviewResult).findings.map((finding, index) => (
              <li key={index} className="grid gap-1.5 rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="bg-muted rounded-md border px-1.5 py-0.5 text-[11px] font-medium">
                    {reviewCategoryLabels[finding.category]}
                  </span>
                  <span
                    className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${severityStyles[finding.severity]}`}
                  >
                    {reviewSeverityLabels[finding.severity]}
                  </span>
                </div>
                <p className="text-sm font-medium">{finding.message}</p>
                <p className="text-muted-foreground text-sm">{finding.recommendation}</p>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {action === 'review' || (action === 'breakdown' && rows.length === 0)
              ? 'Close'
              : 'Cancel'}
          </Button>
          {action === 'breakdown' && rows.length > 0 && (
            <Button onClick={approveBreakdown} disabled={isSaving || selectedCount === 0}>
              {isSaving && <Loader2 className="animate-spin" />}
              Create {selectedCount > 0 ? `${selectedCount} ` : ''}subtask
              {selectedCount === 1 ? '' : 's'}
            </Button>
          )}
          {action === 'plan' && (
            <Button
              onClick={() => saveToTask({ implementationPlan: planText.trim() }, 'Implementation plan saved')}
              disabled={isSaving || planText.trim().length === 0}
            >
              {isSaving && <Loader2 className="animate-spin" />}
              Save plan
            </Button>
          )}
          {action === 'acceptance-criteria' && (
            <Button
              onClick={() =>
                saveToTask(
                  { acceptanceCriteria: criteria.map((item) => item.trim()) },
                  'Acceptance criteria saved',
                )
              }
              disabled={isSaving || !criteriaValid}
            >
              {isSaving && <Loader2 className="animate-spin" />}
              Save criteria
            </Button>
          )}
          {action === 'estimate' && (
            <Button
              onClick={() =>
                saveToTask(
                  { complexity, estimatedEffort: effort.trim() },
                  'Estimate applied to task',
                )
              }
              disabled={isSaving || effort.trim().length === 0}
            >
              {isSaving && <Loader2 className="animate-spin" />}
              Apply estimate
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
