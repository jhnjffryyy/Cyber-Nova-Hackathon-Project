import React from 'react';
import { CalendarDays, Plus, Timer, RotateCcw, Play, Pause } from 'lucide-react';
import { Cheatsheet, Course, Exam, ExamAttempt, Task } from '../types';
import {
  courseOccursOn,
  formatShortDate,
  formatTime12,
  getWeekDays,
  toISODate,
} from '../lib/dates';
import { useToday } from '../lib/useToday';
import { usePomodoro } from '../lib/usePomodoro';
import { MODE_LABELS, durationSeconds, formatTime } from '../lib/pomodoro';
import { scoreTone } from '../lib/score';
import { TabId } from '../lib/navigation';
import { cn } from '../lib/cn';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  IconButton,
  PageHeader,
  ProgressBar,
  Stat,
  TaskCheck,
  cardClass,
  cardInteractiveClass,
} from './ui';

interface OverviewViewProps {
  courses: Course[];
  tasks: Task[];
  cheatsheets: Cheatsheet[];
  exams: Exam[];
  attempts: ExamAttempt[];
  studentName: string;
  searchQuery?: string;
  onNavigateTab: (tab: TabId) => void;
  onToggleTask: (id: string) => void;
  onOpenCheatsheet: (id: string) => void;
  onOpenAttempt: (id: string) => void;
  pomodoro: ReturnType<typeof usePomodoro>;
}

const isoPlusDays = (iso: string, days: number): string => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

const relativeDue = (dueIso: string, todayIso: string): string => {
  if (dueIso === isoPlusDays(todayIso, -1)) return 'Yesterday';
  if (dueIso === todayIso) return 'Today';
  if (dueIso === isoPlusDays(todayIso, 1)) return 'Tomorrow';
  const d = new Date(dueIso + 'T00:00:00');
  if (dueIso <= isoPlusDays(todayIso, 6)) {
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const OverviewView: React.FC<OverviewViewProps> = ({
  courses,
  tasks,
  cheatsheets,
  attempts,
  studentName,
  searchQuery = '',
  onNavigateTab,
  onToggleTask,
  onOpenCheatsheet,
  onOpenAttempt,
  pomodoro,
}) => {
  const today = useToday();
  const todayIso = toISODate(today);
  const weekEndIso = isoPlusDays(todayIso, 7);
  const openTasks = tasks.filter((t) => !t.completed);

  const filteredCourses = searchQuery.trim()
    ? courses.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : courses;

  const filteredOpenTasks = searchQuery.trim()
    ? openTasks.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : openTasks;

  const todayItem = getWeekDays(today, 0).find((d) => d.iso === todayIso)!;
  const classesToday = filteredCourses
    .filter((c) => courseOccursOn(c, todayItem))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Class status relative to the current time
  const nowHHMM = `${String(today.getHours()).padStart(2, '0')}:${String(
    today.getMinutes()
  ).padStart(2, '0')}`;
  const firstUpcomingIdx = classesToday.findIndex((c) => c.startTime > nowHHMM);

  // Task buckets
  const overdue = filteredOpenTasks.filter((t) => t.dueDate && t.dueDate < todayIso);
  const dueToday = filteredOpenTasks.filter((t) => t.dueDate === todayIso);
  const thisWeek = filteredOpenTasks.filter(
    (t) => t.dueDate > todayIso && t.dueDate <= weekEndIso
  );
  const shownTasks = [...overdue, ...dueToday, ...thisWeek].slice(0, 6);
  const moreOpen = filteredOpenTasks.length - shownTasks.length;

  // Greeting
  const hour = today.getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName =
    studentName && studentName !== 'Student' ? studentName.trim().split(/\s+/)[0] : '';

  const summaryParts: string[] = [];
  if (classesToday.length > 0)
    summaryParts.push(`${classesToday.length} class${classesToday.length === 1 ? '' : 'es'} today`);
  if (dueToday.length > 0)
    summaryParts.push(`${dueToday.length} task${dueToday.length === 1 ? '' : 's'} due today`);
  if (overdue.length > 0) summaryParts.push(`${overdue.length} overdue`);

  // Study progress
  const doneTasks = tasks.filter((t) => t.completed).length;
  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)
      : null;
  const recentAttempts = [...attempts]
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 3);
  const recentSheets = [...cheatsheets]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);

  // Pomodoro
  const { mode, status, remainingSec, start, pause, resume, reset, settings, completedFocus } =
    pomodoro;
  const primaryAction = status === 'running' ? pause : status === 'paused' ? resume : start;
  const primaryLabel = status === 'running' ? 'Pause' : status === 'paused' ? 'Resume' : 'Start';
  const PrimaryIcon = status === 'running' ? Pause : Play;
  const pomodoroProgress = 1 - remainingSec / durationSeconds(mode, settings);

  const renderTaskRow = (task: Task) => (
    <div key={task.id} className="flex items-center gap-2.5 py-2">
      <TaskCheck
        checked={task.completed}
        label={`Mark ${task.title} complete`}
        onToggle={() => onToggleTask(task.id)}
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-ink block truncate">{task.title}</span>
        <span className="text-[13px] text-ink-3 block truncate">
          {[task.courseName, task.dueDate ? relativeDue(task.dueDate, todayIso) : null]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </div>
      {task.priority === 'High' && (
        <Badge tone="danger" dot>
          High
        </Badge>
      )}
    </div>
  );

  const taskGroup = (
    label: string,
    tone: 'danger' | 'warning' | 'neutral',
    list: Task[]
  ) => (
    <div key={label}>
      <div className="flex items-center gap-2 text-xs font-medium text-ink-2 mb-1">
        <Badge tone={tone}>{list.length}</Badge>
        {label}
      </div>
      {list.map(renderTaskRow)}
    </div>
  );

  return (
    <div>
      <PageHeader
        title={firstName ? `${greeting}, ${firstName}` : greeting}
        description={`${formatShortDate(today)} · ${
          summaryParts.length > 0 ? summaryParts.join(' · ') : 'Nothing due today'
        }`}
        actions={
          <>
            <Button variant="secondary" onClick={() => onNavigateTab('schedule')}>
              Add class
            </Button>
            <Button icon={Plus} onClick={() => onNavigateTab('tasks')}>
              New task
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:gap-6 lg:grid-cols-12 items-start">
        {/* Today's classes */}
        <Card className="lg:col-span-7">
          <CardHeader
            title="Today's classes"
            action={
              <Button variant="ghost" size="sm" onClick={() => onNavigateTab('schedule')}>
                Open schedule
              </Button>
            }
          />
          {classesToday.length === 0 ? (
            <EmptyState
              compact
              icon={CalendarDays}
              title="No classes today"
              description="Classes you add to your schedule appear here."
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigateTab('schedule')}
                >
                  Open schedule
                </Button>
              }
            />
          ) : (
            <div>
              {classesToday.map((course, i) => {
                const inProgress = course.startTime <= nowHHMM && nowHHMM <= course.endTime;
                const ended = course.endTime < nowHHMM;
                const isNext = i === firstUpcomingIdx;
                return (
                  <div
                    key={course.id}
                    className={cn('flex gap-3 py-3 border-b border-line last:border-0', ended && 'opacity-60')}
                  >
                    <span
                      className="w-1 self-stretch rounded-full shrink-0"
                      style={{ backgroundColor: course.color }}
                      aria-hidden
                    />
                    <div className="w-20 text-[13px] tabular-nums text-ink-2 shrink-0">
                      <div>{formatTime12(course.startTime)}</div>
                      <div>{formatTime12(course.endTime)}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">
                        {course.title}
                      </div>
                      <div className="text-[13px] text-ink-3 truncate">
                        {[course.code, course.room, course.instructor]
                          .filter(Boolean)
                          .join(' · ')}
                      </div>
                    </div>
                    {inProgress && (
                      <Badge tone="accent" dot className="self-center shrink-0">
                        Now
                      </Badge>
                    )}
                    {isNext && !inProgress && (
                      <Badge tone="neutral" className="self-center shrink-0">
                        Next
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Tasks */}
        <Card className="lg:col-span-5">
          <CardHeader
            title="Tasks"
            action={
              <Button variant="ghost" size="sm" onClick={() => onNavigateTab('tasks')}>
                View all
              </Button>
            }
          />
          {tasks.length === 0 ? (
            <EmptyState
              compact
              icon={CalendarDays}
              title="No tasks yet"
              action={
                <Button size="sm" icon={Plus} onClick={() => onNavigateTab('tasks')}>
                  Add a task
                </Button>
              }
            />
          ) : openTasks.length === 0 ? (
            <EmptyState
              compact
              icon={CalendarDays}
              title="You're all caught up"
            />
          ) : shownTasks.length === 0 ? (
            <EmptyState
              compact
              icon={CalendarDays}
              title="Nothing due this week"
              description={`${openTasks.length} open task${openTasks.length === 1 ? '' : 's'} later`}
            />
          ) : (
            <div className="space-y-3">
              {overdue.length > 0 && taskGroup('Overdue', 'danger', overdue)}
              {dueToday.length > 0 && taskGroup('Due today', 'warning', dueToday)}
              {thisWeek.length > 0 && taskGroup('This week', 'neutral', thisWeek)}
              {moreOpen > 0 && (
                <p className="text-xs text-ink-3">+{moreOpen} more open tasks</p>
              )}
            </div>
          )}
        </Card>

        {/* Study progress */}
        <Card className="lg:col-span-4">
          <CardHeader title="Study progress" />
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Stat
                label="Tasks completed"
                value={`${doneTasks}/${tasks.length}`}
                hint={tasks.length === 0 ? 'No tasks yet' : undefined}
              />
              {tasks.length > 0 && (
                <div className="mt-2">
                  <ProgressBar
                    value={tasks.length > 0 ? doneTasks / tasks.length : 0}
                    label="Tasks completed"
                  />
                </div>
              )}
            </div>
            <Stat label="Exam attempts" value={attempts.length} />
            <Stat label="Clutch Notes" value={cheatsheets.length} />
            <div className="col-span-2">
              <Stat
                label="Average score"
                value={avgScore !== null ? `${avgScore}%` : '—'}
                hint={
                  attempts.length === 0
                    ? 'Take an exam to see your average'
                    : undefined
                }
                tone={avgScore !== null ? scoreTone(avgScore) : undefined}
              />
            </div>
          </div>
        </Card>

        {/* Recent exam results */}
        <Card className="lg:col-span-4">
          <CardHeader
            title="Recent exam results"
            action={
              <Button variant="ghost" size="sm" onClick={() => onNavigateTab('history')}>
                History
              </Button>
            }
          />
          {recentAttempts.length === 0 ? (
            <EmptyState
              compact
              icon={Timer}
              title="No exam attempts yet"
              action={
                <Button size="sm" onClick={() => onNavigateTab('exam')}>
                  Start an exam
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-line">
              {recentAttempts.map((att) => (
                <button
                  key={att.id}
                  type="button"
                  onClick={() => onOpenAttempt(att.id)}
                  className="w-full flex items-center gap-3 -mx-2 px-2 py-3 rounded-control text-left hover:bg-subtle transition-[background-color] duration-150"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">
                      {att.examTitle}
                    </div>
                    <div className="text-[13px] text-ink-3 truncate">
                      {[
                        att.courseName,
                        new Date(att.completedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        }),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  </div>
                  <Badge tone={scoreTone(att.percentage)}>{att.percentage}%</Badge>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Focus timer */}
        <Card className="lg:col-span-4">
          <CardHeader
            title="Pomodoro"
            icon={Timer}
            action={
              <Button variant="ghost" size="sm" onClick={() => onNavigateTab('pomodoro')}>
                Open timer
              </Button>
            }
          />
          <div className="flex items-center justify-between mb-2">
            <Badge tone={mode === 'focus' ? 'accent' : 'info'}>{MODE_LABELS[mode]}</Badge>
          </div>
          <div className="font-display text-4xl font-semibold tabular-nums text-ink">
            {formatTime(remainingSec)}
          </div>
          <div className="mt-3">
            <ProgressBar value={pomodoroProgress} label="Session progress" />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button icon={PrimaryIcon} size="sm" onClick={primaryAction}>
              {primaryLabel}
            </Button>
            <IconButton icon={RotateCcw} label="Reset timer" onClick={reset} variant="secondary" />
          </div>
          <p className="text-[13px] text-ink-3 mt-3">
            {completedFocus} focus session{completedFocus === 1 ? '' : 's'} completed
            since the app opened
          </p>
        </Card>

        {/* Recent Clutch Notes */}
        <Card className="lg:col-span-12">
          <CardHeader
            title="Recent Clutch Notes"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigateTab('cheatsheets')}
              >
                Open library
              </Button>
            }
          />
          {recentSheets.length === 0 ? (
            <EmptyState
              compact
              icon={CalendarDays}
              title="No Clutch Notes yet"
              action={
                <Button
                  size="sm"
                  onClick={() => onNavigateTab('cheatsheets')}
                >
                  Create Clutch Notes
                </Button>
              }
            />
          ) : (
            <div className="grid sm:grid-cols-3 gap-3">
              {recentSheets.map((sheet) => (
                <button
                  key={sheet.id}
                  type="button"
                  onClick={() => onOpenCheatsheet(sheet.id)}
                  className={cn(cardClass, cardInteractiveClass, 'p-4')}
                >
                  <div className="text-xs text-accent-ink font-medium">
                    {sheet.courseName}
                  </div>
                  <div className="text-sm font-semibold text-ink line-clamp-2 mt-1">
                    {sheet.title}
                  </div>
                  <div className="text-[13px] text-ink-3 mt-2">
                    {sheet.sections.length} sections · {sheet.keyTerms.length} key
                    terms ·{' '}
                    {new Date(sheet.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
