'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface RemoveDependencyButtonProps {
  taskId: string;
  dependencyId: string;
  taskTitle: string;
}

export function RemoveDependencyButton({
  taskId,
  dependencyId,
  taskTitle,
}: RemoveDependencyButtonProps) {
  const router = useRouter();
  const [isRemoving, setIsRemoving] = useState(false);

  async function handleRemove() {
    setIsRemoving(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}/dependencies/${dependencyId}`, {
        method: 'DELETE',
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        toast.error(data?.error ?? 'Could not remove the dependency');
        return;
      }

      toast.success(`Removed dependency on ${taskTitle}`);
      router.refresh();
    } catch {
      toast.error('Could not remove the dependency');
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={`Remove dependency on ${taskTitle}`}
      onClick={handleRemove}
      disabled={isRemoving}
    >
      {isRemoving ? <Loader2 className="animate-spin" /> : <X />}
    </Button>
  );
}
