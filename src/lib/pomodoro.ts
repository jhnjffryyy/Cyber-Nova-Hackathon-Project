export type PomodoroMode = 'focus' | 'short' | 'long';

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
};

export const MODE_LABELS: Record<PomodoroMode, string> = {
  focus: 'Focus',
  short: 'Short break',
  long: 'Long break',
};

function clampInt(value: number, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function clampSettings(s: Partial<PomodoroSettings>): PomodoroSettings {
  return {
    focusMinutes: clampInt(s.focusMinutes ?? NaN, 1, 120, DEFAULT_POMODORO_SETTINGS.focusMinutes),
    shortBreakMinutes: clampInt(s.shortBreakMinutes ?? NaN, 1, 30, DEFAULT_POMODORO_SETTINGS.shortBreakMinutes),
    longBreakMinutes: clampInt(s.longBreakMinutes ?? NaN, 1, 60, DEFAULT_POMODORO_SETTINGS.longBreakMinutes),
    longBreakInterval: clampInt(s.longBreakInterval ?? NaN, 2, 8, DEFAULT_POMODORO_SETTINGS.longBreakInterval),
  };
}

export function getNextMode(
  mode: PomodoroMode,
  completedFocus: number,
  settings: PomodoroSettings
): { mode: PomodoroMode; completedFocus: number } {
  if (mode === 'focus') {
    const nextCompleted = completedFocus + 1;
    const next = nextCompleted % settings.longBreakInterval === 0 ? 'long' : 'short';
    return { mode: next, completedFocus: nextCompleted };
  }
  return { mode: 'focus', completedFocus };
}

export function durationSeconds(mode: PomodoroMode, settings: PomodoroSettings): number {
  const minutes =
    mode === 'focus'
      ? settings.focusMinutes
      : mode === 'short'
        ? settings.shortBreakMinutes
        : settings.longBreakMinutes;
  return minutes * 60;
}

export function formatTime(sec: number): string {
  const total = Math.max(0, Math.round(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
