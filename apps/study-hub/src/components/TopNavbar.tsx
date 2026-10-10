import React, { useState, useEffect } from 'react';
import { Menu, Search, Monitor, Sun, Moon } from 'lucide-react';
import { formatShortDate } from '../lib/dates';
import { useToday } from '../lib/useToday';
import { getNavItem, TabId } from '../lib/navigation';
import { useTheme, ThemePref } from '../lib/theme';
import { Button, IconButton, Input } from './ui';

interface TopNavbarProps {
  activeTab: TabId;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenMenu: () => void;
  onOpenDesktopModal: () => void;
}

const THEME_ORDER: ThemePref[] = ['system', 'light', 'dark'];
const THEME_META: Record<ThemePref, { icon: typeof Monitor; label: string }> = {
  system: { icon: Monitor, label: 'Theme: System' },
  light: { icon: Sun, label: 'Theme: Light' },
  dark: { icon: Moon, label: 'Theme: Dark' },
};

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  searchQuery,
  setSearchQuery,
  onOpenMenu,
  onOpenDesktopModal,
}) => {
  const today = useToday();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [theme, setTheme] = useTheme();

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      onOpenDesktopModal();
    }
  };

  const cycleTheme = () => {
    const next = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];
    setTheme(next);
  };

  const ThemeIcon = THEME_META[theme].icon;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-md">
      <div className="h-14 sm:h-16 px-4 sm:px-6 lg:px-8 flex items-center gap-3">
        <IconButton
          icon={Menu}
          label="Open navigation"
          onClick={onOpenMenu}
          className="lg:hidden"
        />
        <span className="text-sm font-semibold text-ink">
          {getNavItem(activeTab).label}
        </span>

        <div className="ml-auto flex items-center gap-2">
          {/* Desktop search */}
          <div className="relative hidden md:block w-64 lg:w-80">
            <Search
              className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden
            />
            <Input
              type="search"
              aria-label="Search classes, notes and tasks"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search classes, notes and tasks"
              className="pl-9 h-9 text-sm"
            />
          </div>
          {/* Mobile search toggle */}
          <IconButton
            icon={Search}
            label="Search"
            onClick={() => setMobileSearchOpen((v) => !v)}
            className="md:hidden"
          />

          <span className="text-[13px] text-ink-3 hidden xl:inline">
            {formatShortDate(today)}
          </span>

          <IconButton
            icon={ThemeIcon}
            label={THEME_META[theme].label}
            onClick={cycleTheme}
            variant="secondary"
          />

          {deferredPrompt && !isStandalone && (
            <Button variant="secondary" size="sm" onClick={handleInstallApp}>
              Install app
            </Button>
          )}
        </div>
      </div>

      {/* Mobile search row */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <Search
              className="w-4 h-4 text-ink-3 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden
            />
            <Input
              type="search"
              aria-label="Search classes, notes and tasks"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search classes, notes and tasks"
              className="pl-9"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
};
