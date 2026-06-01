import React from 'react';
import { clsx } from 'clsx';

type CategoryFilterProps = {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
  className?: string;
};

export function CategoryFilter({ categories, active, onChange, className }: CategoryFilterProps) {
  return (
    <div className={clsx('flex gap-2 overflow-x-auto', className)}>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={clsx(
            'px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0',
            active === cat
              ? 'bg-primary text-on-primary-container shadow-sm'
              : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
          )}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
