import React, { CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { Minus, Maximize2, Minimize2, X } from 'lucide-react';
import { getElectronBridge, invokeClose, invokeMaximize, invokeMinimize } from '../../lib/electronBridge';

const noDragStyle: CSSProperties = { WebkitAppRegion: 'no-drag' };

type Props = {
  maximized: boolean;
  onMaximizedChange?: (maximized: boolean) => void;
};

export function WindowControls({ maximized, onMaximizedChange }: Props) {
  const run = async (action: 'minimize' | 'maximize' | 'close') => {
    if (!getElectronBridge()?.minimizeWindow) {
      console.error('[WindowControls] Preload not loaded. Run: npm run build:electron && restart electron:dev');
      return;
    }
    try {
      if (action === 'minimize') await invokeMinimize();
      else if (action === 'close') await invokeClose();
      else {
        const next = await invokeMaximize();
        if (typeof next === 'boolean') onMaximizedChange?.(next);
      }
    } catch (err) {
      console.error(`[WindowControls] ${action} failed`, err);
    }
  };

  const ui = (
    <div
      className="fixed top-0 right-0 z-[9999] flex items-center gap-1 p-2 pl-3 pointer-events-auto"
      style={noDragStyle}
      role="toolbar"
      aria-label="Window controls"
    >
      <button
        type="button"
        style={noDragStyle}
        onClick={() => void run('minimize')}
        title="Minimize"
        aria-label="Minimize window"
        className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface bg-surface-container-low border border-outline-variant shadow-sm hover:bg-surface-container-high transition-colors cursor-pointer"
      >
        <Minus className="w-4 h-4 stroke-[2.5] pointer-events-none" />
      </button>
      <button
        type="button"
        style={noDragStyle}
        onClick={() => void run('maximize')}
        title={maximized ? 'Restore' : 'Maximize'}
        aria-label={maximized ? 'Restore window' : 'Maximize window'}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface bg-surface-container-low border border-outline-variant shadow-sm hover:bg-surface-container-high transition-colors cursor-pointer"
      >
        {maximized ? (
          <Minimize2 className="w-4 h-4 stroke-[2.5] pointer-events-none" />
        ) : (
          <Maximize2 className="w-4 h-4 stroke-[2.5] pointer-events-none" />
        )}
      </button>
      <button
        type="button"
        style={noDragStyle}
        onClick={() => void run('close')}
        title="Close"
        aria-label="Close window"
        className="w-9 h-9 flex items-center justify-center rounded-lg text-on-surface bg-surface-container-low border border-outline-variant shadow-sm hover:bg-error hover:text-white transition-colors cursor-pointer"
      >
        <X className="w-4 h-4 stroke-[2.5] pointer-events-none" />
      </button>
    </div>
  );

  return createPortal(ui, document.body);
}
