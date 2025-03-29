import { app, BrowserWindow } from 'electron';
import path from 'path';
import url from 'url';

const isDev = process.env.NODE_ENV === 'development';

function createWindow(): void {
  // Enable logging
  console.log('Creating window...');
  console.log('Development mode:', isDev);
  console.log('Process type:', process.type);
  console.log('Process versions:', process.versions);

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      devTools: true
    }
  });

  // Load the app
  if (isDev) {
    console.log('Loading development URL...');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the index.html file
    const appPath = app.getAppPath();
    const indexPath = path.join(appPath, 'dist/index.html');
    
    // Format the file URL properly
    const fileUrl = url.format({
      pathname: indexPath,
      protocol: 'file:',
      slashes: true
    });
    
    console.log('App path:', appPath);
    console.log('Index path:', indexPath);
    console.log('Loading URL:', fileUrl);
    
    // Check if the files exist
    const fs = require('fs');
    try {
      if (fs.existsSync(indexPath)) {
        console.log('index.html found at:', indexPath);
        const distDir = path.dirname(indexPath);
        const assetsDir = path.join(distDir, 'assets');
        
        console.log('Assets directory:', assetsDir);
        if (fs.existsSync(assetsDir)) {
          const assets = fs.readdirSync(assetsDir);
          console.log('Assets directory contents:', assets);
          
          // Check specific files
          const jsFile = assets.find(f => f.endsWith('.js'));
          const cssFile = assets.find(f => f.endsWith('.css'));
          console.log('JS file found:', jsFile);
          console.log('CSS file found:', cssFile);
        } else {
          console.error('Assets directory not found');
        }
      } else {
        console.error('index.html not found at:', indexPath);
        console.log('Current directory structure:');
        function listDirRecursive(dir: string, level = 0) {
          const items = fs.readdirSync(dir);
          items.forEach(item => {
            const fullPath = path.join(dir, item);
            console.log('  '.repeat(level) + '- ' + item);
            if (fs.statSync(fullPath).isDirectory()) {
              listDirRecursive(fullPath, level + 1);
            }
          });
        }
        listDirRecursive(appPath);
      }
    } catch (error) {
      console.error('Error checking files:', error);
    }
    
    try {
      // Set up error handling before loading
      mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load:', { errorCode, errorDescription });
        console.log('Current URL:', mainWindow.webContents.getURL());
        
        // Try to load the file again with a slight delay
        setTimeout(() => {
          console.log('Retrying to load file...');
          mainWindow.loadURL(fileUrl);
        }, 1000);
      });
      
      mainWindow.webContents.on('did-finish-load', () => {
        console.log('Page loaded successfully');
        console.log('Current URL:', mainWindow.webContents.getURL());
      });
      
      mainWindow.webContents.on('console-message', (event, level, message) => {
        console.log('Renderer console:', message);
      });
      
      // Load the file
      mainWindow.loadURL(fileUrl);
      
      // Open DevTools in production for debugging
      mainWindow.webContents.openDevTools();
    } catch (error) {
      console.error('Error loading the app:', error);
    }
  }

  // Handle window resize
  mainWindow.on('resize', () => {
    mainWindow.webContents.send('window-resize');
  });
}

// Log any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

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