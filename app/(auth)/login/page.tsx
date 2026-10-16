'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { FlaskConical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const DEMO_EMAIL = 'alex@example.com';
const DEMO_PASSWORD = 'password123';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      if (result.error.toLowerCase().includes('pending')) {
        toast.error('Your account is pending approval. Please try again later.');
      } else {
        toast.error('Invalid email or password');
      }
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  function handleDemoLogin() {
    if (isLoading) return;
    if (emailRef.current) emailRef.current.value = DEMO_EMAIL;
    if (passwordRef.current) passwordRef.current.value = DEMO_PASSWORD;
    formRef.current?.requestSubmit();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your workspace to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              ref={emailRef}
              placeholder="alex@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              ref={passwordRef}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="animate-spin" />}
            Sign in
          </Button>
          <p className="text-center text-sm">
            <Link
              href="/forgot-password"
              className="text-muted-foreground underline underline-offset-4"
            >
              Forgot your password?
            </Link>
          </p>
        </form>
        <div className="border-border mt-4 rounded-xl border p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <FlaskConical className="size-4" aria-hidden />
            Try the demo
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Explore with a shared demo account — no registration needed.
          </p>
          <dl className="mt-2 grid gap-1 text-xs">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-mono">{DEMO_EMAIL}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted-foreground">Password</dt>
              <dd className="font-mono">{DEMO_PASSWORD}</dd>
            </div>
          </dl>
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full"
            disabled={isLoading}
            onClick={handleDemoLogin}
          >
            {isLoading && <Loader2 className="animate-spin" />}
            Sign in with demo account
          </Button>
        </div>
        <p className="text-muted-foreground mt-4 text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-foreground underline underline-offset-4">
            Register
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
