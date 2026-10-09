import React from 'react';
import {
  Calendar,
  CheckSquare,
  ArrowRight,
  Check,
  ChevronRight,
  FileText,
  Timer,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { Course, Task } from '../types';
import { PRIORITY_LABELS } from '../lib/priority';
import { courseOccursOn, formatLongDate, getWeekDays, toISODate } from '../lib/dates';
import { useToday } from '../lib/useToday';
import { usePomodoro } from '../lib/usePomodoro';
import { MODE_LABELS, formatTime } from '../lib/pomodoro';
import { WeekCalendar } from './WeekCalendar';

interface OverviewViewProps {
  courses: Course[];
  tasks: Task[];
  cheatsheetsCount: number;
  studentName: string;
  searchQuery?: string;
  onNavigateTab: (tab: 'schedule' | 'tasks' | 'cheatsheets' | 'exam' | 'desktop' | 'pomodoro') => void;
  onToggleTask: (id: string) => void;
  pomodoro: ReturnType<typeof usePomodoro>;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  courses,
  tasks,
  cheatsheetsCount,
  studentName,
  searchQuery = '',
  onNavigateTab,
  onToggleTask,
  pomodoro,
}) => {
  const today = useToday();
  const openTasks = tasks.filter((t) => !t.completed);

  const filteredCourses = searchQuery.trim()
    ? courses.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : courses;

  const filteredTasks = searchQuery.trim()
    ? tasks.filter((t) => !t.completed && t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : openTasks;

  const todayItem = getWeekDays(today, 0).find((d) => d.iso === toISODate(today))!;
  const classesToday = filteredCourses.filter((c) => courseOccursOn(c, todayItem));

  const displayName = studentName && studentName !== 'Student' ? studentName : 'Student';

  const { mode, status, remainingSec, start, pause, resume, reset } = pomodoro;
  const primaryAction = status === 'running' ? pause : status === 'paused' ? resume : start;
  const primaryLabel = status === 'running' ? 'Pause' : status === 'paused' ? 'Resume' : 'Start';
  const PrimaryIcon = status === 'running' ? Pause : Play;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Your dashboard
        </h1>
      </div>

      {/* Greeting Banner */}
      <div className="rounded-2xl bg-emerald-950 text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md border border-emerald-900">
        <div className="space-y-2">
          <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
            {formatLongDate(today)}
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Welcome, {displayName}
          </h2>
          <p className="text-xs md:text-sm text-emerald-200/90 max-w-xl">
            {courses.length > 0 ? (
              <>
                You have <strong className="text-white">{classesToday.length} classes scheduled today</strong> and{' '}
                <strong className="text-white">{openTasks.length} pending tasks</strong>.
              </>
            ) : (
              <>
                Your personal offline academic workspace. Add your classes in My Schedule with the AI Schedule Assistant to get started.
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('schedule')}
          className="px-5 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 self-start md:self-center transition-all shadow-sm"
        >
          View my schedule
          <ArrowRight className="w-4 h-4 text-emerald-300" />
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Classes today */}
        <div
          onClick={() => onNavigateTab('schedule')}
          className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-gray-300 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Enrolled Subjects</span>
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-gray-900">
              {String(courses.length).padStart(2, '0')}
            </span>
            <span className="text-xs text-emerald-600 font-medium block mt-1">
              {courses.length > 0
                ? `${classesToday.length} classes scheduled today`
                : 'Click to open your schedule'}
            </span>
          </div>
        </div>

        {/* Tasks to do */}
        <div
          onClick={() => onNavigateTab('tasks')}
          className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-gray-300 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Tasks to do</span>
            <CheckSquare className="w-4 h-4 text-gray-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-gray-900">
              {String(openTasks.length).padStart(2, '0')}
            </span>
            <span className="text-xs text-amber-600 font-medium block mt-1">
              {openTasks.length > 0 ? `${openTasks.length} pending tasks` : 'All tasks completed'}
            </span>
          </div>
        </div>

        {/* Clutch Notes */}
        <div
          onClick={() => onNavigateTab('cheatsheets')}
          className="p-5 rounded-2xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-gray-300 transition-all"
        >
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span>Clutch Notes</span>
            <FileText className="w-4 h-4 text-gray-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-black text-gray-900">
              {String(cheatsheetsCount).padStart(2, '0')}
            </span>
            <span className="text-xs text-gray-400 font-medium block mt-1">
              {cheatsheetsCount > 0 ? `${cheatsheetsCount} saved Clutch Notes` : 'Upload notes to generate'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Two Columns: Weekly Schedule & To-Do List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Weekly Schedule Preview */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h3 className="font-black text-sm text-gray-900">Weekly schedule</h3>
            </div>
            <button
              onClick={() => onNavigateTab('schedule')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
            >
              Open schedule
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <WeekCalendar courses={filteredCourses} compact />

          {courses.length === 0 && (
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
              <span className="text-gray-600">
                You haven't added your schedule yet.
              </span>
              <button
                onClick={() => onNavigateTab('schedule')}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1"
              >
                Open My Schedule
              </button>
            </div>
          )}
        </div>

        {/* Right Column: To-Do List + Pomodoro */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <h3 className="font-black text-sm text-gray-900">To-do list</h3>
              </div>
              <button
                onClick={() => onNavigateTab('tasks')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
              >
                Open
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tasks list */}
            <div className="divide-y divide-gray-100 mt-2 space-y-1">
              {filteredTasks.slice(0, 6).map((task) => (
                <div
                  key={task.id}
                  className="py-2.5 flex items-start justify-between gap-2.5 text-xs group"
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                        task.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-gray-300 hover:border-emerald-500'
                      }`}
                    >
                      {task.completed && <Check className="w-3 h-3" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`font-semibold block truncate ${
                          task.completed ? 'line-through text-gray-400' : 'text-gray-800'
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.courseName && (
                        <span className="text-[10px] text-gray-400 block truncate">
                          {task.courseName}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      task.priority === 'High'
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : task.priority === 'Medium'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </div>
              ))}
              {filteredTasks.length === 0 && (
                <div className="py-6 text-center text-xs text-gray-400">
                  No pending tasks.
                </div>
              )}
            </div>
          </div>

          {/* Pomodoro widget */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-emerald-600" />
                <h3 className="font-black text-sm text-gray-900">Pomodoro</h3>
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                {MODE_LABELS[mode]}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-black text-gray-900 tabular-nums">
                {formatTime(remainingSec)}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={primaryAction}
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <PrimaryIcon className="w-3.5 h-3.5" />
                  {primaryLabel}
                </button>
                <button
                  onClick={reset}
                  title="Reset"
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('pomodoro')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              Open timer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
