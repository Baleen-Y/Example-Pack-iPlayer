import {
  app,
  BrowserWindow,
  shell,
  dialog,
  ipcMain,
  screen,
  Menu,
  globalShortcut,
} from 'electron';
import path from 'path';
declare const ENVIRONMENT: String;

const DEV_SERVER_BASE_URL = 'http://localhost:9000'; // must match webpack dev server port.
const HTML_FILE_BASE_PATH = 'renderer';
const isDev = ENVIRONMENT == 'development';
const downloadMap: {
  [key: string]: { projectId: string; projectPath: string };
} = {};
const downloadQueue: string[] = [];
function createWindow(): BrowserWindow | null {
  let win: BrowserWindow | null = new BrowserWindow({
    width: 800,
    height: 600,
    // titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      // allowRunningInsecureContent: true,
      preload: path.join(__dirname, './preload/preload.js'),
    },
  });
  if (isDev) {
    win.loadURL(DEV_SERVER_BASE_URL);
  } else {
    win.loadFile(HTML_FILE_BASE_PATH + '/index.html');
  }
  return win;
}
let mainWindow: BrowserWindow | null;
app.whenReady().then(() => {
  mainWindow = createWindow();
  if (!mainWindow)

  app.on('window-all-closed', () => {
    if (process.platform != 'darwin') {
      app.quit();
    }
  }); });


