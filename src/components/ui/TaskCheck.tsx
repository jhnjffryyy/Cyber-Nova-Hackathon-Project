import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/cn';

interface TaskCheckProps {
  checked: boolean;
  label: string;
  onToggle: () => void;
}

export const TaskCheck: React.FC<TaskCheckProps> = ({ checked, label, onToggle }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={label}
    onClick={onToggle}
    className={cn(
      'press w-[18px] h-[18px] rounded-[6px] border border-line-strong flex items-center justify-center shrink-0 transition-[background-color,border-color] duration-150',
      checked && 'bg-accent border-accent text-on-accent'
    )}
  >
    {checked && <Check className="w-3 h-3" aria-hidden />}
  </button>
);
