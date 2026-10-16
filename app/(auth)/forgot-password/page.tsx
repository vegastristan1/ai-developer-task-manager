'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const response = await fetch('/api/auth/forgot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(formData.get('email')) }),
    });

    setIsLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      toast.error(data?.error ?? 'Could not send the reset link');
      return;
    }

    setSent(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Forgot password</CardTitle>
        <CardDescription>
          Enter your account email and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="grid gap-4">
            <p className="text-sm">
              If an account exists for that email, a reset link is on its way. It expires in 1 hour.
            </p>
            <p className="text-muted-foreground text-center text-sm">
              <Link href="/login" className="text-foreground underline underline-offset-4">
                Back to sign in
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="alex@example.com"
                autoComplete="email"
                required
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="animate-spin" />}
              Send reset link
            </Button>
          </form>
        )}
        {!sent && (
          <p className="text-muted-foreground mt-4 text-center text-sm">
            Remembered it?{' '}
            <Link href="/login" className="text-foreground underline underline-offset-4">
              Sign in
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
