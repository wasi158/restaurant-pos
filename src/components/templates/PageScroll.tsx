import React from 'react';
import { cn } from '../../lib/utils';

type Props = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Fills the main content pane (below TopBar) and grows with content.
 * The app shell scrolls this wrapper so bottom actions stay reachable.
 */
export function PageScroll({ children, className }: Props) {
  return (
    <div
      className={cn(
        'w-full min-h-full box-border pb-8 sm:pb-10',
        className,
      )}
    >
      {children}
    </div>
  );
}
