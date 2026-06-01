import React from 'react';
import { clsx } from 'clsx';

type AvatarProps = {
  name: string;
  image?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

function initials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

export function Avatar({ name, image, size = 'md', className }: AvatarProps) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className={clsx('rounded-full object-cover shrink-0', sizeMap[size], className)}
      />
    );
  }

  return (
    <div className={clsx(
      'rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0',
      sizeMap[size],
      className
    )}>
      {initials(name)}
    </div>
  );
}
