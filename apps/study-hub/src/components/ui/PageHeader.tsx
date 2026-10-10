import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
}) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
    <div>
      <h1 className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-ink">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-ink-2 mt-1 max-w-2xl">{description}</p>
      )}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);
