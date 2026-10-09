import React from 'react';
import { Timer, Play, Pause, RotateCcw, SkipForward, Bell, BellOff } from 'lucide-react';
import { usePomodoro } from '../lib/usePomodoro';
import { MODE_LABELS, PomodoroMode, durationSeconds, formatTime } from '../lib/pomodoro';

interface PomodoroViewProps {
  pomodoro: ReturnType<typeof usePomodoro>;
}

export const PomodoroView: React.FC<PomodoroViewProps> = ({ pomodoro }) => {
  const {
    mode,
    status,
    remainingSec,
    completedFocus,
    settings,
    notificationPermission,
    start,
    pause,
    resume,
    reset,
    skip,
    switchMode,
    updateSettings,
    requestNotificationPermission,
  } = pomodoro;

  const total = durationSeconds(mode, settings);
  const progress = total > 0 ? 1 - remainingSec / total : 0;
  const R = 90;
  const CIRC = 2 * Math.PI * R;

  const untilLong =
    settings.longBreakInterval - (completedFocus % settings.longBreakInterval);

  const primaryAction =
    status === 'running' ? pause : status === 'paused' ? resume : start;
  const primaryLabel =
    status === 'running' ? 'Pause' : status === 'paused' ? 'Resume' : 'Start';
  const PrimaryIcon = status === 'running' ? Pause : Play;

  const settingField = (
    label: string,
    key: 'focusMinutes' | 'shortBreakMinutes' | 'longBreakMinutes' | 'longBreakInterval',
    min: number,
    max: number
  ) => (
    <div>
      <label className="text-xs font-bold text-gray-700 block mb-1">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        step={1}
        value={settings[key]}
        onChange={(e) => updateSettings({ [key]: e.target.valueAsNumber })}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
      />
      <span className="text-[10px] text-gray-400">{min}-{max}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">
          Pomodoro Timer
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Focus in short bursts with breaks. The timer keeps running while you use other tabs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timer Card */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
          {/* Mode tabs */}
          <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 w-fit">
            {(['focus', 'short', 'long'] as PomodoroMode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  mode === m
                    ? 'bg-white text-gray-900 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          {/* Progress ring */}
          <div className="flex flex-col items-center py-2">
            <div className="relative">
              <svg width="220" height="220" viewBox="0 0 220 220">
                <circle
                  cx="110"
                  cy="110"
                  r={R}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                <circle
                  cx="110"
                  cy="110"
                  r={R}
                  fill="none"
                  stroke={mode === 'focus' ? '#065f46' : '#0d9488'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - progress)}
                  transform="rotate(-90 110 110)"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-gray-900 tabular-nums">
                  {formatTime(remainingSec)}
                </span>
                <span className="text-xs font-bold text-gray-500 mt-1">
                  {MODE_LABELS[mode]}
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={primaryAction}
              className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
            >
              <PrimaryIcon className="w-3.5 h-3.5" />
              {primaryLabel}
            </button>
            <button
              onClick={reset}
              className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              onClick={skip}
              className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
              Skip
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <span>
              Completed focus sessions: <strong className="text-gray-800">{completedFocus}</strong>
            </span>
            <span>
              Long break after <strong className="text-gray-800">{untilLong}</strong> more
            </span>
          </div>

          {/* Notification status */}
          <div className="flex items-center justify-between text-xs pt-1">
            {notificationPermission === 'granted' ? (
              <span className="flex items-center gap-1.5 text-gray-500">
                <Bell className="w-3.5 h-3.5 text-emerald-600" />
                Desktop notifications enabled
              </span>
            ) : notificationPermission === 'denied' ? (
              <span className="flex items-center gap-1.5 text-gray-400">
                <BellOff className="w-3.5 h-3.5" />
                Notifications are blocked in your browser settings. You will still see in-app alerts.
              </span>
            ) : (
              <>
                <span className="flex items-center gap-1.5 text-gray-500">
                  <Bell className="w-3.5 h-3.5 text-gray-400" />
                  Get notified when a session ends
                </span>
                <button
                  onClick={requestNotificationPermission}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
                >
                  Enable notifications
                </button>
              </>
            )}
          </div>
        </div>

        {/* Settings Card */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4 h-fit">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-emerald-600" />
            <h2 className="font-black text-sm text-gray-900">Timer settings</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {settingField('Focus (min)', 'focusMinutes', 1, 120)}
            {settingField('Short break (min)', 'shortBreakMinutes', 1, 30)}
            {settingField('Long break (min)', 'longBreakMinutes', 1, 60)}
            {settingField('Long break every', 'longBreakInterval', 2, 8)}
          </div>
          {status !== 'idle' && (
            <p className="text-[11px] text-amber-600 font-medium">
              Changes apply to the next session.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
