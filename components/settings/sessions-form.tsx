'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, MonitorSmartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SessionsForm() {
  const { update } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOutEverywhere() {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/sessions/invalidate', { method: 'POST' });

      if (!response.ok) {
        toast.error(
          response.status === 429
            ? 'Too many attempts. Try again later.'
            : 'Could not sign out other sessions',
        );
        return;
      }

      // Refresh our own token so this device stays signed in.
      await update();
      toast.success('Signed out everywhere else (takes effect within a minute)');
    } catch {
      toast.error('Could not sign out other sessions');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MonitorSmartphone className="size-4" aria-hidden />
          Sessions
        </CardTitle>
        <CardDescription>
          You are signed in on this device. Signing out everywhere else ends any other sessions
          within about a minute — this device stays signed in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={handleSignOutEverywhere}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <MonitorSmartphone />}
          Sign out all other devices
        </Button>
      </CardContent>
    </Card>
  );
}
