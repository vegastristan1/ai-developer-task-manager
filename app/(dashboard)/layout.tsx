import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { ChatBubble } from '@/components/chat/chat-bubble';
import { CommandPalette } from '@/components/layout/command-palette';
import { TopNav } from '@/components/layout/top-nav';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getSessionUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/prisma';

export const instant = false;

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await connection();
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  const pendingApprovals = user.isAdmin
    ? await prisma.user.count({ where: { approved: false } })
    : 0;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        user={{
          name: user.name,
          email: user.email,
        }}
        isAdmin={user.isAdmin}
        pendingApprovals={pendingApprovals}
      />
      <SidebarInset>
        <TopNav />
        <CommandPalette />
        <ChatBubble />
        <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
