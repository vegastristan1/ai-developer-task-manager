import { LoadingMessage } from '@/components/loading/loading-message';
import { TvLoader } from '@/components/loading/tv-loader';

/**
 * Full-viewport branded splash: centered TV mark, app name, thin loading bar.
 */
export function SplashLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16">
      <TvLoader size="lg" />
      <div className="flex flex-col items-center gap-1.5 text-center">
        <p className="font-heading text-lg font-semibold">AI Developer Task Manager</p>
        <LoadingMessage />
      </div>
      <div className="bg-muted h-1 w-44 overflow-hidden rounded-full">
        <div className="bg-primary animate-bar-fill h-full w-full origin-left rounded-full" />
      </div>
      <span className="sr-only" role="status">
        Loading…
      </span>
    </div>
  );
}
