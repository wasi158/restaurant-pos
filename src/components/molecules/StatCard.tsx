import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { clsx } from 'clsx';

type StatCardProps = {
  label: string;
  value: string | number;
  change?: string;
  up?: boolean;
  icon?: React.ReactNode;
  className?: string;
};

export function StatCard({ label, value, change, up, icon, className }: StatCardProps) {
  return (
    <div className={clsx(
      'bg-surface-container-high rounded-2xl border border-outline-variant p-4',
      className
    )}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-on-surface-variant">{label}</p>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
      <p className="text-xl font-bold font-headline text-on-surface">{value}</p>
      {change && (
        <div className={clsx('flex items-center gap-1 mt-1 text-xs font-semibold', up ? 'text-secondary' : 'text-error')}>
          {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change}
        </div>
      )}
    </div>
  );
}
