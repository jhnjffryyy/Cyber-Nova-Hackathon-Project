import { Course } from '../types';
import { DAY_NAMES, formatTime12, listOccurrences, startOfWeek, toISODate, weekdayName } from './dates';

export interface ScheduleDraft {
  title?: string;
  days?: string[];
  date?: string;
  recurrence?: 'weekly' | 'once';
  startTime?: string;
  endTime?: string;
  room?: string;
  instructor?: string;
  pendingHour?: { h: number; m: number };
  todayFlag?: boolean;
  startDate?: string;
  endDate?: string;
  countN?: number;
  countUnit?: 'weeks' | 'days' | 'times';
  pendingMonthYear?: { month: number; year: number };
}

export type Awaiting = 'title' | 'day' | 'time' | 'ampm' | 'recurrence' | 'endTime' | 'conflict' | 'date';

export interface PendingState {
  draft: ScheduleDraft;
  awaiting: Awaiting;
}

export type AssistantResult =
  | { kind: 'ask'; message: string; pending: PendingState }
  | { kind: 'add'; message: string; course: Course }
  | { kind: 'info'; message: string };

const COLORS = ['#3B82F6', '#06B6D4', '#F59E0B', '#8B5CF6', '#10B981', '#EC4899', '#EF4444'];

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
const MONTH_RE =
  '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?';

const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DAY_ALIASES: [RegExp, number][] = [
  [/\bmondays?\b|\bmon\b/i, 0],
  [/\btuesdays?\b|\btues?\b/i, 1],
  [/\bwednesdays?\b|\bwed\b/i, 2],
  [/\bthursdays?\b|\bthurs?\b|\bthur?\b/i, 3],
  [/\bfridays?\b|\bfri\b/i, 4],
  [/\bsaturdays?\b|\bsat\b/i, 5],
  [/\bsundays?\b|\bsun\b/i, 6],
];

interface ParsedFields {
  title?: string;
  days?: number[];
  date?: string;
  dateIsPast?: boolean;
  todayExplicit?: boolean;
  recurrence?: 'weekly' | 'once';
  startTime?: string;
  endTime?: string;
  pendingHour?: { h: number; m: number };
  invalidTime?: boolean;
  durationMin?: number;
  room?: string;
  instructor?: string;
  startDate?: string;
  endDate?: string;
  countN?: number;
  countUnit?: 'weeks' | 'days' | 'times';
  invalidDate?: boolean;
  monthAsk?: { month: number; year: number };
  periodUnconsumed?: boolean;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toHHMM(h: number, m: number): string {
  return `${pad2(h)}:${pad2(m)}`;
}

function applyAmPm(h: number, ampm: 'am' | 'pm'): number {
  if (ampm === 'pm') return h === 12 ? 12 : h + 12;
  return h === 12 ? 0 : h;
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function nextOccurrence(dayIdx: number, now: Date, strict: boolean): Date {
  const todayIdx = (now.getDay() + 6) % 7;
  let diff = (dayIdx - todayIdx + 7) % 7;
  if (strict && diff === 0) diff = 7;
  return addDays(now, diff);
}

function isoInFutureOrToday(iso: string, now: Date): boolean {
  return iso >= toISODate(now);
}

function maskSpans(s: string, spans: [number, number][]): string {
  const chars = s.split('');
  for (const [a, b] of spans) for (let i = a; i < b; i++) chars[i] = ' ';
  return chars.join('');
}

function monthIndex(token: string): number {
  const t = token.toLowerCase().replace('.', '');
  for (let i = 0; i < MONTHS.length; i++) {
    const m = MONTHS[i];
    if (t === m || m.startsWith(t) || (t === 'sept' && i === 8)) return i;
  }
  return -1;
}

function adjustOnceDateForPassedTime(iso: string, now: Date, startTime?: string): string {
  if (iso === toISODate(now) && startTime && toMin(startTime) < now.getHours() * 60 + now.getMinutes()) {
    return toISODate(addDays(now, 7));
  }
  return iso;
}

function parseDates(text: string, now: Date): { date?: string; dateIsPast?: boolean; todayExplicit?: boolean; spans: [number, number][] } {
  const spans: [number, number][] = [];
  const todayIso = toISODate(now);

  const set = (d: Date, explicitYear: boolean, span: [number, number], out: { v?: { date: string; past: boolean } }) => {
    const d2 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    let past = false;
    if (explicitYear && toISODate(d2) < todayIso) past = true;
    out.v = { date: toISODate(d2), past };
    spans.push(span);
  };

  const out: { v?: { date: string; past: boolean } } = {};

  // ISO YYYY-MM-DD
  {
    const re = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
    let m;
    while ((m = re.exec(text))) {
      const d = new Date(+m[1], +m[2] - 1, +m[3]);
      set(d, true, [m.index, m.index + m[0].length], out);
    }
  }
  // M/D or M/D/YYYY
  {
    const re = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/g;
    let m;
    while ((m = re.exec(text))) {
      const month = +m[1];
      const day = +m[2];
      if (month < 1 || month > 12 || day < 1 || day > 31) continue;
      let year = now.getFullYear();
      const explicitYear = !!m[3];
      if (explicitYear) year = +m[3] < 100 ? 2000 + +m[3] : +m[3];
      let d = new Date(year, month - 1, day);
      if (!explicitYear && toISODate(d) < todayIso) d = new Date(year + 1, month - 1, day);
      set(d, explicitYear, [m.index, m.index + m[0].length], out);
    }
  }
  // "October 15" / "October 15th" / "Oct 15, 2027"
  {
    const re = new RegExp(`\\b(${MONTH_RE})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s*,?\\s*(\\d{4}))?\\b`, 'gi');
    let m;
    while ((m = re.exec(text))) {
      const mi = monthIndex(m[1]);
      const day = +m[2];
      if (mi < 0 || day < 1 || day > 31) continue;
      const explicitYear = !!m[3];
      let year = explicitYear ? +m[3] : now.getFullYear();
      let d = new Date(year, mi, day);
      if (!explicitYear && toISODate(d) < todayIso) d = new Date(year + 1, mi, day);
      set(d, explicitYear, [m.index, m.index + m[0].length], out);
    }
  }
  // "15 October" / "15th of October"
  {
    const re = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_RE})(?:\\s*,?\\s*(\\d{4}))?\\b`, 'gi');
    let m;
    while ((m = re.exec(text))) {
      const day = +m[1];
      const mi = monthIndex(m[2]);
      if (mi < 0 || day < 1 || day > 31) continue;
      const explicitYear = !!m[3];
      let year = explicitYear ? +m[3] : now.getFullYear();
      let d = new Date(year, mi, day);
      if (!explicitYear && toISODate(d) < todayIso) d = new Date(year + 1, mi, day);
      set(d, explicitYear, [m.index, m.index + m[0].length], out);
    }
  }

  if (out.v) return { date: out.v.date, dateIsPast: out.v.past, spans };

  // Relative day phrases
  {
    const m = /\btomorrow\b/i.exec(text);
    if (m) {
      return { date: toISODate(addDays(now, 1)), spans: [[m.index, m.index + m[0].length]] };
    }
  }
  {
    const m = /\btoday\b/i.exec(text);
    if (m) {
      return { date: todayIso, todayExplicit: true, spans: [[m.index, m.index + m[0].length]] };
    }
  }
  {
    const re = /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;
    let m;
    while ((m = re.exec(text))) {
      const idx = DAY_NAMES.findIndex((d) => d.toLowerCase() === m![1].slice(0, 3).toLowerCase());
      if (idx >= 0) {
        return { date: toISODate(nextOccurrence(idx, now, true)), spans: [[m.index, m.index + m[0].length]] };
      }
    }
  }
  {
    const re = /\bthis\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;
    let m;
    while ((m = re.exec(text))) {
      const idx = DAY_NAMES.findIndex((d) => d.toLowerCase() === m![1].slice(0, 3).toLowerCase());
      if (idx >= 0) {
        return { date: toISODate(nextOccurrence(idx, now, false)), spans: [[m.index, m.index + m[0].length]] };
      }
    }
  }

  return { spans };
}

const DATE_SRC = `(?:\\d{4}-\\d{2}-\\d{2}|\\d{1,2}\\/\\d{1,2}(?:\\/\\d{2,4})?|${MONTH_RE}\\s+\\d{1,2}(?:st|nd|rd|th)?(?:\\s*,?\\s*\\d{4})?|\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_RE}(?:\\s*,?\\s*\\d{4})?)`;

function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

// Parses one concrete date expression; range bounds never roll forward a year
// on their own (ambiguous cases are clarified by asking).
function parseDateExpr(expr: string, now: Date): { iso: string; valid: boolean } | null {
  const t = expr.trim();
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const y = +m[1], mo = +m[2] - 1, d = +m[3];
    const valid = mo >= 0 && mo <= 11 && d >= 1 && d <= daysInMonth(y, mo);
    return { iso: valid ? toISODate(new Date(y, mo, d)) : t, valid };
  }
  m = t.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (m) {
    const mo = +m[1] - 1, d = +m[2];
    const y = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : now.getFullYear();
    const valid = mo >= 0 && mo <= 11 && d >= 1 && d <= daysInMonth(y, mo);
    return { iso: valid ? toISODate(new Date(y, mo, d)) : t, valid };
  }
  m = t.match(new RegExp(`^(${MONTH_RE})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:\\s*,?\\s*(\\d{4}))?$`, 'i'));
  if (m) {
    const mo = monthIndex(m[1]);
    const d = +m[2];
    const y = m[3] ? +m[3] : now.getFullYear();
    const valid = mo >= 0 && d >= 1 && d <= daysInMonth(y, mo);
    return { iso: valid ? toISODate(new Date(y, mo, d)) : t, valid };
  }
  m = t.match(new RegExp(`^(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_RE})(?:\\s*,?\\s*(\\d{4}))?$`, 'i'));
  if (m) {
    const d = +m[1];
    const mo = monthIndex(m[2]);
    const y = m[3] ? +m[3] : now.getFullYear();
    const valid = mo >= 0 && d >= 1 && d <= daysInMonth(y, mo);
    return { iso: valid ? toISODate(new Date(y, mo, d)) : t, valid };
  }
  return null;
}

interface ParsedRanges {
  startDate?: string;
  endDate?: string;
  countN?: number;
  countUnit?: 'weeks' | 'days' | 'times';
  invalidDate?: boolean;
  monthAsk?: { month: number; year: number };
  spans: [number, number][];
}

// Date-range, month-window and repetition-count phrases. Runs before the
// single-date parser; its matches are masked out for everything downstream.
function parseRanges(text: string, now: Date): ParsedRanges {
  const out: ParsedRanges = { spans: [] };
  const take = (expr: string): string | undefined => {
    const r = parseDateExpr(expr, now);
    if (!r) return undefined;
    if (!r.valid) {
      out.invalidDate = true;
      return undefined;
    }
    return r.iso;
  };

  // Pair: "from X to Y", "between X and Y", "starting X until Y"
  {
    const re = new RegExp(
      `\\b(?:from|between|starting(?:\\s+on)?|beginning)\\s+(${DATE_SRC})\\s*(?:to|until|till|through|and|[-–—])\\s*(${DATE_SRC})`,
      'gi'
    );
    let m;
    while ((m = re.exec(text))) {
      const a = take(m[1]);
      const b = take(m[2]);
      if (a) out.startDate = a;
      if (b) out.endDate = b;
      out.spans.push([m.index, m.index + m[0].length]);
    }
  }
  const masked = () => maskSpans(text, out.spans);
  // End only: "until Nov 7", "through Dec 15", "ending Dec 15"
  {
    const re = new RegExp(`\\b(?:until|till|through|ending|ends)\\s+(${DATE_SRC})`, 'gi');
    let m;
    while ((m = re.exec(masked()))) {
      const b = take(m[1]);
      if (b) out.endDate = b;
      out.spans.push([m.index, m.index + m[0].length]);
    }
  }
  // Start only: "from Oct 5", "starting Nov 1"
  {
    const re = new RegExp(`\\b(?:from|starting(?:\\s+on)?|beginning)\\s+(${DATE_SRC})`, 'gi');
    let m;
    while ((m = re.exec(masked()))) {
      const a = take(m[1]);
      if (a) out.startDate = a;
      out.spans.push([m.index, m.index + m[0].length]);
    }
  }
  // Relative periods: "this week", "next week", "this month", "next month"
  {
    const re = /\b(this|next)\s+(week|month)\b/gi;
    let m;
    while ((m = re.exec(masked()))) {
      if (m[2].toLowerCase() === 'week') {
        const mon = startOfWeek(now);
        if (m[1].toLowerCase() === 'next') mon.setDate(mon.getDate() + 7);
        out.startDate = toISODate(mon);
        out.endDate = toISODate(addDays(mon, 6));
      } else {
        const d = new Date(now.getFullYear(), now.getMonth() + (m[1].toLowerCase() === 'next' ? 1 : 0), 1);
        out.startDate = toISODate(d);
        out.endDate = toISODate(new Date(d.getFullYear(), d.getMonth(), daysInMonth(d.getFullYear(), d.getMonth())));
      }
      out.spans.push([m.index, m.index + m[0].length]);
    }
  }
  // Whole month: "for October 2026", "in October", "this October", "throughout October",
  // "of October", "during October", "for the month of October"
  {
    const re = new RegExp(`\\b(?:for|in|during|of|this|throughout)\\s+(?:the\\s+month\\s+of\\s+)?(${MONTH_RE})(?:\\s+(\\d{4}))?|\\b(${MONTH_RE})\\s+(\\d{4})\\b`, 'gi');
    let m;
    while ((m = re.exec(masked()))) {
      const mi = monthIndex(m[1] || m[3]);
      const yearStr = m[2] || m[4];
      if (mi < 0) continue;
      if (yearStr) {
        const y = +yearStr;
        out.startDate = toISODate(new Date(y, mi, 1));
        out.endDate = toISODate(new Date(y, mi, daysInMonth(y, mi)));
      } else if (mi >= now.getMonth()) {
        const y = now.getFullYear();
        out.startDate = toISODate(new Date(y, mi, 1));
        out.endDate = toISODate(new Date(y, mi, daysInMonth(y, mi)));
      } else {
        out.monthAsk = { month: mi, year: now.getFullYear() + 1 };
      }
      out.spans.push([m.index, m.index + m[0].length]);
    }
  }
  // Repetition counts: "for 2 weeks", "for 5 days", "4 times"
  {
    const m = masked().match(/\bfor\s+(\d{1,2})\s*(weeks?|days?)\b/i);
    if (m) {
      out.countN = +m[1];
      out.countUnit = m[2].toLowerCase().startsWith('w') ? 'weeks' : 'days';
      out.spans.push([m.index!, m.index! + m[0].length]);
    }
  }
  {
    const m = masked().match(/\b(\d{1,2})\s+times\b/i);
    if (m) {
      out.countN = +m[1];
      out.countUnit = 'times';
      out.spans.push([m.index!, m.index! + m[0].length]);
    }
  }
  return out;
}

// First matching weekday on/after fromIso, skipping today when its start time passed.
function firstOccurrenceOnOrAfter(dayIdxs: number[], now: Date, fromIso: string, startTime?: string): string {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const cur = new Date(fromIso + 'T00:00:00');
  for (let i = 0; i < 400; i++) {
    if (dayIdxs.includes((cur.getDay() + 6) % 7)) {
      const iso = toISODate(cur);
      if (!(iso === toISODate(now) && startTime && toMin(startTime) < nowMin)) return iso;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return fromIso;
}

function occurrencesOfDays(dayNames: string[], startIso: string, endIso: string): string[] {
  const idxs = new Set(dayNames.map((d) => DAY_NAMES.indexOf(d as any)));
  const out: string[] = [];
  const cur = new Date(startIso + 'T00:00:00');
  for (let i = 0; i < 400; i++) {
    const iso = toISODate(cur);
    if (iso > endIso) break;
    if (idxs.has((cur.getDay() + 6) % 7)) out.push(iso);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function fmtFullDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const m = MONTHS[d.getMonth()];
  return `${m.charAt(0).toUpperCase() + m.slice(1)} ${d.getDate()}, ${d.getFullYear()}`;
}

function fmtShortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  const m = MONTHS[d.getMonth()];
  return `${m.charAt(0).toUpperCase() + m.slice(1)} ${d.getDate()}`;
}

// "October 5, 12, 19 and 26, 2026"; cross-month: "October 31 and November 7, 2026"
function formatOccurrenceList(isos: string[]): string {
  const groups: { key: string; month: string; year: number; days: number[] }[] = [];
  for (const iso of isos) {
    const d = new Date(iso + 'T00:00:00');
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let g = groups.find((x) => x.key === key);
    if (!g) {
      const mn = MONTHS[d.getMonth()];
      g = { key, month: mn.charAt(0).toUpperCase() + mn.slice(1), year: d.getFullYear(), days: [] };
      groups.push(g);
    }
    g.days.push(d.getDate());
  }
  return groups
    .map((g) => `${g.month} ${g.days.join(', ').replace(/, ([^,]+)$/, ' and $1')}, ${g.year}`)
    .join(' and ');
}

function parseDays(text: string): number[] | undefined {
  if (/\b(every\s*day|everyday|daily)\b/i.test(text)) return [0, 1, 2, 3, 4, 5, 6];
  if (/\bweekdays?\b/i.test(text)) return [0, 1, 2, 3, 4];
  if (/\bweekends?\b/i.test(text)) return [5, 6];
  const found = new Set<number>();
  for (const [re, idx] of DAY_ALIASES) {
    if (re.test(text)) found.add(idx);
  }
  if (found.size === 0) return undefined;
  return Array.from(found).sort((a, b) => a - b);
}

interface TimeToken {
  h: number;
  m: number;
  ampm?: 'am' | 'pm';
  special?: 'noon' | 'midnight';
  valid: boolean;
  bare: boolean; // bare number, no minutes and no ampm
}

function readToken(raw: string, precededByKeyword: boolean): TimeToken | null {
  const t = raw.trim().toLowerCase();
  if (t === 'noon') return { h: 12, m: 0, valid: true, bare: false, special: 'noon' };
  if (t === 'midnight') return { h: 0, m: 0, valid: true, bare: false, special: 'midnight' };
  const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|am|pm)?$/);
  if (!m) return null;
  const h = +m[1];
  const min = m[2] ? +m[2] : 0;
  const ampmRaw = m[3];
  const ampm = ampmRaw ? (ampmRaw.startsWith('p') ? 'pm' : 'am') : undefined;
  const bare = !m[2] && !ampm;
  if (bare && !precededByKeyword) return null;
  const valid = min < 60 && h <= 23 && !(ampm && h > 12) && h >= 0 && !(bare && h > 23);
  return { h, m: min, ampm, valid, bare };
}

const TIME_EXPR = `(?:noon|midnight|\\d{1,2}:\\d{2}|\\d{1,2})(?:\\s*(?:a\\.?m\\.?|p\\.?m\\.?|am|pm))?`;

function parseTimes(masked: string, original: string): Pick<ParsedFields, 'startTime' | 'endTime' | 'pendingHour' | 'invalidTime' | 'durationMin'> {
  const out: Pick<ParsedFields, 'startTime' | 'endTime' | 'pendingHour' | 'invalidTime' | 'durationMin'> = {};

  const hintAmPm: 'am' | 'pm' | undefined = /\b(?:in the )?(morning)\b/i.test(original)
    ? 'am'
    : /\b(?:in the )?(afternoon|evening|night)\b/i.test(original)
      ? 'pm'
      : undefined;

  let start: { h: number; m: number } | undefined;
  let end: { h: number; m: number } | undefined;
  const consumed: [number, number][] = [];

  // Explicit range first: "(from) T1 (to|until|till|-|–) T2"
  const rangeRe = new RegExp(
    `(?:\\bfrom\\s+|\\bbetween\\s+)?(${TIME_EXPR})\\s*(to|until|till|[-–—])\\s*(${TIME_EXPR})`,
    'gi'
  );
  let rm;
  while ((rm = rangeRe.exec(masked))) {
    const kw = /^(?:from|between)\b/i.test(rm[0]);
    const t1 = readToken(rm[1], kw || true);
    const t2 = readToken(rm[3], true);
    consumed.push([rm.index, rm.index + rm[0].length]);
    if (!t1 || !t2 || !t1.valid || !t2.valid) {
      out.invalidTime = true;
      continue;
    }
    let h1 = t1.h;
    let h2 = t2.h;
    if (t2.ampm) h2 = applyAmPm(t2.h, t2.ampm);
    if (t1.ampm) {
      h1 = applyAmPm(t1.h, t1.ampm);
    } else if (t2.ampm) {
      // T1 inherits T2's am/pm unless that makes start >= end
      const inherited = applyAmPm(t1.h, t2.ampm);
      h1 = inherited < h2 ? inherited : t1.h === 12 ? 0 : t1.h;
    } else if (hintAmPm) {
      h1 = applyAmPm(t1.h, hintAmPm);
      h2 = t2.h <= 12 ? applyAmPm(t2.h, hintAmPm) : t2.h;
      if (h2 <= h1 && hintAmPm === 'pm' && t2.h < 12) h2 = t2.h + 12;
    } else if (t1.bare || t2.bare) {
      out.pendingHour = { h: t1.h, m: t1.m };
      continue;
    }
    start = { h: h1, m: t1.m };
    end = { h: h2, m: t2.m };
    break;
  }

  if (!start) {
    const masked2 = maskSpans(masked, consumed);
    // Single time: H:MM ampm? | H ampm | noon | midnight | keyword + bare number
    const singleRe = new RegExp(
      `\\b(at|from|@|until|till|to)\\s+(${TIME_EXPR})|\\b(${TIME_EXPR})`,
      'gi'
    );
    let sm;
    while ((sm = singleRe.exec(masked2))) {
      const raw = sm[2] || sm[3];
      if (!raw || !/\S/.test(raw)) continue;
      const kw = !!sm[2];
      const tok = readToken(raw, kw);
      if (!tok) continue;
      if (!tok.valid) {
        out.invalidTime = true;
        break;
      }
      if (tok.bare) {
        if (tok.h >= 1 && tok.h <= 12) {
          if (hintAmPm) {
            start = { h: applyAmPm(tok.h, hintAmPm), m: tok.m };
          } else {
            out.pendingHour = { h: tok.h, m: tok.m };
          }
        } else if (tok.h <= 23) {
          start = { h: tok.h, m: tok.m };
        } else {
          out.invalidTime = true;
        }
        break;
      }
      let h = tok.h;
      if (tok.ampm) h = applyAmPm(tok.h, tok.ampm);
      else if (h > 12 || h === 0 || tok.m !== 0 || tok.special) {
        // 24h or explicit
      } else if (hintAmPm) {
        h = applyAmPm(tok.h, hintAmPm);
      } else {
        // H:MM like 09:30 without am/pm: treat as 24h clock
      }
      start = { h, m: tok.m };
      break;
    }
  }

  if (start) out.startTime = toHHMM(start.h, start.m);
  if (end) out.endTime = toHHMM(end.h, end.m);

  // Duration: "for 2 hours" / "for 90 minutes"
  const durM = /\bfor\s+(\d{1,3})\s*(hours?|hrs?|h|minutes?|mins?|m)\b/i.exec(original);
  if (durM) {
    const n = +durM[1];
    const unit = durM[2].toLowerCase();
    out.durationMin = unit.startsWith('h') ? n * 60 : n;
  }

  return out;
}

function parseRoom(text: string): string | undefined {
  const m = text.match(/\b(?:in|at)\s+((?:room|rm\.?|lab|hall|building|bldg)\s*[\w-]+)/i);
  if (!m) return undefined;
  const raw = m[1].trim();
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function parseInstructor(text: string): string | undefined {
  const m = text.match(
    /\bwith\s+((?:Prof\.?|Professor|Dr\.?|Mr\.?|Ms\.?|Mrs\.?|Sir|Ma'?am)\s+[A-Za-z]+(?:\s+[A-Za-z]+)?)/i
  );
  if (!m) return undefined;
  const raw = m[1].trim();
  return raw.replace(/^professor\b/i, 'Prof.').replace(/^prof\b(?!\.)/i, 'Prof.');
}

const TITLE_CUT =
  /\b(?:every|each|on|at|from|with|today|tomorrow|next|this|daily|weekly|weekdays?|weekends?|monday|mondays|mon|tuesday|tuesdays|tues?|wednesday|wednesdays|wed|thursday|thursdays|thurs?|thur|friday|fridays|fri|saturday|saturdays|sat|sunday|sundays|sun)\b|\bin\s+(?:room|rm\.?|lab|hall|building|bldg)\b|\bfor\s+\d|\bto\s+my\s+(?:calendar|schedule)\b|\b\d{1,2}:\d{2}\b|\b\d{1,2}\s*(?:a\.?m\.?|p\.?m\.?|am|pm)\b|\b(?:noon|midnight)\b/i;

function parseTitle(text: string): string | undefined {
  const quoted = text.match(/["'“”‘’]([^"'“”‘’]{2,60})["'“”‘’]/);
  if (quoted) return quoted[1].trim();

  let t = text.trim();
  // Drop leading filler words
  const filler = /^(please|can you|could you|would you|add|schedule|create|put|set up|setup|book|new|i have|i need|a|an|my|the)\b[ ,]*/i;
  let prev = '';
  while (prev !== t) {
    prev = t;
    t = t.replace(filler, '');
  }

  const cut = TITLE_CUT.exec(t);
  if (cut) t = t.slice(0, cut.index);

  t = t.replace(/[\s,;:.\-–—]+$/, '').replace(/^[\s,;:.\-–—]+/, '');
  t = t.replace(/\b(?:class|lecture)$/i, '').trim();
  if (t.length < 2 || t.length > 60) return undefined;
  if (!/[A-Za-z]/.test(t)) return undefined;
  if (t === t.toLowerCase()) {
    t = t.replace(/\b[a-z]/g, (c) => c.toUpperCase());
  }
  return t;
}

export function parseFields(text: string, now: Date): ParsedFields {
  const out: ParsedFields = {};
  const ranges = parseRanges(text, now);
  if (ranges.startDate) out.startDate = ranges.startDate;
  if (ranges.endDate) out.endDate = ranges.endDate;
  if (ranges.countN) {
    out.countN = ranges.countN;
    out.countUnit = ranges.countUnit;
  }
  if (ranges.invalidDate) out.invalidDate = true;
  if (ranges.monthAsk) out.monthAsk = ranges.monthAsk;
  const preMasked = maskSpans(text, ranges.spans);
  const { date, dateIsPast, todayExplicit, spans } = parseDates(preMasked, now);
  if (date) {
    out.date = date;
    out.dateIsPast = dateIsPast;
    out.todayExplicit = todayExplicit;
    out.recurrence = 'once';
  }
  const masked = maskSpans(preMasked, spans);
  // A month name or week/month period word that was not consumed as a date or
  // range means the request mentioned a window we could not bound.
  if (
    new RegExp(`\\b${MONTH_RE}\\b`, 'i').test(masked) ||
    /\b(?:weeks?|months?)\b/i.test(masked)
  ) {
    out.periodUnconsumed = true;
  }
  const days = parseDays(masked);
  if (days) out.days = days;
  const times = parseTimes(masked, text);
  Object.assign(out, times);
  // A resolved one-time date of today whose start time already passed rolls to next week
  // (explicit "today" is handled separately as a clarifying question).
  if (out.date && !todayExplicit) out.date = adjustOnceDateForPassedTime(out.date, now, out.startTime);
  const room = parseRoom(text);
  if (room) out.room = room;
  const instructor = parseInstructor(text);
  if (instructor) out.instructor = instructor;
  const title = parseTitle(text);
  if (title) out.title = title;

  // Weekly recurrence signals
  if (!out.recurrence) {
    if (
      /\b(every|each)\b/i.test(masked) ||
      /\bweekly\b|\bweekdays\b|\bweekends\b|\bdaily\b|\beveryday\b/i.test(masked) ||
      /\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)s\b/i.test(masked)
    ) {
      out.recurrence = 'weekly';
    }
  }

  return out;
}

function overlapMinutes(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function sharesDayOrDate(draftDays: string[] | undefined, draftDate: string | undefined, c: Course, now: Date, draftStart?: string, draftEnd?: string): boolean {
  // Bounded ranges that do not intersect can never share an occurrence
  const aStart = draftDate || draftStart || '0000-01-01';
  const aEnd = draftDate || draftEnd || '9999-12-31';
  const cStart = c.date || c.startDate || '0000-01-01';
  const cEnd = c.date || c.endDate || '9999-12-31';
  if (aEnd < cStart || cEnd < aStart) return false;
  if (draftDate) {
    const dIdx = DAY_NAMES.indexOf(weekdayName(new Date(+draftDate.slice(0, 4), +draftDate.slice(5, 7) - 1, +draftDate.slice(8, 10))));
    if (c.date) return c.date === draftDate;
    return c.days.includes(DAY_NAMES[dIdx]);
  }
  if (draftDays && draftDays.length) {
    if (c.date) {
      const cIdx = DAY_NAMES.indexOf(weekdayName(new Date(+c.date.slice(0, 4), +c.date.slice(5, 7) - 1, +c.date.slice(8, 10))));
      return draftDays.includes(DAY_NAMES[cIdx]);
    }
    return draftDays.some((d) => c.days.includes(d));
  }
  return false;
}

function formatDayList(days: string[]): string {
  if (days.length === 7) return 'day';
  if (days.length === 5 && days.join() === 'Mon,Tue,Wed,Thu,Fri') return 'weekday';
  if (days.length === 1) return days[0] === 'Mon' ? 'Monday' : FULL_DAY_NAMES[(DAY_NAMES.indexOf(days[0] as any) + 1) % 7];
  const names = days.map((d) => FULL_DAY_NAMES[(DAY_NAMES.indexOf(d as any) + 1) % 7]);
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function fullDayName(shortName: string): string {
  const idx = DAY_NAMES.indexOf(shortName as any);
  return idx >= 0 ? FULL_DAY_NAMES[(idx + 1) % 7] : shortName;
}

export function handleScheduleMessage(
  text: string,
  pending: PendingState | null,
  existing: Course[],
  now: Date
): AssistantResult {
  const trimmed = text.trim();
  const help =
    'Tell me what to add. For example: "Add Web Development every Monday at 8 AM" or "Add Thesis meeting on October 20 at 10am".';
  if (!trimmed) return { kind: 'info', message: help };

  if (/^(cancel|never mind|nevermind|stop)\b/i.test(trimmed)) {
    return { kind: 'info', message: 'Okay, cancelled.' };
  }

  const draft: ScheduleDraft = pending ? { ...pending.draft } : {};

  const parsed = parseFields(trimmed, now);

  // Greeting or unrecognized text with nothing extractable and no pending draft
  if (
    !pending &&
    !parsed.days &&
    !parsed.date &&
    !parsed.startTime &&
    !parsed.pendingHour &&
    !parsed.room &&
    !parsed.instructor &&
    !parsed.recurrence
  ) {
    return { kind: 'info', message: help };
  }

  // Interpret the reply in the context of what is being awaited
  if (pending) {
    switch (pending.awaiting) {
      case 'title': {
        const t = trimmed.length >= 2 && trimmed.length <= 60 ? trimmed.replace(/[.]+$/, '') : undefined;
        if (t) draft.title = parseTitle(t) || (t === t.toLowerCase() ? t.replace(/\b[a-z]/g, (c) => c.toUpperCase()) : t);
        parsed.title = undefined; // whole reply is the title
        break;
      }
      case 'ampm': {
        const m = trimmed.match(/\b(a\.?m\.?|p\.?m\.?|am|pm|morning|afternoon|evening|night)\b/i);
        if (m && draft.pendingHour) {
          const w = m[1].toLowerCase();
          const ampm: 'am' | 'pm' =
            w === 'morning' || w.startsWith('a') ? 'am' : 'pm';
          draft.startTime = toHHMM(applyAmPm(draft.pendingHour.h, ampm), draft.pendingHour.m);
          delete draft.pendingHour;
          parsed.pendingHour = undefined;
          parsed.startTime = undefined;
        } else if (parsed.startTime) {
          delete draft.pendingHour;
        }
        break;
      }
      case 'recurrence': {
        if (/\b(every|each|weekly|repeat|daily|yes|week)\b/i.test(trimmed) && !/\b(once|only|just|one)\b/i.test(trimmed)) {
          draft.recurrence = 'weekly';
          parsed.recurrence = undefined;
        } else if (/\b(once|only|just|one\s*time|no)\b/i.test(trimmed)) {
          draft.recurrence = 'once';
          const dayIdx = draft.days && draft.days.length ? DAY_NAMES.indexOf(draft.days[0] as any) : -1;
          if (dayIdx >= 0) {
            draft.date = adjustOnceDateForPassedTime(toISODate(nextOccurrence(dayIdx, now, false)), now, draft.startTime);
          }
          parsed.recurrence = undefined;
          parsed.date = undefined;
        }
        break;
      }
      case 'conflict': {
        if (/\b(yes|yeah|yep|sure|ok|okay|add anyway|go ahead)\b/i.test(trimmed) && !/\b(no|don't|do not|cancel)\b/i.test(trimmed)) {
          return finalizeAdd(draft, existing, now);
        }
        if (/\b(no|nope|don't|do not|cancel|stop)\b/i.test(trimmed)) {
          return { kind: 'info', message: 'Okay, I did not add it.' };
        }
        return {
          kind: 'ask',
          message: 'Add it anyway? Please answer yes or no.',
          pending,
        };
      }
      case 'endTime': {
        const t = parsed.endTime || parsed.startTime;
        if (t) {
          draft.endTime = t;
          parsed.startTime = undefined;
          parsed.endTime = undefined;
        } else if (parsed.pendingHour) {
          // e.g. "until 5" — ambiguous hour for the end
          const ph = parsed.pendingHour;
          const m = trimmed.match(/\b(am|pm|morning|afternoon|evening|night)\b/i);
          if (m) {
            draft.endTime = toHHMM(applyAmPm(ph.h, m[1].toLowerCase().startsWith('p') || m[1].toLowerCase() !== 'morning' ? 'pm' : 'am'), ph.m);
          } else if (ph.h > 12) {
            draft.endTime = toHHMM(ph.h, ph.m);
          }
          parsed.pendingHour = undefined;
        }
        break;
      }
      case 'date': {
        if (draft.pendingMonthYear) {
          const pmy = draft.pendingMonthYear;
          if (/\b(yes|yeah|yep|sure|ok|okay|correct|that|right)\b/i.test(trimmed)) {
            draft.startDate = toISODate(new Date(pmy.year, pmy.month, 1));
            draft.endDate = toISODate(new Date(pmy.year, pmy.month, daysInMonth(pmy.year, pmy.month)));
          }
          delete draft.pendingMonthYear;
        }
        if (!parsed.date && !parsed.startDate && parsed.days && parsed.days.length) {
          draft.date = adjustOnceDateForPassedTime(toISODate(nextOccurrence(parsed.days[0], now, false)), now, draft.startTime);
          draft.recurrence = 'once';
          parsed.days = undefined;
        }
        break;
      }
      default:
        break;
    }
  }

  // Merge other parsed fields (new values override)
  if (parsed.title !== undefined) draft.title = parsed.title;
  if (parsed.days !== undefined) draft.days = parsed.days.map((i) => DAY_NAMES[i]);
  if (parsed.date !== undefined) draft.date = parsed.date;
  if (parsed.todayExplicit) draft.todayFlag = true;
  else if (parsed.date !== undefined) delete draft.todayFlag;
  if (parsed.dateIsPast) draft.date = undefined;
  if (parsed.startDate !== undefined) draft.startDate = parsed.startDate;
  if (parsed.endDate !== undefined) {
    draft.endDate = parsed.endDate;
    // An end without a start bounds the range from today
    if (parsed.startDate === undefined && !draft.startDate) draft.startDate = toISODate(now);
  }
  if (parsed.date !== undefined) {
    // A concrete one-time date takes precedence over any range bounds
    delete draft.startDate;
    delete draft.endDate;
  }
  if (parsed.countN !== undefined) {
    draft.countN = parsed.countN;
    draft.countUnit = parsed.countUnit;
  }
  if (parsed.monthAsk) draft.pendingMonthYear = parsed.monthAsk;
  if (parsed.recurrence !== undefined) draft.recurrence = parsed.recurrence;
  if (parsed.startTime !== undefined) {
    draft.startTime = parsed.startTime;
    delete draft.pendingHour;
  }
  if (parsed.endTime !== undefined) draft.endTime = parsed.endTime;
  if (parsed.pendingHour !== undefined && draft.startTime === undefined) draft.pendingHour = parsed.pendingHour;
  if (parsed.room !== undefined) draft.room = parsed.room;
  if (parsed.instructor !== undefined) draft.instructor = parsed.instructor;

  // A one-time date of today whose start time already passed: explicit "today" asks
  // for clarification, otherwise the date rolls forward to next week's occurrence.
  if (draft.date === toISODate(now) && draft.startTime && toMin(draft.startTime) < now.getHours() * 60 + now.getMinutes()) {
    if (draft.todayFlag) {
      delete draft.date;
      delete draft.todayFlag;
      return {
        kind: 'ask',
        message: 'That time has already passed today. Which date or time did you mean?',
        pending: { draft, awaiting: 'date' },
      };
    }
    draft.date = toISODate(addDays(now, 7));
  }

  // Month without a year that is fully past: ask instead of guessing
  if (parsed.monthAsk && !parsed.startDate) {
    const { month, year } = parsed.monthAsk;
    const mn = MONTHS[month];
    return {
      kind: 'ask',
      message: `Do you mean ${mn.charAt(0).toUpperCase() + mn.slice(1)} ${year}?`,
      pending: { draft, awaiting: 'date' },
    };
  }

  // A range or repetition count with days implies weekly recurrence
  if ((draft.startDate || draft.endDate || draft.countN) && draft.days && draft.days.length && !draft.recurrence) {
    draft.recurrence = 'weekly';
  }

  // Past explicit date: ask which date was meant
  if (parsed.dateIsPast) {
    return {
      kind: 'ask',
      message: 'That date has already passed. Which date did you mean?',
      pending: { draft, awaiting: 'date' },
    };
  }

  // Duration sets the end from the start
  let usedDefaultEnd = false;
  if (parsed.durationMin !== undefined && draft.startTime) {
    const s = toMin(draft.startTime);
    draft.endTime = toHHMM(Math.floor(Math.min(s + parsed.durationMin, 23 * 60 + 59) / 60), Math.min(s + parsed.durationMin, 23 * 60 + 59) % 60);
  }

  // Ask for the first missing item: title, day/date, recurrence, time, ampm, endTime
  if (!draft.title) {
    return {
      kind: 'ask',
      message: 'What is the name of the class or event?',
      pending: { draft, awaiting: 'title' },
    };
  }

  const hasDays = draft.days && draft.days.length > 0;
  const hasDate = !!draft.date;
  if (!hasDays && !hasDate) {
    return {
      kind: 'ask',
      message: `What day does ${draft.title} meet?`,
      pending: { draft, awaiting: 'day' },
    };
  }

  if (!draft.recurrence) {
    const dayIdx = hasDate
      ? (new Date(draft.date! + 'T00:00:00').getDay() + 6) % 7
      : DAY_NAMES.indexOf(draft.days![0] as any);
    const onceDate = hasDate
      ? draft.date!
      : adjustOnceDateForPassedTime(toISODate(nextOccurrence(dayIdx, now, false)), now, draft.startTime);
    const od = new Date(onceDate + 'T00:00:00');
    const monthName = MONTHS[od.getMonth()];
    const dayName = FULL_DAY_NAMES[(dayIdx + 1) % 7];
    return {
      kind: 'ask',
      message: `Should ${draft.title} repeat every ${dayName}, or only on ${dayName}, ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${od.getDate()}?`,
      pending: { draft, awaiting: 'recurrence' },
    };
  }

  if (!draft.startTime) {
    if (draft.pendingHour) {
      const ph = draft.pendingHour;
      return {
        kind: 'ask',
        message: `Is that ${ph.h}:${pad2(ph.m)} AM or ${ph.h}:${pad2(ph.m)} PM?`,
        pending: { draft, awaiting: 'ampm' },
      };
    }
    const dayText = hasDate
      ? `on ${fullDayName(DAY_NAMES[(new Date(draft.date! + 'T00:00:00').getDay() + 6) % 7])}`
      : `on ${formatDayList(draft.days!)}s`;
    const msg = parsed.invalidTime
      ? `I could not understand that time. When does ${draft.title} start?`
      : `What time does ${draft.title} start ${dayText}?`;
    return { kind: 'ask', message: msg, pending: { draft, awaiting: 'time' } };
  }

  if (draft.startTime && draft.endTime && toMin(draft.endTime) <= toMin(draft.startTime)) {
    delete draft.endTime;
    return {
      kind: 'ask',
      message: 'The end time must be after the start time. When does it end?',
      pending: { draft, awaiting: 'endTime' },
    };
  }

  if (!draft.endTime) {
    const s = toMin(draft.startTime);
    const e = Math.min(s + 60, 23 * 60 + 59);
    draft.endTime = toHHMM(Math.floor(e / 60), e % 60);
    usedDefaultEnd = true;
  }

  // Range validation: ask, never silently fix
  if (parsed.invalidDate) {
    return {
      kind: 'ask',
      message: 'I could not understand that date. Which dates did you mean?',
      pending: { draft, awaiting: 'date' },
    };
  }
  if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) {
    return {
      kind: 'ask',
      message: `The end date is before the start date. Which dates did you mean?`,
      pending: { draft, awaiting: 'date' },
    };
  }
  if (draft.endDate && draft.endDate < toISODate(now)) {
    return {
      kind: 'ask',
      message: 'That date range has already passed. Which dates did you mean?',
      pending: { draft, awaiting: 'date' },
    };
  }

  // Resolve "for N weeks/days" and "N times" into an end date
  if (draft.countN && draft.days && draft.days.length && !draft.date) {
    const dayIdxs = draft.days.map((d) => DAY_NAMES.indexOf(d as any));
    if (!draft.startDate) {
      draft.startDate = firstOccurrenceOnOrAfter(dayIdxs, now, toISODate(now), draft.startTime);
    }
    const startD = new Date(draft.startDate + 'T00:00:00');
    if (draft.countUnit === 'weeks') {
      draft.endDate = toISODate(addDays(startD, 7 * draft.countN - 1));
    } else if (draft.countUnit === 'days') {
      draft.endDate = toISODate(addDays(startD, draft.countN - 1));
    } else {
      // "N times": end date is the Nth occurrence
      const idxSet = new Set(dayIdxs);
      const cur = new Date(startD);
      let found = draft.startDate;
      let n = 0;
      for (let i = 0; i < 400 && n < draft.countN; i++) {
        if (idxSet.has((cur.getDay() + 6) % 7)) {
          found = toISODate(cur);
          n++;
        }
        cur.setDate(cur.getDate() + 1);
      }
      draft.endDate = found;
    }
  }

  // A bounded range that contains none of the chosen days
  if (!draft.date && draft.startDate && draft.endDate && draft.days && draft.days.length) {
    const occ = occurrencesOfDays(draft.days, draft.startDate, draft.endDate);
    if (occ.length === 0) {
      return {
        kind: 'ask',
        message: `There are no ${formatDayList(draft.days)}s between ${fmtShortDate(draft.startDate)} and ${fmtShortDate(draft.endDate)}. Which dates did you mean?`,
        pending: { draft, awaiting: 'date' },
      };
    }
  }

  // Safety net: a month name or week/month period word that was not consumed
  // as a date or range means the request specified a window we could not
  // turn into concrete bounds; ask instead of adding an unbounded event.
  if (
    parsed.periodUnconsumed &&
    !draft.date &&
    !draft.startDate &&
    !draft.endDate &&
    pending?.awaiting !== 'recurrence' &&
    pending?.awaiting !== 'conflict'
  ) {
    return {
      kind: 'ask',
      message:
        'Which dates should this cover? For example: for October 2026, or from October 12 to October 30.',
      pending: { draft, awaiting: 'date' },
    };
  }

  return finalizeAdd(draft, existing, now, usedDefaultEnd);
}

function finalizeAdd(
  draft: ScheduleDraft,
  existing: Course[],
  now: Date,
  usedDefaultEnd = false
): AssistantResult {
  const title = draft.title!;
  const start = toMin(draft.startTime!);
  const end = toMin(draft.endTime!);

  // Duplicate check: same title, overlapping day/date, same start
  const dup = existing.find(
    (c) =>
      c.title.trim().toLowerCase() === title.trim().toLowerCase() &&
      sharesDayOrDate(draft.days, draft.date, c, now, draft.startDate, draft.endDate) &&
      toMin(c.startTime) === start
  );
  if (dup) {
    return {
      kind: 'info',
      message: `${dup.title} is already in your schedule at ${formatTime12(dup.startTime)}.`,
    };
  }

  // Conflict check: overlapping time on a shared day/date (skipped once the user confirmed)
  const conflict = (draft as ScheduleDraft & { conflictPending?: boolean }).conflictPending
    ? undefined
    : existing.find(
    (c) =>
      sharesDayOrDate(draft.days, draft.date, c, now, draft.startDate, draft.endDate) &&
      overlapMinutes(start, end, toMin(c.startTime), toMin(c.endTime))
  );
  if (conflict) {
    const day = conflict.date
      ? fullDayName(weekdayName(new Date(conflict.date + 'T00:00:00')))
      : fullDayName(conflict.days[0]);
    return {
      kind: 'ask',
      message: `This overlaps with ${conflict.title} (${formatTime12(conflict.startTime)} - ${formatTime12(conflict.endTime)} on ${day}). Add it anyway?`,
      pending: { draft: { ...draft, conflictPending: true } as ScheduleDraft, awaiting: 'conflict' },
    };
  }

  const course = buildCourse(draft, existing);
  let when = draft.date
    ? `on ${fullDayName(weekdayName(new Date(draft.date + 'T00:00:00')))}, ${capMonth(new Date(draft.date + 'T00:00:00'))}`
    : `every ${formatDayList(draft.days!)}`;
  if (!draft.date && (draft.startDate || draft.endDate)) {
    if (draft.startDate && draft.endDate) {
      const occ = listOccurrences(course, 9999);
      if (occ.length <= 10) {
        when += `, on ${formatOccurrenceList(occ)}`;
      } else {
        when += `, ${occ.length} sessions from ${fmtFullDate(occ[0])} to ${fmtFullDate(occ[occ.length - 1])}`;
      }
    } else {
      when += ` starting ${fmtFullDate(draft.startDate!)}`;
    }
  }
  const note = usedDefaultEnd ? ' (1 hour by default)' : '';
  return {
    kind: 'add',
    message: `Added ${course.title} ${when}, ${formatTime12(course.startTime)} - ${formatTime12(course.endTime)}${note}.`,
    course,
  };
}

function capMonth(d: Date): string {
  const m = MONTHS[d.getMonth()];
  return `${m.charAt(0).toUpperCase() + m.slice(1)} ${d.getDate()}`;
}

function buildCourse(draft: ScheduleDraft, existing: Course[]): Course {
  const title = draft.title!;
  let days = draft.days || [];
  if (draft.date) {
    const idx = (new Date(draft.date + 'T00:00:00').getDay() + 6) % 7;
    days = [DAY_NAMES[idx]];
  }
  return {
    id: `course-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    code: title.slice(0, 7).toUpperCase(),
    title,
    units: 3,
    days,
    date: draft.date,
    startDate: draft.date ? undefined : draft.startDate,
    endDate: draft.date ? undefined : draft.endDate,
    startTime: draft.startTime!,
    endTime: draft.endTime!,
    room: draft.room,
    instructor: draft.instructor,
    color: COLORS[existing.length % COLORS.length],
  };
}
