import { app, BrowserWindow, dialog } from 'electron';
import path from 'path';
import { updateElectronApp, UpdateSourceType } from 'update-electron-app';

const isDev = process.env.NODE_ENV === 'development';

function showVersionInfo(mainWindow: BrowserWindow) {
  const currentVersion = app.getVersion();
  dialog.showMessageBox(mainWindow, {
    title: 'Version Information',
    message: `Current Version: ${currentVersion}`,
    detail: 'Checking for updates...',
    buttons: ['OK']
  });
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  // Set up error handling
  mainWindow.webContents.on('did-fail-load', (_, code, description) => {
    console.error('Failed to load:', code, description);
    // Retry loading after a short delay
    setTimeout(() => {
      console.log('Retrying to load...');
      if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
      } else {
        const indexPath = path.join(__dirname, '../dist/index.html');
        mainWindow.loadFile(indexPath);
      }
    }, 1000);
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    try {
      const indexPath = path.join(__dirname, '../dist/index.html');
      console.log('Loading from:', indexPath);
      mainWindow.loadFile(indexPath).catch(err => {
        console.error('Error loading file:', err);
      });
    } catch (err) {
      console.error('Error in production load:', err);
    }
  }

  // // Show version info after window is ready
  // mainWindow.webContents.on('did-finish-load', () => {
  //   showVersionInfo(mainWindow);
  // });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
  });

  process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
  });
}

app.whenReady().then(() => {
  console.log('App is ready');
  // Initialize auto-updates
  if (!isDev) {
    updateElectronApp({
      updateInterval: '1 hour',
      logger: console,
      notifyUser: true,
      updateSource: {
        type: UpdateSourceType.ElectronPublicUpdateService,
      }
    });
  }
  
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