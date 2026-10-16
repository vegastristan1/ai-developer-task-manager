'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Loader2, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function DangerZoneForm({ email }: { email: string }) {
  const [confirmation, setConfirmation] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const confirmed = confirmation.trim().toLowerCase() === email.trim().toLowerCase();
  const canDelete = confirmed && password.length > 0 && !isDeleting;

  async function handleDelete() {
    if (!canDelete) return;
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          setError(data?.error ?? 'Current password is incorrect');
        } else if (response.status === 429) {
          setError('Too many attempts. Please try again later.');
        } else {
          setError(data?.error ?? 'Could not delete your account');
        }
        return;
      }

      setConfirmOpen(false);
      toast.success('Account deleted');
      await signOut({ callbackUrl: '/login' });
    } catch {
      setError('Could not delete your account');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card className="border-destructive/50 max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TriangleAlert className="size-4" aria-hidden />
          Danger zone
        </CardTitle>
        <CardDescription>
          Permanently delete your account and all of its projects, tasks, and conversations. This
          cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2">
          <label htmlFor="delete-confirm" className="text-sm font-medium">
            Type <span className="font-mono">{email}</span> to confirm
          </label>
          <Input
            id="delete-confirm"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={email}
            autoComplete="off"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="delete-password" className="text-sm font-medium">
            Current password
          </label>
          <Input
            id="delete-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error && !confirmOpen && <p className="text-destructive text-sm">{error}</p>}
        <div>
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <Button
              type="button"
              variant="destructive"
              disabled={!canDelete}
              onClick={() => {
                setError(null);
                setConfirmOpen(true);
              }}
            >
              Delete my account
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                <AlertDialogDescription>
                  {email} and all of its projects, tasks, sprints, labels, and AI conversations will
                  be permanently deleted. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={(event) => {
                    event.preventDefault();
                    void handleDelete();
                  }}
                >
                  {isDeleting && <Loader2 className="animate-spin" />}
                  Yes, delete my account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
