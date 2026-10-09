import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { IconButton } from './IconButton';

type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
};

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: Size;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    prevFocusRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>('[data-autofocus], [autofocus]');
      (first || panel).focus();
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = '';
      prevFocusRef.current?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled'));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={cn(
              'relative w-full bg-surface border border-line shadow-pop rounded-t-card sm:rounded-card max-h-[90dvh] overflow-y-auto focus:outline-none',
              SIZES[size]
            )}
            initial={{ opacity: 0, transform: 'translateY(8px) scale(0.98)' }}
            animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
            exit={{ opacity: 0, transform: 'translateY(8px) scale(0.98)' }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5">
              <div className="min-w-0">
                <h2 id={titleId} className="text-base font-semibold text-ink">
                  {title}
                </h2>
                {description && (
                  <p className="text-[13px] text-ink-2 mt-0.5">{description}</p>
                )}
              </div>
              <IconButton icon={X} label="Close" onClick={onClose} size="sm" />
            </div>
            <div className="px-5 sm:px-6 py-5">{children}</div>
            {footer && (
              <div className="flex justify-end gap-2 border-t border-line px-5 sm:px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
