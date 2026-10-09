import React from 'react';
import { cn } from '../../lib/cn';

interface StatProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: 'accent' | 'success' | 'warning' | 'danger' | 'info';
}

const TONES = {
  accent: 'text-accent',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
} as const;

export const Stat: React.FC<StatProps> = ({ label, value, hint, tone }) => (
  <div>
    <div className="text-[13px] text-ink-2">{label}</div>
    <div
      className={cn(
        'font-display text-2xl font-semibold tabular-nums mt-1',
        tone ? TONES[tone] : 'text-ink'
      )}
    >
      {value}
    </div>
    {hint && <div className="text-xs text-ink-3 mt-1">{hint}</div>}
  </div>
);
