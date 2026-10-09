import type { ComponentType } from 'react';
import {
  Columns3,
  FolderKanban,
  FolderPlus,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  Search,
  Settings,
  SquarePen,
  Timer,
} from 'lucide-react';

export interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  group: string;
  inSidebar: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'nav-dashboard',
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    group: 'Navigate',
    inSidebar: true,
  },
  {
    id: 'nav-projects',
    title: 'Projects',
    href: '/projects',
    icon: FolderKanban,
    group: 'Navigate',
    inSidebar: true,
  },
  {
    id: 'nav-board',
    title: 'Board',
    href: '/board',
    icon: Columns3,
    group: 'Navigate',
    inSidebar: true,
  },
  {
    id: 'nav-tasks',
    title: 'Tasks',
    href: '/tasks',
    icon: ListTodo,
    group: 'Navigate',
    inSidebar: true,
  },
  {
    id: 'nav-sprints',
    title: 'Sprints',
    href: '/sprints',
    icon: Timer,
    group: 'Navigate',
    inSidebar: true,
  },
  {
    id: 'nav-search',
    title: 'Search',
    href: '/search',
    icon: Search,
    group: 'Navigate',
    inSidebar: false,
  },
  {
    id: 'nav-chat',
    title: 'AI Chat',
    href: '/chat',
    icon: MessageSquare,
    group: 'Navigate',
    inSidebar: true,
  },
  {
    id: 'nav-settings',
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    group: 'Navigate',
    inSidebar: true,
  },
];

export const CREATE_ITEMS: NavItem[] = [
  {
    id: 'create-task',
    title: 'New task',
    href: '/tasks/new',
    icon: SquarePen,
    group: 'Create',
    inSidebar: false,
  },
  {
    id: 'create-project',
    title: 'New project',
    href: '/projects/new',
    icon: FolderPlus,
    group: 'Create',
    inSidebar: false,
  },
  {
    id: 'create-sprint',
    title: 'New sprint',
    href: '/sprints/new',
    icon: Timer,
    group: 'Create',
    inSidebar: false,
  },
];

export const PAGE_TITLES: Record<string, string> = {
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
