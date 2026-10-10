import React from 'react';
import { cn } from '../../lib/cn';

interface ProgressBarProps {
  value: number;
  tone?: 'accent' | 'success' | 'warning' | 'danger';
  label: string;
  size?: 'sm' | 'md';
}

const FILLS = {
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
} as const;

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  tone = 'accent',
  label,
  size = 'sm',
}) => {
  const v = Math.min(1, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      className={cn('rounded-full bg-subtle overflow-hidden', size === 'md' ? 'h-2' : 'h-1.5')}
    >
      <div
        className={cn(
          'h-full w-full origin-left rounded-full transition-transform duration-300 ease-out',
          FILLS[tone]
        )}
        style={{ transform: `scaleX(${v})` }}
      />
    </div>
  );
};
