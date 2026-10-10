import React from 'react';
import { cn } from '../../lib/cn';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div className="overflow-x-auto no-scrollbar">
      <div
        role="group"
        aria-label={ariaLabel}
        className="inline-flex rounded-control bg-subtle p-1 gap-1"
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                'h-8 px-3 rounded-[8px] text-[13px] font-medium transition-[background-color,color,box-shadow] duration-150 whitespace-nowrap',
                active ? 'bg-surface text-ink shadow-card' : 'text-ink-2 hover:text-ink'
              )}
            >
              {opt.label}
              {opt.count !== undefined && (
                <span className="text-ink-3 tabular-nums ml-1.5">{opt.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
