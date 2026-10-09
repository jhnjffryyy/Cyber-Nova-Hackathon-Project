import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export const cardClass =
  'bg-surface border border-line rounded-card shadow-card';

export const cardInteractiveClass =
  'text-left transition-[border-color,box-shadow] duration-150 hover:border-line-strong';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  padding = 'md',
  className,
  children,
  ...rest
}) => (
  <div
    className={cn(
      cardClass,
      padding === 'md' && 'p-5',
      padding === 'lg' && 'p-5 sm:p-6',
      className
    )}
    {...rest}
  >
    {children}
  </div>
);

interface CardHeaderProps {
  title: string;
  icon?: LucideIcon;
  description?: string;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  icon: Icon,
  description,
  action,
}) => (
  <div
    className={cn(
      'flex justify-between gap-3 mb-4',
      description ? 'items-start' : 'items-center'
    )}
  >
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-ink-3 shrink-0" aria-hidden />}
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
      </div>
      {description && (
        <p className="text-[13px] text-ink-2 mt-0.5">{description}</p>
      )}
    </div>
    {action && <div className="-my-1.5 -mr-2 shrink-0">{action}</div>}
  </div>
);
