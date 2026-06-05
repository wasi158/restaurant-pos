import { getElectronBridge } from './electronBridge';

/**
 * Opens the system print dialog. In Electron, uses `webContents.print()` via IPC
 * (renderer `window.print()` is often unreliable). In the browser, uses `window.print()`.
 */
export async function printReceipt(): Promise<void> {
  const bridge = getElectronBridge();
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
