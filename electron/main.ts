import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function getMainWindow(): BrowserWindow | null {
  if (mainWindow && !mainWindow.isDestroyed()) return mainWindow;
  return BrowserWindow.getAllWindows().find((w) => !w.isDestroyed()) ?? null;
}

function registerIpc() {
  ipcMain.handle('print-page', async () => {
    const win = getMainWindow();
    if (!win) return { ok: false, reason: 'no-window' };
    return new Promise<{ ok: boolean; reason?: string }>((resolve) => {
      win.webContents.print(
        { silent: false, printBackground: true },
        (success, failureReason) => {
          resolve({
            ok: Boolean(success),
            reason: typeof failureReason === 'string' ? failureReason : String(failureReason ?? ''),
          });
        },
      );
    });
  });

  ipcMain.handle('window-minimize', () => {
    getMainWindow()?.minimize();
  });

  ipcMain.handle('window-maximize', () => {
    const win = getMainWindow();
    if (!win) return { maximized: false };
    if (win.isMaximized()) {
      win.unmaximize();
      return { maximized: false };
    }
    win.maximize();
    return { maximized: true };
  });

  ipcMain.handle('window-is-maximized', () => getMainWindow()?.isMaximized() ?? false);

  ipcMain.handle('window-close', () => {
    getMainWindow()?.close();
  });
}

function createWindow() {
  const isMac = process.platform === 'darwin';
  const isWin = process.platform === 'win32';

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    autoHideMenuBar: true,
    ...(isWin
      ? {
          frame: true,
          titleBarOverlay: {
            color: '#121826',
            symbolColor: '#f5f5f5',
            height: 48,
          },
        }
      : isMac
        ? { frame: true, titleBarStyle: 'hidden' as const }
        : { frame: false }),
    backgroundColor: '#0b1326',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  const win = mainWindow;

  win.on('maximize', () => win.webContents.send('window-maximized-changed', true));
  win.on('unmaximize', () => win.webContents.send('window-maximized-changed', false));

  const isDev = !app.isPackaged;

  if (isDev) {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  win.once('ready-to-show', () => win.show());

  if (isDev) {
    win.webContents.on('did-finish-load', () => {
      win.webContents
        .executeJavaScript('Boolean(window.electron?.minimizeWindow)')
        .then((ok) => {
          if (!ok) console.warn('[electron] Preload bridge missing — run: npm run build:electron');
        })
        .catch(() => {});
    });
  }

  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
