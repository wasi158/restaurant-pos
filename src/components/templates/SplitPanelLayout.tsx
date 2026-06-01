import React from 'react';
import { clsx } from 'clsx';

type SplitPanelLayoutProps = {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: string;
  rightWidth?: string;
  className?: string;
};

export function SplitPanelLayout({
  left,
  right,
  leftWidth = 'lg:w-[400px]',
  rightWidth = 'lg:flex-1',
  className,
}: SplitPanelLayoutProps) {
  return (
    <div className={clsx('flex flex-col lg:flex-row min-h-full overflow-x-hidden', className)}>
      <div className={clsx('w-full shrink-0 lg:border-r border-outline-variant overflow-y-auto', leftWidth)}>
        {left}
      </div>
      <div className={clsx('w-full overflow-y-auto', rightWidth)}>
        {right}
      </div>
    </div>
  );
}
