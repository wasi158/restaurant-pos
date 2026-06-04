import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { AddCategoryModal } from './AddCategoryModal';

type CategoryFilterProps = {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
  className?: string;
  /** Show + to add a new category (not for filter-only lists like order status). */
  onAddCategory?: (name: string) => { ok: true; name: string } | { ok: false; reason: string };
  addModalTitle?: string;
};

export function CategoryFilter({
  categories,
  active,
  onChange,
  className,
  onAddCategory,
  addModalTitle = 'Add category',
}: CategoryFilterProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className={clsx('flex items-center gap-2', className)}>
        <div className="flex gap-2 overflow-x-auto min-w-0 flex-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onChange(cat)}
              className={clsx(
                'px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0',
                active === cat
                  ? 'bg-primary text-on-primary-container shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest',
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        {onAddCategory && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border border-dashed border-primary/50 text-primary bg-primary/10 hover:bg-primary/15 transition-all whitespace-nowrap"
            title={addModalTitle}
            aria-label={addModalTitle}
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        )}
      </div>
      {onAddCategory && (
        <AddCategoryModal
          open={modalOpen}
          title={addModalTitle}
          onClose={() => setModalOpen(false)}
          onSave={(name) => {
            const result = onAddCategory(name);
            if (result.ok) onChange(result.name);
            return result;
          }}
        />
      )}
    </>
  );
}
