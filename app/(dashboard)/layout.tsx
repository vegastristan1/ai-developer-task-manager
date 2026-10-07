import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { TopNav } from '@/components/layout/top-nav';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export const instant = false;

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: session.user.name ?? null,
          email: session.user.email ?? null,
        }}
      />
      <SidebarInset>
        <TopNav />
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
