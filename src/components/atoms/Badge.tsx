import React from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  dot?: boolean;
  className?: string;
};

const variantStyles: Record<BadgeVariant, { bg: string; text: string; dotColor: string }> = {
  success: { bg: 'bg-secondary/10',                    text: 'text-secondary',         dotColor: 'bg-secondary' },
  warning: { bg: 'bg-tertiary/10',                     text: 'text-tertiary',          dotColor: 'bg-tertiary' },
  error:   { bg: 'bg-error/10',                        text: 'text-error',             dotColor: 'bg-error' },
  info:    { bg: 'bg-primary/10',                      text: 'text-primary',           dotColor: 'bg-primary' },
  neutral: { bg: 'bg-surface-container-highest',       text: 'text-on-surface-variant', dotColor: 'bg-on-surface-variant' },
};

export function Badge({ children, variant = 'neutral', icon, dot, className }: BadgeProps) {
  const styles = variantStyles[variant];
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
      styles.bg, styles.text,
      className
    )}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', styles.dotColor)} />}
      {icon}
      {children}
    </span>
  );
}
