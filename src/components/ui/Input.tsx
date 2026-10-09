import React from 'react';
import { cn } from '../../lib/cn';

const baseClass =
  'w-full rounded-control border border-line bg-surface px-3 text-base sm:text-sm text-ink placeholder:text-ink-3 transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-accent focus:ring-3 focus:ring-accent/20 disabled:opacity-60 aria-invalid:border-danger';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input ref={ref} className={cn(baseClass, 'h-10', className)} {...rest} />
  )
);
Input.displayName = 'Input';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...rest }, ref) => (
    <select ref={ref} className={cn(baseClass, 'h-10', className)} {...rest}>
      {children}
    </select>
  )
);
Select.displayName = 'Select';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...rest }, ref) => (
    <textarea ref={ref} className={cn(baseClass, 'py-2.5 min-h-24', className)} {...rest} />
  )
);
Textarea.displayName = 'Textarea';
