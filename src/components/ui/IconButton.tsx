import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  variant?: 'ghost' | 'secondary';
  size?: 'sm' | 'md';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  label,
  variant = 'ghost',
  size = 'md',
  type = 'button',
  className,
  ...rest
}) => (
  <button
    type={type}
    aria-label={label}
    title={label}
    className={cn(
      'press inline-flex items-center justify-center rounded-control transition-[background-color,border-color,color] duration-150 disabled:opacity-50 disabled:pointer-events-none',
      size === 'sm' ? 'h-8 w-8' : 'h-9 w-9',
      variant === 'ghost'
        ? 'text-ink-2 hover:bg-subtle hover:text-ink'
        : 'bg-surface text-ink border border-line hover:bg-subtle hover:border-line-strong',
      className
    )}
    {...rest}
  >
    <Icon className="w-4 h-4" aria-hidden />
  </button>
);
