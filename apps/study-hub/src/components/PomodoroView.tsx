import React from 'react';
import { useReducedMotion } from 'motion/react';
import { Play, Pause, RotateCcw, SkipForward, Bell, BellOff } from 'lucide-react';
import { usePomodoro } from '../lib/usePomodoro';
import { MODE_LABELS, PomodoroMode, durationSeconds, formatTime } from '../lib/pomodoro';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  PageHeader,
  SegmentedControl,
} from './ui';

interface PomodoroViewProps {
  pomodoro: ReturnType<typeof usePomodoro>;
}

const STATUS_LABELS: Record<string, string> = {
  running: 'Running',
  paused: 'Paused',
  idle: 'Ready',
};

export const PomodoroView: React.FC<PomodoroViewProps> = ({ pomodoro }) => {
  const reduced = useReducedMotion();
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
  const SIZE = 260;
  const R = 120;
  const CIRC = 2 * Math.PI * R;
  const stroke = mode === 'focus' ? 'var(--accent)' : 'var(--info)';

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
    max: number,
    unit: string
  ) => (
    <Field label={label} htmlFor={`pom-${key}`} hint={`${min}–${max} ${unit}`}>
      <Input
        id={`pom-${key}`}
        type="number"
        min={min}
        max={max}
        step={1}
        value={settings[key]}
        onChange={(e) => updateSettings({ [key]: e.target.valueAsNumber })}
      />
    </Field>
  );

  return (
    <div>
      <PageHeader
        title="Pomodoro"
        description="Focus in short sessions with regular breaks. The timer keeps running while you use other pages."
      />

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Timer card */}
        <Card padding="lg" className="lg:col-span-7">
          <div className="flex flex-col items-center">
            <SegmentedControl
              ariaLabel="Timer mode"
              value={mode}
              onChange={(m) => switchMode(m as PomodoroMode)}
              options={[
                { value: 'focus', label: 'Focus' },
                { value: 'short', label: 'Short break' },
                { value: 'long', label: 'Long break' },
              ]}
            />

            <div className="relative my-6">
              <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={R}
                  fill="none"
                  stroke="var(--subtle)"
                  strokeWidth="10"
                />
                <circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={R}
                  fill="none"
                  stroke={stroke}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - progress)}
                  transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                  style={{
                    transition: reduced ? 'none' : 'stroke-dashoffset 1s linear',
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-6xl font-semibold tabular-nums text-ink">
                  {formatTime(remainingSec)}
                </span>
                <span className="text-[13px] text-ink-3 mt-1.5">
                  {STATUS_LABELS[status] || status} · {MODE_LABELS[mode]}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Button size="lg" icon={PrimaryIcon} onClick={primaryAction}>
                {primaryLabel}
              </Button>
              <Button size="lg" variant="secondary" icon={RotateCcw} onClick={reset}>
                Reset
              </Button>
              <Button size="lg" variant="ghost" icon={SkipForward} onClick={skip}>
                Skip
              </Button>
            </div>

            <p className="text-[13px] text-ink-3 text-center mt-5">
              {completedFocus} focus session{completedFocus === 1 ? '' : 's'} completed
              since the app opened · Long break after {untilLong} more
            </p>
          </div>
        </Card>

        {/* Settings card */}
        <Card className="lg:col-span-5">
          <CardHeader title="Timer settings" />
          <div className="grid grid-cols-2 gap-3">
            {settingField('Focus', 'focusMinutes', 1, 120, 'minutes')}
            {settingField('Short break', 'shortBreakMinutes', 1, 30, 'minutes')}
            {settingField('Long break', 'longBreakMinutes', 1, 60, 'minutes')}
            {settingField('Long break every', 'longBreakInterval', 2, 8, 'sessions')}
          </div>
          {status !== 'idle' && (
            <p className="text-[13px] text-warning-ink mt-3">
              Changes apply to the next session.
            </p>
          )}

          <div className="border-t border-line mt-5 pt-4">
            {notificationPermission === 'granted' ? (
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-success" aria-hidden />
                <span className="text-[13px] text-ink-2 flex-1">
                  Desktop notifications
                </span>
                <Badge tone="success">Enabled</Badge>
              </div>
            ) : notificationPermission === 'denied' ? (
              <div className="flex items-center gap-2">
                <BellOff className="w-4 h-4 text-ink-3" aria-hidden />
                <span className="text-[13px] text-ink-3 flex-1">
                  Notifications are blocked in browser settings. You'll still see in-app
                  alerts.
                </span>
                <Badge tone="neutral">Blocked</Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-ink-3" aria-hidden />
                <span className="text-[13px] text-ink-2 flex-1">
                  Get notified when a session ends
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={requestNotificationPermission}
                >
                  Enable
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
