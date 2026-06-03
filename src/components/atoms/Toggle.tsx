import React from 'react';
import { clsx } from 'clsx';

type ToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
};

export function Toggle({ value, onChange, disabled, className, 'aria-label': ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!value)}
      className={clsx(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        'h-6 w-11',
        value
          ? 'bg-primary border-2 border-primary'
          : 'bg-surface-container-highest border-2 border-outline-variant',
        disabled ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer',
        className,
      )}
    >
      <span
        aria-hidden
        className={clsx(
          'pointer-events-none inline-block h-4 w-4 rounded-full shadow-md transition-transform duration-200 ease-out',
          value
            ? 'translate-x-5 bg-on-primary-container'
            : 'translate-x-0.5 bg-on-surface',
        )}
      />
    </button>
  );
}
