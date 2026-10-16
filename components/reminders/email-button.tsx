'use client';

import { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function RemindersEmailButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/reminders/email', { method: 'POST' });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(
          response.status === 429
            ? 'Too many emails. Try again later.'
            : 'Could not send the summary',
        );
        return;
      }

      const counts = data?.counts;
      toast.success(
        `Summary sent (${counts?.overdue ?? 0} overdue, ${counts?.dueSoon ?? 0} due soon, ${counts?.blocked ?? 0} blocked)`,
      );
    } catch {
      toast.error('Could not send the summary');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" disabled={isLoading} onClick={handleClick}>
      {isLoading ? <Loader2 className="animate-spin" /> : <Mail />}
      Email me this summary
    </Button>
  );
}
