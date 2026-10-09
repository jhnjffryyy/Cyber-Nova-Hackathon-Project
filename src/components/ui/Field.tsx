import React from 'react';

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export const Field: React.FC<FieldProps> = ({
  label,
  htmlFor,
  hint,
  error,
  children,
}) => (
  <div>
    <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink mb-1.5 block">
      {label}
    </label>
    {children}
    {error ? (
      <p className="text-xs text-danger-ink mt-1.5">{error}</p>
    ) : hint ? (
      <p className="text-xs text-ink-3 mt-1.5">{hint}</p>
    ) : null}
  </div>
);
