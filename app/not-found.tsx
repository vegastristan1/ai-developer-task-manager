import Link from 'next/link';
import { ErrorState } from '@/components/common/error-state';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <ErrorState
          title="Page not found"
          description="The page you are looking for does not exist or has been moved."
          action={
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
