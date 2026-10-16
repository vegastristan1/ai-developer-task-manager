import type { Metadata } from 'next';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { AdminUsers } from '@/components/admin/admin-users';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { getSessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export const metadata: Metadata = { title: 'User Approvals' };

export const instant = false;

export default async function AdminUsersPage() {
  await connection();
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  if (!user.isAdmin) {
    redirect('/dashboard');
  }

  const users = await prisma.user.findMany({
    where: { id: { not: user.id } },
    select: {
      id: true,
      email: true,
      name: true,
      approved: true,
      approvedAt: true,
      isAdmin: true,
      createdAt: true,
    },
    orderBy: [{ approved: 'asc' }, { createdAt: 'desc' }],
  });

  return (
    <>
      <PageHeader
        title="User approvals"
        description="Approve new registrations before they can sign in."
      />
      {users.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck />}
          title="No other accounts"
          description="New registrations will appear here for approval."
        />
      ) : (
        <AdminUsers users={users} />
      )}
    </>
  );
}
