'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ApiIssue {
  path: (string | number)[];
  message: string;
}

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch('/api/auth/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 422 && Array.isArray(data?.issues)) {
          const fieldErrors: Record<string, string> = {};
          for (const issue of data.issues as ApiIssue[]) {
            const key = String(issue.path[0] ?? 'form');
            if (!fieldErrors[key]) fieldErrors[key] = issue.message;
          }
          setErrors(fieldErrors);
        } else if (response.status === 401) {
          setErrors({ currentPassword: data?.error ?? 'Current password is incorrect' });
        } else if (response.status === 429) {
          toast.error('Too many attempts. Please try again later.');
        } else {
          toast.error(data?.error ?? 'Could not update your password');
        }
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated');
    } catch {
      toast.error('Could not update your password');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          Enter your current password to confirm, then choose a new one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-2">
            <label htmlFor="password-current" className="text-sm font-medium">
              Current password
            </label>
            <Input
              id="password-current"
              name="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              aria-invalid={!!errors.currentPassword}
              required
            />
            {errors.currentPassword && (
              <p className="text-destructive text-sm">{errors.currentPassword}</p>
            )}
          </div>

          <div className="grid gap-2">
            <label htmlFor="password-new" className="text-sm font-medium">
              New password
            </label>
            <Input
              id="password-new"
              name="newPassword"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              aria-invalid={!!errors.newPassword}
              required
            />
            {errors.newPassword && <p className="text-destructive text-sm">{errors.newPassword}</p>}
          </div>

          <div className="grid gap-2">
            <label htmlFor="password-confirm" className="text-sm font-medium">
              Confirm new password
            </label>
            <Input
              id="password-confirm"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              aria-invalid={!!errors.confirmPassword}
              required
            />
            {errors.confirmPassword && (
              <p className="text-destructive text-sm">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="border-t pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="animate-spin" />}
              Update password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
