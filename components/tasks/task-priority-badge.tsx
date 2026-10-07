import type { ComponentProps } from 'react';
import { Badge } from '@/components/ui/badge';
import { taskPriorityLabels, type TaskPriorityValue } from '@/lib/validations/task';

type BadgeVariant = ComponentProps<typeof Badge>['variant'];

const priorityStyles: Record<TaskPriorityValue, { variant: BadgeVariant; className?: string }> = {
  LOW: { variant: 'ghost', className: 'text-muted-foreground' },
  MEDIUM: { variant: 'outline' },
  HIGH: {
    variant: 'outline',
    className:
      'border-amber-600/30 bg-amber-600/10 text-amber-600 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-400',
  },
  CRITICAL: { variant: 'destructive' },
};

export function TaskPriorityBadge({ priority }: { priority: TaskPriorityValue }) {
  const style = priorityStyles[priority];
  return (
    <Badge variant={style.variant} className={style.className}>
      {taskPriorityLabels[priority]}
    </Badge>
  );
}
