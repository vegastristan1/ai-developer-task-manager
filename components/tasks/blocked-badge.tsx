import { Link2 } from 'lucide-react';
import { cn } from 'cn';

interface BlockedBadgeProps {
  count: number;
  className?: string;
}

export function BlockedBadge({ count, className }: BlockedBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-amber-600/30 bg-amber-600/10 px-1.5 py-0.5 text-xs font-medium text-amber-600 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-400',
        className,
      )}
      title="Blocked by unfinished dependencies"
    >
      <Link2 className="size-3" aria-hidden />
      Waiting on {count}
    </span>
  );
}
