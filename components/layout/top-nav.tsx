'use client';

import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/layout/theme-toggle';

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  board: 'Board',
  tasks: 'Tasks',
  sprints: 'Sprints',
  chat: 'AI Chat',
  search: 'Search',
  settings: 'Settings',
  'style-guide': 'Style Guide',
};

export function TopNav() {
  const pathname = usePathname();
  const segment = pathname.split('/')[1] ?? 'dashboard';
  const title = pageTitles[segment] ?? 'Not found';

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <span className="text-sm font-medium">{title}</span>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-muted-foreground hidden h-8 gap-2 px-2 font-normal sm:flex"
          onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
        >
          <Search className="size-3.5" aria-hidden />
          Search…
          <kbd className="bg-muted rounded border px-1 font-mono text-[10px]">Ctrl K</kbd>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
