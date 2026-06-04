import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

type Props = {
  children: React.ReactNode;
  /** Section label beside the toggle. */
  title?: string;
  /** Persist show/hide per page in localStorage. */
  storageKey?: string;
  defaultOpen?: boolean;
  className?: string;
  gridClassName?: string;
  /** grid = stat cards in a grid; inline = horizontal chips (e.g. kitchen header). */
  layout?: 'grid' | 'inline';
};

function readStored(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === '0') return false;
    if (v === '1') return true;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function CollapsibleStatsPanel({
  children,
  title = 'Stats',
  storageKey,
  defaultOpen = true,
  className,
  gridClassName = 'grid grid-cols-2 sm:grid-cols-4 gap-4',
  layout = 'grid',
}: Props) {
  const [open, setOpen] = useState(() =>
    storageKey ? readStored(storageKey, defaultOpen) : defaultOpen,
  );

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, open ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [open, storageKey]);

  return (
    <section className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          <BarChart3 className="w-4 h-4 text-primary shrink-0" aria-hidden />
          <span>{title}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={storageKey ? `${storageKey}-stats-grid` : undefined}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-outline-variant bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:border-primary/40 transition-all shrink-0"
        >
          {open ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" aria-hidden />
              Hide stats
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" aria-hidden />
              Show stats
            </>
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={storageKey ? `${storageKey}-stats-grid` : undefined}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                layout === 'inline'
                  ? 'flex flex-wrap items-center gap-2 pt-0.5'
                  : cn(gridClassName, 'pt-0.5'),
              )}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
