import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { formatShortDate } from '../lib/dates';
import { useToday } from '../lib/useToday';

interface TopNavbarProps {
  activeTab: 'overview' | 'schedule' | 'tasks' | 'cheatsheets' | 'exam' | 'desktop' | 'pomodoro';
  searchQuery: string;
  studentName: string;
  setSearchQuery: (query: string) => void;
  onOpenDesktopModal: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeTab,
  searchQuery,
  setSearchQuery,
  onOpenDesktopModal,
}) => {
  const today = useToday();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);

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

  const getSectionTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Overview';
      case 'schedule':
        return 'My schedule';
      case 'tasks':
        return 'To-do list';
      case 'cheatsheets':
        return 'Clutch Notes';
      case 'exam':
        return 'Exam Simulator';
      case 'pomodoro':
        return 'Pomodoro Timer';
      case 'desktop':
        return 'Windows .EXE Studio';
    }
  };

  return (
    <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between sticky top-0 z-10">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-400 font-medium">Workspace</span>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-bold">{getSectionTitle()}</span>
      </div>

      {/* Center: Search Bar */}
      <div className="max-w-md w-full mx-6 hidden sm:block">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search classes, notes, and tasks..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="text-xs text-gray-400 font-medium hidden lg:inline">
          {formatShortDate(today)}
        </span>
      </div>
    </header>
  );
};
