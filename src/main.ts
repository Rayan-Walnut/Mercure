import { app, BrowserWindow } from 'electron';
import path from 'path';

function createWindow(): void {
  const iconPath = path.join(app.getAppPath(), 'public', 'favicon.ico');
  const isWindows = process.platform === 'win32';

  const win = new BrowserWindow({
    width: 900,
    height: 600,
    backgroundColor: '#0D0D0D',
    titleBarStyle: 'hidden',
    ...(isWindows
      ? {
          titleBarOverlay: {
            color: '#151515',
            symbolColor: '#F4F4F5',
            height: 34,
          },
        }
      : {}),
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  win.loadFile(path.join(app.getAppPath(), 'src', 'view', 'login.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
