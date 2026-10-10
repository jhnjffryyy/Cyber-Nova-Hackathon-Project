import React from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-soft';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover shadow-card',
  secondary: 'bg-surface text-ink border border-line hover:bg-subtle hover:border-line-strong',
  ghost: 'text-ink-2 hover:bg-subtle hover:text-ink',
  danger: 'bg-danger text-white hover:opacity-90',
  'danger-soft': 'text-danger-ink hover:bg-danger-soft',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px]',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-11 px-5 text-sm',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    className={cn(
      'press inline-flex items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow] duration-150 disabled:opacity-50 disabled:pointer-events-none',
      VARIANTS[variant],
      SIZES[size],
      className
    )}
    {...rest}
  >
    {loading ? (
      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
    ) : (
      Icon && <Icon className="w-4 h-4" aria-hidden />
    )}
    {children}
  </button>
);
