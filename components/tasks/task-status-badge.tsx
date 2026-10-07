import type { ComponentProps } from 'react';
import { Badge } from '@/components/ui/badge';
import { taskStatusLabels, type TaskStatusValue } from '@/lib/validations/task';

type BadgeVariant = ComponentProps<typeof Badge>['variant'];

const statusStyles: Record<TaskStatusValue, { variant: BadgeVariant; className?: string }> = {
  TODO: { variant: 'outline' },
  IN_PROGRESS: { variant: 'default' },
  IN_REVIEW: { variant: 'secondary' },
  BLOCKED: { variant: 'destructive' },
  DONE: {
    variant: 'outline',
    className:
      'border-emerald-600/30 bg-emerald-600/10 text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-400',
  },
};

export function TaskStatusBadge({ status }: { status: TaskStatusValue }) {
  const style = statusStyles[status];
  return (
    <Badge variant={style.variant} className={style.className}>
      {taskStatusLabels[status]}
    </Badge>
  );
}
