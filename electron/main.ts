import { app, BrowserWindow } from 'electron';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';

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