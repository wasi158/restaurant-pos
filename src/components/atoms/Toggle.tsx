import React from 'react';

type ToggleProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export function Toggle({ value, onChange, disabled }: ToggleProps) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      className={`relative rounded-full transition-colors ${value ? 'bg-primary' : 'bg-surface-container-highest'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ height: 22, width: 40 }}
      disabled={disabled}
    >
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}
