import React from 'react';
import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { Button } from '../atoms/Button';

type ConfirmDialogProps = {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  icon?: React.ReactNode;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-surface-container-low border border-outline-variant rounded-2xl w-full max-w-sm shadow-2xl z-10 p-6 text-center"
      >
        <div className={`w-12 h-12 rounded-full ${variant === 'danger' ? 'bg-error/10' : 'bg-primary/10'} flex items-center justify-center mx-auto mb-4`}>
          {icon ?? <Trash2 className={`w-5 h-5 ${variant === 'danger' ? 'text-error' : 'text-primary'}`} />}
        </div>
        <h3 className="font-bold font-headline text-on-surface text-lg mb-1">{title}</h3>
        <div className="text-sm text-on-surface-variant mb-6">{message}</div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">{cancelLabel}</Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} className="flex-1">{confirmLabel}</Button>
        </div>
      </motion.div>
    </div>
  );
}
