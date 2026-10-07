'use client';

import { ErrorState } from '@/components/common/error-state';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <ErrorState
          title="An unexpected error occurred"
          description={error.message}
          onRetry={reset}
        />
      </div>
    </div>
  );
}
