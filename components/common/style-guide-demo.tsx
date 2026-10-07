'use client';

import { useState } from 'react';
import { Bell, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">{children}</CardContent>
    </Card>
  );
}

export function StyleGuideDemo() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('This is a simulated error for the error state demo.');
  }

  return (
    <div className="flex flex-col gap-6">
      <Section title="Buttons" description="Button variants and sizes.">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button disabled>Disabled</Button>
      </Section>

      <Section title="Modal dialog" description="Standard dialog for forms and details.">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Open dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create task</DialogTitle>
              <DialogDescription>This is how modal dialogs look and behave.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Section title="Confirmation dialog" description="Destructive actions require confirmation.">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 />
              Delete project
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the project and all of
                its tasks.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => toast.success('Project deleted (demo)')}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Section>

      <Section title="Toast notifications" description="Feedback after user actions.">
        <Button variant="outline" onClick={() => toast.success('Task created successfully')}>
          <Bell />
          Success toast
        </Button>
        <Button variant="outline" onClick={() => toast.error('Failed to save changes')}>
          Error toast
        </Button>
        <Button variant="outline" onClick={() => toast.info('3 tasks are blocked')}>
          Info toast
        </Button>
      </Section>

      <Section title="Skeleton loading" description="Shown while data is loading.">
        <div className="flex w-full flex-col gap-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex gap-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </Section>

      <Section title="Empty state" description="Shown when a list has no items.">
        <div className="w-full">
          <EmptyState
            icon={<Sparkles />}
            title="Nothing here yet"
            description="When there is content to show, it will appear here."
          />
        </div>
      </Section>

      <Section title="Error state" description="Thrown errors caught by the error boundary.">
        <Button variant="outline" onClick={() => setShouldThrow(true)}>
          Simulate error
        </Button>
        <div className="w-full">
          <ErrorState
            title="Example error"
            description="This is the reusable error state component."
            onRetry={() => toast.info('Retried (demo)')}
          />
        </div>
      </Section>
    </div>
  );
}
