'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Columns3,
  FolderKanban,
  FolderPlus,
  Hash,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  Search,
  Settings,
  SquarePen,
  Timer,
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface CommandDef {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  group: string;
}

const commands: CommandDef[] = [
  { id: 'nav-dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, group: 'Navigate' },
  { id: 'nav-projects', label: 'Projects', href: '/projects', icon: FolderKanban, group: 'Navigate' },
  { id: 'nav-board', label: 'Board', href: '/board', icon: Columns3, group: 'Navigate' },
  { id: 'nav-tasks', label: 'Tasks', href: '/tasks', icon: ListTodo, group: 'Navigate' },
  { id: 'nav-sprints', label: 'Sprints', href: '/sprints', icon: Timer, group: 'Navigate' },
  { id: 'nav-search', label: 'Search', href: '/search', icon: Search, group: 'Navigate' },
  { id: 'nav-chat', label: 'AI Chat', href: '/chat', icon: MessageSquare, group: 'Navigate' },
  { id: 'nav-settings', label: 'Settings', href: '/settings', icon: Settings, group: 'Navigate' },
  { id: 'create-task', label: 'New task', href: '/tasks/new', icon: SquarePen, group: 'Create' },
  { id: 'create-project', label: 'New project', href: '/projects/new', icon: FolderPlus, group: 'Create' },
  { id: 'create-sprint', label: 'New sprint', href: '/sprints/new', icon: Timer, group: 'Create' },
];

interface PaletteResults {
  tasks: { id: string; title: string; project: { name: string } }[];
  projects: { id: string; name: string }[];
  labels: { id: string; name: string }[];
}

interface PaletteItem {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  group: string;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PaletteResults | null>(null);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const openPalette = useCallback(() => {
    setOpen(true);
  }, []);

  const resetPalette = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults(null);
    setActive(0);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (open) {
          resetPalette();
        } else {
          openPalette();
        }
        return;
      }

      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target as HTMLElement | null;
        const editable =
          target &&
          (target.isContentEditable ||
            ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
        if (!editable && !open) {
          event.preventDefault();
          openPalette();
        }
      }
    }

    function onOpenRequest() {
      openPalette();
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('open-command-palette', onOpenRequest);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('open-command-palette', onOpenRequest);
    };
  }, [open, openPalette, resetPalette]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!open || trimmed.length === 0) return;

    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.results) setResults(data.results as PaletteResults);
        })
        .catch(() => {});
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, query]);

  const items = useMemo<PaletteItem[]>(() => {
    const trimmed = query.trim().toLowerCase();
    const matched = commands.filter(
      (command) =>
        !trimmed ||
        command.label.toLowerCase().includes(trimmed) ||
        command.group.toLowerCase().includes(trimmed),
    );

    const entityItems: PaletteItem[] = [];
    if (trimmed && results) {
      for (const task of results.tasks.slice(0, 6)) {
        entityItems.push({
          id: `task-${task.id}`,
          label: task.title,
          sublabel: task.project.name,
          href: `/tasks/${task.id}`,
          icon: ListTodo,
          group: 'Tasks',
        });
      }
      for (const project of results.projects.slice(0, 4)) {
        entityItems.push({
          id: `project-${project.id}`,
          label: project.name,
          href: `/projects/${project.id}`,
          icon: FolderKanban,
          group: 'Projects',
        });
      }
      for (const label of results.labels.slice(0, 4)) {
        entityItems.push({
          id: `label-${label.id}`,
          label: label.name,
          href: `/tasks?q=${encodeURIComponent(label.name)}`,
          icon: Hash,
          group: 'Labels',
        });
      }
    }

    return [...matched, ...entityItems];
  }, [query, results]);

  const activeIndex = items.length > 0 ? Math.min(active, items.length - 1) : 0;

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const element = list.querySelector('[data-active="true"]');
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  function navigate(item: PaletteItem) {
    resetPalette();
    router.push(item.href);
  }

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (items.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((activeIndex + 1) % items.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((activeIndex - 1 + items.length) % items.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      navigate(items[activeIndex]);
    }
  }

  let lastGroup: string | null = null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) openPalette();
        else resetPalette();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="top-[15%] grid max-w-lg translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search tasks, projects, labels, and run commands.
        </DialogDescription>

        <div className="flex items-center gap-2 border-b px-3">
          <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Type a command or search…"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Command palette search"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="text-muted-foreground hidden shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] sm:block">
            Esc
          </kbd>
        </div>

        <div
          ref={listRef}
          className="max-h-[min(420px,60vh)] overflow-y-auto p-1.5"
          role="listbox"
          aria-label="Command results"
        >
          {items.length === 0 ? (
            <p className="text-muted-foreground px-3 py-6 text-center text-sm">
              No results for “{query.trim()}”.
            </p>
          ) : (
            items.map((item, index) => {
              const showGroup = item.group !== lastGroup;
              lastGroup = item.group;
              const Icon = item.icon;
              return (
                <div key={item.id}>
                  {showGroup && (
                    <div className="text-muted-foreground px-3 pt-2 pb-1 text-xs font-medium">
                      {item.group}
                    </div>
                  )}
                  <button
                    type="button"
                    data-active={index === activeIndex}
                    onClick={() => navigate(item)}
                    onMouseEnter={() => setActive(index)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm',
                      index === activeIndex && 'bg-muted',
                    )}
                    role="option"
                    aria-selected={index === activeIndex}
                  >
                    <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{item.label}</span>
                      {item.sublabel && (
                        <span className="text-muted-foreground block truncate text-xs">
                          {item.sublabel}
                        </span>
                      )}
                    </span>
                    <span className="text-muted-foreground shrink-0 text-xs">{item.group}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="text-muted-foreground flex items-center justify-between gap-2 border-t px-3 py-2 text-xs">
          <span>↑↓ to navigate · Enter to open</span>
          <span>
            <kbd className="rounded border px-1 font-mono">Ctrl</kbd> +{' '}
            <kbd className="rounded border px-1 font-mono">K</kbd>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
