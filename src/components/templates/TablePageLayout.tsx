import React from 'react';
import { clsx } from 'clsx';

type TablePageLayoutProps = {
  header: React.ReactNode;
  stats?: React.ReactNode;
  filters?: React.ReactNode;
  table: React.ReactNode;
  pagination?: React.ReactNode;
  modals?: React.ReactNode;
  className?: string;
};

export function TablePageLayout({
  header,
  stats,
  filters,
  table,
  pagination,
  modals,
  className,
}: TablePageLayoutProps) {
  return (
    <div className={clsx('min-h-full overflow-x-hidden flex flex-col p-4 sm:p-6', className)}>
      {header}
      {stats && <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">{stats}</div>}
      {filters && <div className="mt-5">{filters}</div>}
      <div className="mt-5 flex-1 bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden">
        {table}
      </div>
      {pagination && <div className="mt-4">{pagination}</div>}
      {modals}
    </div>
  );
}
