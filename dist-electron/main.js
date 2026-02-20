"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = require("path");
const isDev = process.env.NODE_ENV === 'development';
function createWindow() {
    const win = new electron_1.BrowserWindow({
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
    });
    if (isDev) {
        win.loadURL('http://localhost:5173');
    }
    else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => electron_1.app.quit());
