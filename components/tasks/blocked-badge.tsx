'use client';

import { useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { ChevronDown, Link2 } from 'lucide-react';
import { cn } from 'cn';
import { TaskStatusBadge } from '@/components/tasks/task-status-badge';
import type { TaskStatusValue } from '@/lib/validations/task';

export interface BlockerInfo {
  id: string;
  title: string;
  status: TaskStatusValue;
}

interface BlockedBadgeProps {
  count: number;
  blockers?: BlockerInfo[];
  className?: string;
}

const badgeStyles =
  'inline-flex items-center gap-1 rounded-md border border-amber-600/30 bg-amber-600/10 px-1.5 py-0.5 text-xs font-medium text-amber-600 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-400';

function stopEvent(event: MouseEvent) {
  event.preventDefault();
  event.stopPropagation();
}

export function BlockedBadge({ count, blockers, className }: BlockedBadgeProps) {
  const [open, setOpen] = useState(false);

  if (count <= 0) return null;

  if (!blockers) {
    return (
      <span className={cn(badgeStyles, className)} title="Blocked by unfinished dependencies">
        <Link2 className="size-3" aria-hidden />
        Waiting on {count}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex w-full flex-col items-start gap-1', className)}>
      <button
        type="button"
        aria-expanded={open}
        title="Show blocking tasks"
        onClick={(event) => {
          stopEvent(event);
          setOpen((value) => !value);
        }}
        onPointerDown={(event) => event.stopPropagation()}
        className={cn(badgeStyles, 'cursor-pointer')}
      >
        <Link2 className="size-3" aria-hidden />
        Waiting on {count}
        <ChevronDown
          className={cn('size-3 transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open && (
        <ul
          className="bg-background flex w-full min-w-44 flex-col gap-0.5 rounded-md border p-1 shadow-sm"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {blockers.map((blocker) => (
            <li key={blocker.id}>
              <Link
                href={`/tasks/${blocker.id}`}
                onClick={(event) => event.stopPropagation()}
                className="hover:bg-muted/60 flex items-center justify-between gap-2 rounded px-1.5 py-1 text-xs font-normal"
              >
                <span className="text-foreground min-w-0 flex-1 truncate">{blocker.title}</span>
                <TaskStatusBadge status={blocker.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}
