import React from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { Button } from '../atoms/Button';

type ModalShellProps = {
  title: string;
  onClose: () => void;
  onSave?: () => void;
  saveLabel?: string;
  saveDisabled?: boolean;
  maxWidth?: string;
  children: React.ReactNode;
};

export function ModalShell({
  title,
  onClose,
  onSave,
  saveLabel = 'Save',
  saveDisabled,
  maxWidth = 'max-w-lg',
  children,
}: ModalShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`relative bg-surface-container-low border border-outline-variant rounded-2xl w-full ${maxWidth} shadow-2xl z-10`}
      >
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <h2 className="font-bold font-headline text-on-surface text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">{children}</div>

        {onSave && (
          <div className="flex gap-3 p-5 border-t border-outline-variant">
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button variant="primary" onClick={onSave} disabled={saveDisabled} className="flex-1">{saveLabel}</Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
