import React from 'react';
import { clsx } from 'clsx';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={clsx('flex flex-col sm:flex-row sm:items-end justify-between gap-3', className)}>
      <div>
        <h1 className="text-xl font-bold font-headline text-on-surface">{title}</h1>
        {subtitle && <p className="text-xs text-on-surface-variant mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
