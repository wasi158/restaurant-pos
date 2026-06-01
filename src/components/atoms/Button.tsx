import React from 'react';
import { clsx } from 'clsx';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
};

const variantStyles: Record<Variant, string> = {
  primary:   'bg-primary text-on-primary-container font-semibold hover:brightness-105 shadow-md',
  secondary: 'bg-surface-container-high border border-outline-variant text-on-surface font-semibold hover:bg-surface-container-highest',
  danger:    'bg-error text-white font-semibold hover:brightness-105 shadow-md',
  ghost:     'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high',
  outline:   'border border-outline-variant text-on-surface font-semibold hover:bg-surface-container-high',
};

const sizeStyles: Record<Size, string> = {
  sm:   'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md:   'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg:   'px-5 py-3 text-sm rounded-xl gap-2',
  icon: 'w-8 h-8 rounded-xl justify-center',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center transition-all cursor-pointer',
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-40 cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
