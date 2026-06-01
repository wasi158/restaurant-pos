import React from 'react';
import { clsx } from 'clsx';

type CardProps = {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  selected?: boolean;
  onClick?: () => void;
};

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({ children, className, padding = 'md', interactive, selected, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-surface-container-high rounded-2xl border border-outline-variant',
        paddingMap[padding],
        interactive && 'cursor-pointer hover:bg-surface-container-highest transition-all',
        selected && 'ring-2 ring-primary border-primary',
        className
      )}
    >
      {children}
    </div>
  );
}
