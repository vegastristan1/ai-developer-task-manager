import { Skeleton } from '@/components/ui/skeleton';
import { TvLoader } from '@/components/loading/tv-loader';

/**
 * Default route loading view: animated TV mark above the familiar
 * skeleton layout.
 */
export function PageLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-center py-6">
        <TvLoader size="md" caption="Loading your workspace…" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
