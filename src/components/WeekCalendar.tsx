import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Trash2 } from 'lucide-react';
import { Course } from '../types';
import { courseOccursOn, formatTime12, formatWeekRange, getWeekDays } from '../lib/dates';
import { useToday } from '../lib/useToday';

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
  onDeleteCourse?: (id: string) => void;
}

export const WeekCalendar: React.FC<WeekCalendarProps> = ({ courses, compact = false, onDeleteCourse }) => {
  const today = useToday();
  const [weekOffset, setWeekOffset] = useState(0);
  const days = getWeekDays(today, weekOffset);

  return (
    <div className="space-y-3">
      {/* Week interval navigator */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span className="font-bold text-gray-800">{formatWeekRange(days)}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="p-1 rounded hover:bg-gray-100 text-gray-400"
            title="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-semibold text-[11px]"
          >
            Today
          </button>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            className="p-1 rounded hover:bg-gray-100 text-gray-400"
            title="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7 Day Columns Grid */}
      <div className="overflow-x-auto">
        <div className={`grid grid-cols-7 gap-2 pt-1 ${compact ? 'min-w-[760px]' : 'min-w-[760px] min-h-[380px]'}`}>
          {days.map((day) => {
            const dayCourses = courses
              .filter((c) => courseOccursOn(c, day))
              .sort((a, b) => a.startTime.localeCompare(b.startTime));
            return (
              <div key={day.iso} className="min-w-[100px] flex flex-col space-y-2">
                <div
                  className={`py-2 px-3 rounded-xl text-center transition-all ${
                    day.isToday
                      ? 'bg-emerald-800 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-700 border border-gray-100'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                    {day.name}
                  </div>
                  <div className="text-base font-black leading-none mt-0.5">
                    {day.dayNum}
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  {dayCourses.map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200/80 transition-all text-left shadow-2xs relative group ${
                        compact ? 'p-2' : 'p-3'
                      }`}
                      style={{ borderLeftColor: c.color, borderLeftWidth: '4px' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400 font-medium block">
                          {formatTime12(c.startTime)}{compact ? '' : ` - ${formatTime12(c.endTime)}`}
                        </span>
                        {onDeleteCourse && (
                          <button
                            onClick={() => onDeleteCourse(c.id)}
                            title="Remove course"
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-rose-500 rounded transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-gray-900 mt-0.5 truncate">
                        {c.title}
                      </h4>
                      {!compact && (
                        <>
                          <div className="text-[10px] text-gray-500 font-mono mt-0.5">{c.code}</div>
                          {boundsLabel(c) && (
                            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                              {boundsLabel(c)}
                            </div>
                          )}
                          {c.room && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1.5">
                              <MapPin className="w-2.5 h-2.5 text-gray-400" />
                              <span className="truncate">{c.room}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                  {dayCourses.length === 0 && (
                    <div
                      className={`rounded-xl border border-dashed border-gray-200 flex items-center justify-center text-[10px] text-gray-400 ${
                        compact ? 'h-14' : 'h-28'
                      }`}
                    >
                      No class
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
