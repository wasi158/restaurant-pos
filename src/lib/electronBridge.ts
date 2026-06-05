export type ElectronBridge = {
  platform?: string;
  printPage?: () => Promise<{ ok?: boolean; reason?: string } | void>;
  minimizeWindow?: () => Promise<void>;
  maximizeWindow?: () => Promise<{ maximized: boolean }>;
  closeWindow?: () => Promise<void>;
  isWindowMaximized?: () => Promise<boolean>;
  onMaximizedChange?: (callback: (maximized: boolean) => void) => () => void;
};

export function getElectronBridge(): ElectronBridge | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as Window & { electron?: ElectronBridge }).electron;
}

export function isElectronShell(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().includes(' electron/');
}

/** Windows uses native title-bar buttons; custom overlay is optional. */
export function useNativeWindowChrome(): boolean {
  return getElectronBridge()?.platform === 'win32';
}

export function hasElectronWindowControls(): boolean {
  const bridge = getElectronBridge();
  return typeof bridge?.minimizeWindow === 'function';
}

export async function invokeMinimize(): Promise<void> {
  await getElectronBridge()?.minimizeWindow?.();
}

export async function invokeMaximize(): Promise<boolean | undefined> {
  const result = await getElectronBridge()?.maximizeWindow?.();
  return result?.maximized;
}

export async function invokeClose(): Promise<void> {
  await getElectronBridge()?.closeWindow?.();
}
