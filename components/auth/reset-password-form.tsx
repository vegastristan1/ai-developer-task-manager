'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);

    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get('newPassword'));
    const confirmPassword = String(formData.get('confirmPassword'));

    if (newPassword !== confirmPassword) {
      setFieldError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const response = await fetch('/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword, confirmPassword }),
    });
    setIsLoading(false);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      if (response.status === 422) {
        const first = Array.isArray(data?.issues) ? data.issues[0] : null;
        setFieldError(first?.message ?? 'Invalid input');
      } else {
        setFieldError(data?.error ?? 'Could not reset your password');
      }
      return;
    }

    toast.success('Password reset — sign in with your new password');
    router.push('/login');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Choose a new password</CardTitle>
        <CardDescription>Your reset link is valid for 1 hour and single-use.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="newPassword" className="text-sm font-medium">
              New password
            </label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm new password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>
          {fieldError && <p className="text-destructive text-sm">{fieldError}</p>}
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="animate-spin" />}
            Reset password
          </Button>
        </form>
        <p className="text-muted-foreground mt-4 text-center text-sm">
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
