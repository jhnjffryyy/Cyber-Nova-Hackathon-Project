import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
}) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center text-center',
      compact ? 'p-5' : 'rounded-card border border-dashed border-line-strong p-8'
    )}
  >
    <div className="h-10 w-10 rounded-full bg-subtle text-ink-3 flex items-center justify-center mb-3">
      <Icon className="w-5 h-5" aria-hidden />
    </div>
    <h3 className="text-sm font-semibold text-ink">{title}</h3>
    {description && (
      <p className="text-[13px] text-ink-2 max-w-sm mt-1">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
