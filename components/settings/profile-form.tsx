'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface ProfileFormProps {
  initial: {
    name: string;
    email: string;
    image: string | null;
  };
}

interface ApiIssue {
  path: (string | number)[];
  message: string;
}

export function ProfileForm({ initial }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [image, setImage] = useState(initial.image ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const preview = image.trim();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image: image.trim() }),
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
        } else {
          toast.error(data?.error ?? 'Could not save your profile');
        }
        return;
      }

      toast.success('Profile updated');
      router.refresh();
    } catch {
      toast.error('Could not save your profile');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update the name shown across your dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-5">
          <div className="grid gap-2">
            <label htmlFor="profile-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="profile-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              aria-invalid={!!errors.name}
              required
            />
            {errors.name && <p className="text-destructive text-sm">{errors.name}</p>}
          </div>

          <div className="grid gap-2">
            <label htmlFor="profile-email" className="text-sm font-medium">
              Email
            </label>
            <Input id="profile-email" name="email" value={initial.email} readOnly disabled />
            <p className="text-muted-foreground text-xs">Your email address cannot be changed.</p>
          </div>

          <div className="grid gap-2">
            <label htmlFor="profile-image" className="text-sm font-medium">
              Avatar URL
            </label>
            <div className="flex items-center gap-3">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Avatar preview"
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <span className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full text-sm font-medium">
                  {(name.trim()[0] ?? initial.email[0] ?? '?').toUpperCase()}
                </span>
              )}
              <Input
                id="profile-image"
                name="image"
                value={image}
                onChange={(event) => setImage(event.target.value)}
                placeholder="https://…"
                inputMode="url"
                aria-invalid={!!errors.image}
              />
            </div>
            {errors.image && <p className="text-destructive text-sm">{errors.image}</p>}
            <p className="text-muted-foreground text-xs">
              Paste an image link, or leave empty for initials.
            </p>
          </div>

          <div className="border-t pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
