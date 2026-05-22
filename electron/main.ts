import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

ipcMain.handle('print-page', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { ok: false, reason: 'no-window' };
  return new Promise<{ ok: boolean; reason?: string }>((resolve) => {
    win.webContents.print(
      { silent: false, printBackground: true },
      (success, failureReason) => {
        resolve({
          ok: Boolean(success),
          reason: typeof failureReason === 'string' ? failureReason : String(failureReason ?? ''),
        });
      }
    );
  });
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    titleBarStyle: 'hidden',
    backgroundColor: '#0b1326',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  win.loadURL(startUrl);

  if (isDev) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
