'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface ManagedUser {
  id: string;
  email: string;
  name: string | null;
  approved: boolean;
  approvedAt: Date | string | null;
  isAdmin: boolean;
  createdAt: Date | string;
}

export function AdminUsers({ users }: { users: ManagedUser[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setApproved(id: string, approved: boolean) {
    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        toast.error(payload?.error ?? 'Could not update user');
        return;
      }
      toast.success(approved ? 'User approved' : 'Approval revoked');
      router.refresh();
    } catch {
      toast.error('Could not update user');
    } finally {
      setBusyId(null);
    }
  }

  async function removeUser(id: string, email: string) {
    if (!window.confirm(`Delete ${email}? Their projects, tasks, and chats go with it.`)) return;
    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        toast.error(payload?.error ?? 'Could not delete user');
        return;
      }
      toast.success('User deleted');
      router.refresh();
    } catch {
      toast.error('Could not delete user');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ul className="flex flex-col gap-2">
      {users.map((managed) => {
        const busy = busyId === managed.id;
        return (
          <li key={managed.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {managed.name ?? 'Unnamed user'}
                {managed.isAdmin && (
                  <Badge variant="secondary" className="ml-2">
                    Admin
                  </Badge>
                )}
              </p>
              <p className="text-muted-foreground truncate text-xs">
                {managed.email} · joined {formatDate(new Date(managed.createdAt))}
              </p>
            </div>
            {managed.approved ? (
              <Badge variant="outline">Approved</Badge>
            ) : (
              <Badge variant="destructive">Pending</Badge>
            )}
            <div className="flex items-center gap-2">
              {managed.approved ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => void setApproved(managed.id, false)}
                >
                  {busy ? <Loader2 className="animate-spin" /> : <X />}
                  Revoke
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() => void setApproved(managed.id, true)}
                >
                  {busy ? <Loader2 className="animate-spin" /> : <Check />}
                  Approve
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={busy}
                onClick={() => void removeUser(managed.id, managed.email)}
                aria-label={`Delete ${managed.email}`}
              >
                <Trash2 />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
