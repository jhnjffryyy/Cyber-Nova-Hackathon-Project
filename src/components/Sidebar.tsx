import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { GraduationCap, Database, X } from 'lucide-react';
import { NAV_ITEMS, TabId } from '../lib/navigation';
import { cn } from '../lib/cn';
import { IconButton } from './ui';

interface SidebarProps {
  activeTab: TabId;
  onNavigate: (tab: TabId) => void;
  studentName: string;
  programName: string;
  onOpenProfileModal: () => void;
  onOpenBackupModal: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const getInitials = (name: string) => {
  if (!name || name === 'Student') return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onNavigate,
  studentName,
  programName,
  onOpenProfileModal,
  onOpenBackupModal,
  mobileOpen,
  onCloseMobile,
}) => {
  const reducedMotion = useReducedMotion();
  const drawerRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    prevFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    const first = drawerRef.current?.querySelector<HTMLElement>('button');
    first?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
      prevFocusRef.current?.focus?.();
    };
  }, [mobileOpen, onCloseMobile]);

  const go = (id: TabId) => {
    onNavigate(id);
    onCloseMobile();
  };

  const navContent = (isMobile: boolean) => (
    <>
      {/* Brand */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-line">
        <div className="w-7 h-7 rounded-[8px] bg-accent text-on-accent flex items-center justify-center shrink-0">
          <GraduationCap className="w-4 h-4" aria-hidden />
        </div>
        <span className="font-display text-[15px] font-semibold text-ink">
          Study Hub
        </span>
        {isMobile && (
          <IconButton
            icon={X}
            label="Close navigation"
            onClick={onCloseMobile}
            className="ml-auto"
            size="sm"
          />
        )}
      </div>

      {/* Nav */}
      <nav className="px-3 py-2 space-y-0.5 flex-1 overflow-y-auto">
        {NAV_ITEMS.filter((i) => i.section === 'main').map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => go(item.id)}
              className={cn(
                'w-full flex items-center gap-3 h-9 px-3 rounded-control text-sm font-medium transition-[background-color,color] duration-150',
                active
                  ? 'bg-accent-soft text-accent-ink'
                  : 'text-ink-2 hover:bg-subtle hover:text-ink'
              )}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden />
              <span>{item.label}</span>
            </button>
          );
        })}
        <div className="text-xs font-medium text-ink-3 px-3 pt-4 pb-1">More</div>
        {NAV_ITEMS.filter((i) => i.section === 'more').map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => go(item.id)}
              className={cn(
                'w-full flex items-center gap-3 h-9 px-3 rounded-control text-sm font-medium transition-[background-color,color] duration-150',
                active
                  ? 'bg-accent-soft text-accent-ink'
                  : 'text-ink-2 hover:bg-subtle hover:text-ink'
              )}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-line p-3 space-y-1">
        <button
          type="button"
          onClick={() => {
            onOpenBackupModal();
            onCloseMobile();
          }}
          className="w-full flex items-center gap-3 h-9 px-3 rounded-control text-sm font-medium text-ink-2 hover:bg-subtle hover:text-ink transition-[background-color,color] duration-150"
        >
          <Database className="w-[18px] h-[18px] shrink-0" aria-hidden />
          <span>Backup &amp; data</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onOpenProfileModal();
            onCloseMobile();
          }}
          className="w-full flex items-center gap-3 h-12 px-3 rounded-control text-left hover:bg-subtle transition-[background-color] duration-150"
        >
          <span className="w-8 h-8 rounded-full bg-accent-soft text-accent-ink flex items-center justify-center text-xs font-semibold shrink-0">
            {getInitials(studentName)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-ink truncate">
              {studentName || 'Student'}
            </span>
            <span className="block text-xs text-ink-3 truncate">
              {programName || 'College Program'}
            </span>
          </span>
        </button>
        <p className="text-xs text-ink-3 px-3 pt-1">
          Saved on this device · works offline
        </p>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 sticky top-0 h-dvh bg-surface border-r border-line flex-col select-none">
        {navContent(false)}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              aria-hidden
            />
            <motion.div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-surface border-r border-line flex flex-col shadow-pop"
              initial={reducedMotion ? { opacity: 0 } : { transform: 'translateX(-100%)' }}
              animate={reducedMotion ? { opacity: 1 } : { transform: 'translateX(0)' }}
              exit={reducedMotion ? { opacity: 0 } : { transform: 'translateX(-100%)' }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            >
              {navContent(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
