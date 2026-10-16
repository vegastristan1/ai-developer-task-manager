import { cn } from 'cn';
import { TvLoader } from '@/components/loading/tv-loader';

/**
 * Compact centered TV mark for Suspense fallbacks and small loading slots.
 */
export function InlineLoading({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-10', className)}>
      <TvLoader size="md" />
    </div>
  );
}
