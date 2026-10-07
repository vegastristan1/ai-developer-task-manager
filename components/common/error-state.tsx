import type { ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  action?: ReactNode;
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  action,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-10 text-center">
      <div className="bg-destructive/10 text-destructive flex size-10 items-center justify-center rounded-lg">
        <TriangleAlert className="size-5" />
      </div>
      <div className="max-w-sm">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm break-words">{description}</p>
        )}
      </div>
      {(onRetry || action) && (
        <div className="flex items-center gap-2">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              Try again
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
