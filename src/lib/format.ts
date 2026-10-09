import { formatTime12 } from './dates';

export function formatDate(isoOrDate: string | Date): string {
  const d =
    typeof isoOrDate === 'string'
      ? /^\d{4}-\d{2}-\d{2}$/.test(isoOrDate)
        ? new Date(isoOrDate + 'T00:00:00')
        : new Date(isoOrDate)
      : isoOrDate;
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDueLabel(
  dueIso: string,
  todayIso: string
): { label: string; tone: 'danger' | 'warning' | 'neutral' } {
  if (!dueIso) return { label: 'No due date', tone: 'neutral' };
  if (dueIso < todayIso) {
    return { label: `Overdue · ${formatDate(dueIso)}`, tone: 'danger' };
  }
  if (dueIso === todayIso) return { label: 'Due today', tone: 'warning' };
  const d = new Date(dueIso + 'T00:00:00');
  const tomorrow = new Date(todayIso + 'T00:00:00');
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowIso = `${tomorrow.getFullYear()}-${String(
    tomorrow.getMonth() + 1
  ).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  if (dueIso === tomorrowIso) return { label: 'Due tomorrow', tone: 'neutral' };
  return {
    label: `Due ${d.toLocaleDateString(undefined, { weekday: 'short' })}, ${formatDate(dueIso).replace(/, \d{4}$/, '')}`,
    tone: 'neutral',
  };
}

export function formatTimeRange(start: string, end: string): string {
  const s = formatTime12(start);
  const e = formatTime12(end);
  const sM = s.match(/^(\d+:\d{2})\s(AM|PM)$/);
  const eM = e.match(/^(\d+:\d{2})\s(AM|PM)$/);
  if (!sM || !eM) return `${s} – ${e}`;
  return sM[2] === eM[2] ? `${sM[1]} – ${e}` : `${s} – ${e}`;
}

export function formatDuration(sec: number): string {
  const total = Math.max(0, Math.round(sec));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}
