import { app, BrowserWindow } from 'electron'
import * as path from 'path'

const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 500,
    icon: path.join(__dirname, '../public/favicon.ico'),
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#131413',
      symbolColor: '#d4d4d8',
      height: 36,
    },
    backgroundColor: '#131413',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => app.quit())
