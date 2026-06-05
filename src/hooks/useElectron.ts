import { useCallback, useEffect, useState } from 'react';
import {
  getElectronBridge,
  hasElectronWindowControls,
  invokeClose,
  invokeMaximize,
  invokeMinimize,
  isElectronShell,
  useNativeWindowChrome,
} from '../lib/electronBridge';

export function useElectron() {
  const [controlsReady, setControlsReady] = useState(hasElectronWindowControls);
  const [maximized, setMaximized] = useState(false);
  const nativeChrome = useNativeWindowChrome();

  useEffect(() => {
    const sync = () => {
      if (hasElectronWindowControls()) {
        setControlsReady(true);
        getElectronBridge()?.isWindowMaximized?.().then(setMaximized).catch(() => {});
        return true;
      }
      return false;
    };
    if (sync()) return;
    if (!isElectronShell()) return;

    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      if (sync() || n > 50) window.clearInterval(id);
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!controlsReady) return;
    return getElectronBridge()?.onMaximizedChange?.(setMaximized);
  }, [controlsReady]);

  const minimizeWindow = useCallback(() => invokeMinimize(), []);
  const maximizeWindow = useCallback(async () => {
    const next = await invokeMaximize();
    if (typeof next === 'boolean') setMaximized(next);
  }, []);
  const closeWindow = useCallback(() => invokeClose(), []);

  return {
    isElectron: isElectronShell(),
    /** Custom in-app buttons (mac/linux). Windows uses native title bar. */
    showCustomWindowControls: isElectronShell() && !nativeChrome && controlsReady,
    nativeChrome,
    maximized,
    setMaximized,
    minimizeWindow,
    maximizeWindow,
    closeWindow,
  };
}
