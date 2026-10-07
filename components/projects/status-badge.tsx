import { Badge } from '@/components/ui/badge';
import { projectStatusLabels, type ProjectStatusValue } from '@/lib/validations/project';

const statusVariants: Record<ProjectStatusValue, 'default' | 'secondary' | 'outline'> = {
  ACTIVE: 'default',
  ON_HOLD: 'secondary',
  ARCHIVED: 'outline',
};

export function ProjectStatusBadge({ status }: { status: ProjectStatusValue }) {
  return <Badge variant={statusVariants[status]}>{projectStatusLabels[status]}</Badge>;
}
