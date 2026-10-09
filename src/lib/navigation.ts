import {
  LayoutDashboard,
  CalendarDays,
  ListChecks,
  NotebookText,
  GraduationCap,
  History,
  Timer,
  MonitorDown,
  type LucideIcon,
} from 'lucide-react';

export type TabId =
  | 'overview'
  | 'schedule'
  | 'tasks'
  | 'cheatsheets'
  | 'exam'
  | 'history'
  | 'pomodoro'
  | 'desktop';

export interface NavItem {
  id: TabId;
  label: string;
  icon: LucideIcon;
  section: 'main' | 'more';
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, section: 'main' },
  { id: 'schedule', label: 'Schedule', icon: CalendarDays, section: 'main' },
  { id: 'tasks', label: 'To-do list', icon: ListChecks, section: 'main' },
  { id: 'cheatsheets', label: 'Clutch Notes', icon: NotebookText, section: 'main' },
  { id: 'exam', label: 'Exam Simulator', icon: GraduationCap, section: 'main' },
  { id: 'history', label: 'History', icon: History, section: 'main' },
  { id: 'pomodoro', label: 'Pomodoro', icon: Timer, section: 'main' },
  { id: 'desktop', label: 'Desktop app', icon: MonitorDown, section: 'more' },
];

export const isTabId = (v: string): v is TabId =>
  NAV_ITEMS.some((item) => item.id === v);

export const getNavItem = (id: TabId): NavItem =>
  NAV_ITEMS.find((item) => item.id === id)!;
