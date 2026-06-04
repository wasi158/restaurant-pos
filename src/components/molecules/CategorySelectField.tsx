import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Select } from '../atoms/Select';
import { AddCategoryModal } from './AddCategoryModal';
import { cn } from '../../lib/utils';

type Props = {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
  onAddCategory: (name: string) => { ok: true; name: string } | { ok: false; reason: string };
  fullWidth?: boolean;
  className?: string;
  addModalTitle?: string;
};

export function CategorySelectField({
  value,
  onChange,
  categories,
  onAddCategory,
  fullWidth,
  className,
  addModalTitle = 'Add category',
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className={cn('flex items-stretch gap-2', fullWidth && 'w-full', className)}>
        <Select
          value={value}
          onChange={onChange}
          options={categories}
          fullWidth={fullWidth}
          className="flex-1 min-w-0"
        />
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="shrink-0 w-11 rounded-xl border border-outline-variant bg-surface-container-high text-primary hover:bg-primary/10 hover:border-primary/40 transition-all flex items-center justify-center"
          title={addModalTitle}
          aria-label={addModalTitle}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
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
    </>
  );
}
