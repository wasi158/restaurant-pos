import React from 'react';
import { clsx } from 'clsx';

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={clsx('flex flex-col items-center justify-center py-16 text-center', className)}>
      {icon && (
        <div className="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 text-on-surface-variant">
          {icon}
        </div>
      )}
      <h3 className="font-bold font-headline text-on-surface text-lg mb-1">{title}</h3>
      {description && <p className="text-sm text-on-surface-variant max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
