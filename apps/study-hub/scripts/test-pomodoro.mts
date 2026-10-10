import assert from 'node:assert/strict';
import {
  DEFAULT_POMODORO_SETTINGS,
  clampSettings,
  durationSeconds,
  formatTime,
  getNextMode,
} from '../src/lib/pomodoro.ts';

let passed = 0;
function ok(name: string, cond: boolean, extra?: unknown) {
  assert(cond, `${name} :: ${JSON.stringify(extra)}`);
  passed++;
  console.log(`ok - ${name}`);
}

const s = DEFAULT_POMODORO_SETTINGS;

// getNextMode sequence with interval 4: focus->short x3, 4th focus->long, long->focus
let mode: 'focus' | 'short' | 'long' = 'focus';
let completed = 0;
let n = getNextMode(mode, completed, s);
ok('focus->short', n.mode === 'short' && n.completedFocus === 1, n);
n = getNextMode('focus', n.completedFocus, s);
ok('focus->short 2', n.mode === 'short' && n.completedFocus === 2, n);
n = getNextMode('focus', n.completedFocus, s);
ok('focus->short 3', n.mode === 'short' && n.completedFocus === 3, n);
n = getNextMode('focus', n.completedFocus, s);
ok('4th focus->long', n.mode === 'long' && n.completedFocus === 4, n);
n = getNextMode('long', n.completedFocus, s);
ok('long->focus', n.mode === 'focus' && n.completedFocus === 4, n);
n = getNextMode('short', 2, s);
ok('short->focus', n.mode === 'focus' && n.completedFocus === 2, n);

// clampSettings
ok('clamp defaults NaN', JSON.stringify(clampSettings({ focusMinutes: NaN })) === JSON.stringify(s));
ok('clamp low', clampSettings({ focusMinutes: 0 }).focusMinutes === 1);
ok('clamp high', clampSettings({ focusMinutes: 999 }).focusMinutes === 120);
ok('clamp interval', clampSettings({ longBreakInterval: 99 }).longBreakInterval === 8);
ok('clamp partial', clampSettings({ shortBreakMinutes: 10 }).shortBreakMinutes === 10);

// durationSeconds
ok('dur focus', durationSeconds('focus', s) === 1500);
ok('dur short', durationSeconds('short', s) === 300);

// formatTime
ok('fmt 65', formatTime(65) === '01:05');
ok('fmt -3', formatTime(-3) === '00:00');
ok('fmt 1500', formatTime(1500) === '25:00');

console.log(`\n${passed} pomodoro assertions passed`);
