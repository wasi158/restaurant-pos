import React from 'react';
import { clsx } from 'clsx';

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> & {
  options: Array<{ value: string; label: string }> | string[];
  onChange?: (value: string) => void;
  fullWidth?: boolean;
};

export function Select({ options, onChange, className, fullWidth, ...props }: SelectProps) {
  return (
    <select
      onChange={onChange ? (e) => onChange(e.target.value) : undefined}
      className={clsx(
        'bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface',
        'focus:outline-none focus:ring-2 focus:ring-primary/40',
        fullWidth ? 'w-full' : 'w-56',
        className
      )}
      {...props}
    >
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        return <option key={val} value={val}>{label}</option>;
      })}
    </select>
  );
}
