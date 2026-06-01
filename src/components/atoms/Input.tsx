import React from 'react';
import { clsx } from 'clsx';

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> & {
  onChange?: (value: string) => void;
  fullWidth?: boolean;
};

export function Input({ onChange, className, fullWidth, ...props }: InputProps) {
  return (
    <input
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      className={clsx(
        'bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface',
        'placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40',
        fullWidth ? 'w-full' : 'w-56',
        className
      )}
      {...props}
    />
  );
}
