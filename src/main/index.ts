import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { setupIpcHandlers } from './ipc';
import { agentProcess } from './services/agent-process';
import { toolManager } from './services/tool-manager';
import { InboxProcessor, type ProcessedFile } from './services/inbox-processor';
import { setMainWindow } from './ipc/chat';

let mainWindow: BrowserWindow | null = null;
let inboxProcessor: InboxProcessor | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'ClaudeOS',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Set the main window for agent process, IPC handlers, and tool manager
  agentProcess.setMainWindow(mainWindow);
  setMainWindow(mainWindow);
  toolManager.setMainWindow(mainWindow);

  // Load the renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.claudeos');

  // Setup IPC handlers
  setupIpcHandlers();

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  // Initialize tool manager (loads tools, starts autostart tools)
  await toolManager.initialize();

  // Start the agent process after window is created
  await agentProcess.start();

  // Initialize inbox processor after agent process is ready
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const claudeOSHome = join(homeDir, 'ClaudeOS');

  inboxProcessor = new InboxProcessor({
    inboxPath: join(claudeOSHome, 'inbox'),
    contextPath: join(claudeOSHome, 'context'),
    onFileProcessed: async (file: ProcessedFile) => {
      // Index in context brain via agent process
      if (file.text) {
        agentProcess.send({
          type: 'context:add',
          payload: {
            path: file.newPath,
            text: file.text,
            type: file.fileType
          }
        });
      }
      console.log(`[Main] Indexed file: ${file.fileName} in ${file.category}`);
    }
  });

  if (mainWindow) {
    inboxProcessor.setMainWindow(mainWindow);
  }

  await inboxProcessor.start();

  app.on('activate', function () {
    // On macOS, re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Clean shutdown
app.on('before-quit', async () => {
  await inboxProcessor?.stop();
  await toolManager.shutdown();
  await agentProcess.stop();
});

// Export for use in IPC handlers
export { mainWindow, agentProcess, toolManager, inboxProcessor };
