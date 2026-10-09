import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  FileText,
  GraduationCap,
  Timer,
  User,
  Edit2,
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'overview' | 'schedule' | 'tasks' | 'cheatsheets' | 'exam' | 'pomodoro' | 'desktop';
  setActiveTab: (tab: 'overview' | 'schedule' | 'tasks' | 'cheatsheets' | 'exam' | 'pomodoro' | 'desktop') => void;
  studentName: string;
  programName: string;
  onOpenProfileModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  studentName,
  programName,
  onOpenProfileModal,
}) => {
  const navItems = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'schedule' as const, label: 'My schedule', icon: Calendar },
    { id: 'tasks' as const, label: 'To-do list', icon: CheckSquare },
    { id: 'cheatsheets' as const, label: 'Clutch Notes', icon: FileText },
    { id: 'exam' as const, label: 'Exam Simulator', icon: GraduationCap },
    { id: 'pomodoro' as const, label: 'Pomodoro', icon: Timer },
  ];

  const getInitials = (name: string) => {
    if (!name || name === 'Student') return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-20">
      <div>
        {/* Brand Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
              <GraduationCap className="w-4 h-4 text-slate-950" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight flex items-center">
              studyflow<span className="text-emerald-400">.</span>
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
            OFFLINE
          </span>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        {/* User Card */}
        <div
          onClick={onOpenProfileModal}
          className="flex items-center gap-3 px-1 pt-1 cursor-pointer hover:bg-slate-800/40 p-1 rounded-xl transition-colors group"
          title="Click to edit student profile"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
            {getInitials(studentName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-200 truncate flex items-center justify-between">
              <span className="truncate">{studentName || 'Student'}</span>
              <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 shrink-0" />
            </div>
            <div className="text-[11px] text-slate-500 truncate">{programName || 'College Program'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
