import React from 'react';
import { clsx } from 'clsx';

type FormFieldProps = {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  horizontal?: boolean;
};

export function FormField({ label, hint, required, children, className, horizontal }: FormFieldProps) {
  if (horizontal) {
    return (
      <div className={clsx('flex items-start justify-between gap-6 py-4 border-b border-outline-variant last:border-0', className)}>
        <div className="min-w-0">
          <p className="text-sm font-medium text-on-surface">
            {label}{required && <span className="text-error ml-0.5">*</span>}
          </p>
          {hint && <p className="text-xs text-on-surface-variant mt-0.5">{hint}</p>}
        </div>
        <div className="shrink-0">{children}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
        {label}{required && <span className="text-error ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-on-surface-variant mt-1">{hint}</p>}
    </div>
  );
}
