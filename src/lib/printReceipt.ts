type ElectronBridge = {
  printPage?: () => Promise<{ ok?: boolean; reason?: string } | void>;
};

/**
 * Opens the system print dialog. In Electron, uses `webContents.print()` via IPC
 * (renderer `window.print()` is often unreliable). In the browser, uses `window.print()`.
 */
export async function printReceipt(): Promise<void> {
  const bridge = (typeof window !== 'undefined' ? (window as Window & { electron?: ElectronBridge }).electron : undefined) as
    | ElectronBridge
    | undefined;
  try {
    if (bridge?.printPage) {
      await bridge.printPage();
      return;
    }
  } catch {
    // fall through to window.print
  }
  window.print();
}
