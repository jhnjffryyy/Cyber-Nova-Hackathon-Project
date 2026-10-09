import { Course } from '../types';

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
export type DayName = (typeof DAY_NAMES)[number];

const MONTH_NAMES = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

export interface WeekDayItem {
  name: DayName;
  date: Date;
  iso: string;
  dayNum: number;
  isToday: boolean;
}

// Local YYYY-MM-DD (never toISOString, which is UTC)
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function weekdayName(d: Date): DayName {
  // getDay(): 0 = Sunday
  return DAY_NAMES[(d.getDay() + 6) % 7];
}

export function startOfWeek(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (out.getDay() + 6) % 7; // Monday = 0
  out.setDate(out.getDate() - dow);
  return out;
}

export function getWeekDays(now: Date, weekOffset: number): WeekDayItem[] {
  const monday = startOfWeek(now);
  monday.setDate(monday.getDate() + weekOffset * 7);
  const todayIso = toISODate(now);
  const items: WeekDayItem[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    items.push({
      name: DAY_NAMES[i],
      date,
      iso: toISODate(date),
      dayNum: date.getDate(),
      isToday: toISODate(date) === todayIso,
    });
  }
  return items;
}

export function formatWeekRange(days: WeekDayItem[]): string {
  const first = days[0].date;
  const last = days[6].date;
  const mA = MONTH_NAMES[first.getMonth()].slice(0, 3);
  const mB = MONTH_NAMES[last.getMonth()].slice(0, 3);
  if (first.getFullYear() !== last.getFullYear()) {
    return `${mA} ${first.getDate()}, ${first.getFullYear()} - ${mB} ${last.getDate()}, ${last.getFullYear()}`;
  }
  if (first.getMonth() !== last.getMonth()) {
    return `${mA} ${first.getDate()} - ${mB} ${last.getDate()}, ${last.getFullYear()}`;
  }
  return `${mA} ${first.getDate()} - ${mB} ${last.getDate()}, ${last.getFullYear()}`;
}

const FULL_DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const SHORT_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function formatLongDate(d: Date): string {
  return `${FULL_DAYS[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

export function formatShortDate(d: Date): string {
  const month = MONTH_NAMES[d.getMonth()].slice(0, 3);
  const cap = month.charAt(0) + month.slice(1).toLowerCase();
  return `${SHORT_DAYS[d.getDay()]}, ${cap} ${d.getDate()}`;
}

export function formatTime12(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isNaN(h) || isNaN(m)) return hhmm;
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function courseOccursOn(course: Course, dayItem: WeekDayItem): boolean {
  if (course.date) return course.date === dayItem.iso;
  if (!course.days.includes(dayItem.name)) return false;
  if (course.startDate && dayItem.iso < course.startDate) return false;
  if (course.endDate && dayItem.iso > course.endDate) return false;
  return true;
}

// Enumerates the ISO dates a course occurs on. Bounded weekly courses list
// every matching day in [startDate, endDate]; unbounded ones and courses
// without a start date enumerate forward from today, capped at maxCount.
export function listOccurrences(course: Course, maxCount = 52): string[] {
  if (course.date) return [course.date];
  const fromIso = course.startDate || toISODate(new Date());
  const toIso = course.endDate || toISODate(new Date(new Date().getFullYear() + 1, 11, 31));
  const out: string[] = [];
  const cur = new Date(fromIso + 'T00:00:00');
  while (out.length < maxCount) {
    const iso = toISODate(cur);
    if (iso > toIso) break;
    if (course.days.includes(weekdayName(cur))) out.push(iso);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}
