import React, { useState, useEffect } from 'react';
import { ModalShell } from '../organisms/ModalShell';
import { Input } from '../atoms/Input';
import { FormField } from './FormField';

type Props = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onSave: (name: string) => { ok: true; name: string } | { ok: false; reason: string };
};

export function AddCategoryModal({ open, title = 'Add category', onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    const result = onSave(name);
    if (result.ok) {
      onClose();
      return;
    }
    setError('reason' in result ? result.reason : 'Could not add category.');
  };

  return (
    <ModalShell
      title={title}
      onClose={onClose}
      onSave={handleSave}
      saveLabel="Add category"
      saveDisabled={!name.trim()}
    >
      <FormField label="Category name" required>
        <Input
          value={name}
          onChange={(v) => {
            setName(v);
            setError(null);
          }}
          placeholder="e.g. Appetizers"
          fullWidth
          autoFocus
        />
      </FormField>
      {error && (
        <p className="text-sm text-error font-semibold bg-error/10 border border-error/30 rounded-xl px-3 py-2 mt-3">
          {error}
        </p>
      )}
    </ModalShell>
  );
}
