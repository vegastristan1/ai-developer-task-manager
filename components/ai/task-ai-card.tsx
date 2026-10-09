'use client';

import { useState } from 'react';
import {
  ClipboardList,
  ListChecks,
  ListTree,
  Loader2,
  ShieldCheck,
  Sparkles,
  Timer,
} from 'lucide-react';
import { toast } from 'sonner';
import { AiActionDialog, type AiActionResult } from '@/components/ai/ai-action-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AiAction } from '@/lib/validations/ai';

interface TaskAiCardProps {
  taskId: string;
  projectId: string;
  existingSubtasks: string[];
}

const actions: { action: AiAction; label: string; icon: typeof ListTree }[] = [
  { action: 'breakdown', label: 'Break into subtasks', icon: ListTree },
  { action: 'plan', label: 'Draft implementation plan', icon: ClipboardList },
  { action: 'acceptance-criteria', label: 'Suggest criteria', icon: ListChecks },
  { action: 'estimate', label: 'Estimate effort', icon: Timer },
  { action: 'review', label: 'Review task', icon: ShieldCheck },
];

export function TaskAiCard({ taskId, projectId, existingSubtasks }: TaskAiCardProps) {
  const [pending, setPending] = useState<AiAction | null>(null);
  const [result, setResult] = useState<AiActionResult | null>(null);

  async function runAction(action: AiAction) {
    setPending(action);
    try {
      const response = await fetch(`/api/ai/tasks/${taskId}/${action}`, { method: 'POST' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(payload?.error ?? 'The AI request failed');
        return;
      }
      setResult({ action, source: payload.source, data: payload.data });
    } catch {
      toast.error('The AI request failed');
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles />
            AI assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <p className="text-muted-foreground text-sm">
            Suggestions are returned for review — nothing is applied until you approve it.
          </p>
          {actions.map(({ action, label, icon: Icon }) => (
            <Button
              key={action}
              variant="outline"
              size="sm"
              className="justify-start"
              onClick={() => runAction(action)}
              disabled={pending !== null}
            >
              {pending === action ? <Loader2 className="animate-spin" /> : <Icon />}
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>

      {result && (
        <AiActionDialog
          taskId={taskId}
          projectId={projectId}
          existingSubtasks={existingSubtasks}
          result={result}
          onClose={() => setResult(null)}
        />
      )}
    </>
  );
}
