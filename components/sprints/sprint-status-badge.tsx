import type { ComponentProps } from 'react';
import { Badge } from '@/components/ui/badge';
import { getSprintPhase, sprintPhaseLabels, type SprintPhase } from '@/lib/validations/sprint';

type BadgeVariant = ComponentProps<typeof Badge>['variant'];

const phaseStyles: Record<SprintPhase, { variant: BadgeVariant; className?: string }> = {
  UPCOMING: { variant: 'outline' },
  ACTIVE: {
    variant: 'default',
    className:
      'border-sky-600/30 bg-sky-600/10 text-sky-700 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-400',
  },
  ENDED: { variant: 'secondary', className: 'text-muted-foreground' },
};

interface SprintStatusBadgeProps {
  startDate: Date | string;
  endDate: Date | string;
}

export function SprintStatusBadge({ startDate, endDate }: SprintStatusBadgeProps) {
  const phase = getSprintPhase(startDate, endDate);
  const style = phaseStyles[phase];

  return (
    <Badge variant={style.variant} className={style.className}>
      {sprintPhaseLabels[phase]}
    </Badge>
  );
}
