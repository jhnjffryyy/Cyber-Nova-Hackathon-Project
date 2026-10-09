import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Trash2 } from 'lucide-react';
import { Course } from '../types';
import { courseOccursOn, formatTime12, formatWeekRange, getWeekDays } from '../lib/dates';
import { useToday } from '../lib/useToday';
import { cn } from '../lib/cn';
import { Badge, Button, IconButton } from './ui';

const fmtBound = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

function boundsLabel(c: Course): string | null {
  if (c.startDate && c.endDate) return `${fmtBound(c.startDate)} - ${fmtBound(c.endDate)}`;
  if (c.endDate) return `Until ${fmtBound(c.endDate)}`;
  if (c.startDate) return `From ${fmtBound(c.startDate)}`;
  return null;
}

interface WeekCalendarProps {
  courses: Course[];
  compact?: boolean;
  subjectCount?: number;
  onRequestDelete?: (course: Course) => void;
}

export const WeekCalendar: React.FC<WeekCalendarProps> = ({
  courses,
  compact = false,
  subjectCount,
  onRequestDelete,
}) => {
  const today = useToday();
  const [weekOffset, setWeekOffset] = useState(0);
  const days = getWeekDays(today, weekOffset);
  const hasClassesThisWeek = days.some((d) => courses.some((c) => courseOccursOn(c, d)));

  const deleteButton = (c: Course) =>
    onRequestDelete ? (
      <IconButton
        icon={Trash2}
        label={`Remove ${c.title}`}
        size="sm"
        onClick={() => onRequestDelete(c)}
        className="lg:opacity-0 lg:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
      />
    ) : null;

  return (
    <div className="space-y-4">
      {/* Week header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-ink">{formatWeekRange(days)}</span>
          {subjectCount !== undefined && (
            <Badge tone="neutral">
              {subjectCount} subject{subjectCount === 1 ? '' : 's'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            icon={ChevronLeft}
            label="Previous week"
            size="sm"
            onClick={() => setWeekOffset(weekOffset - 1)}
          />
          <Button
            variant="secondary"
            size="sm"
            disabled={weekOffset === 0}
            onClick={() => setWeekOffset(0)}
          >
            This week
          </Button>
          <IconButton
            icon={ChevronRight}
            label="Next week"
            size="sm"
            onClick={() => setWeekOffset(weekOffset + 1)}
          />
        </div>
      </div>

      {/* md+: 7-column grid */}
      <div className="hidden md:block overflow-x-auto">
        <div className={cn('grid grid-cols-7 gap-2', 'min-w-[760px]')}>
          {days.map((day) => {
            const dayCourses = courses
              .filter((c) => courseOccursOn(c, day))
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            return (
              <div key={day.iso} className="min-w-0 flex flex-col space-y-2">
                <div
                  className={cn(
                    'rounded-control py-2 text-center',
                    day.isToday ? 'bg-accent-soft text-accent-ink' : 'bg-subtle text-ink-2'
                  )}
                >
                  <div className="text-xs font-medium">{day.name}</div>
                  <div className="font-display text-lg font-semibold tabular-nums">
                    {day.dayNum}
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  {dayCourses.map((c) => (
                    <div
                      key={c.id}
                      className="group relative rounded-control border border-line bg-surface p-3 pl-4 shadow-card"
                    >
                      <span
                        className="absolute inset-y-2 left-1.5 w-[3px] rounded-full"
                        style={{ backgroundColor: c.color }}
                        aria-hidden
                      />
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs text-ink-3 tabular-nums">
                          {formatTime12(c.startTime)}
                          {compact ? '' : ` – ${formatTime12(c.endTime)}`}
                        </span>
                        {deleteButton(c)}
                      </div>
                      <h4 className="text-[13px] font-medium text-ink line-clamp-2 mt-0.5">
                        {c.title}
                      </h4>
                      {!compact && (
                        <>
                          <div className="text-xs text-ink-3 mt-0.5">{c.code}</div>
                          {boundsLabel(c) && (
                            <div className="text-xs text-accent-ink mt-0.5">
                              {boundsLabel(c)}
                            </div>
                          )}
                          {c.room && (
                            <div className="flex items-center gap-1 text-xs text-ink-2 mt-1.5">
                              <MapPin className="w-3 h-3 text-ink-3" aria-hidden />
                              <span className="truncate">{c.room}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  {dayCourses.length === 0 && (
                    <div
                      className={cn(
                        'rounded-control border border-dashed border-line grid place-items-center text-xs text-ink-3',
                        compact ? 'h-14' : 'h-24'
                      )}
                    >
                      No classes
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* < md: agenda list */}
      <div className="md:hidden space-y-4">
        {!hasClassesThisWeek ? (
          <p className="text-sm text-ink-3">No classes this week.</p>
        ) : (
          days.map((day) => {
            const dayCourses = courses
              .filter((c) => courseOccursOn(c, day))
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            if (dayCourses.length === 0) return null;
            return (
              <div key={day.iso}>
                <div className="flex items-center gap-2 text-[13px] font-medium text-ink-2 mb-2">
                  {day.name} {day.dayNum}
                  {day.isToday && <Badge tone="accent">Today</Badge>}
                </div>
                <div className="space-y-1">
                  {dayCourses.map((c) => (
                    <div key={c.id} className="group flex gap-3 py-2">
                      <span
                        className="w-1 self-stretch rounded-full shrink-0"
                        style={{ backgroundColor: c.color }}
                        aria-hidden
                      />
                      <div className="w-16 text-[13px] tabular-nums text-ink-2 shrink-0">
                        <div>{formatTime12(c.startTime)}</div>
                        <div>{formatTime12(c.endTime)}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-ink truncate">{c.title}</div>
                        <div className="text-[13px] text-ink-3 truncate">
                          {[c.code, c.room].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      {deleteButton(c)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
