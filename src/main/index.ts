import { app, BrowserWindow, shell, globalShortcut } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { setupIpcHandlers } from './ipc';
import { agentProcess } from './services/agent-process';
import { toolManager } from './services/tool-manager';
import { trayManager } from './services/tray-manager';
import { InboxProcessor, type ProcessedFile } from './services/inbox-processor';
import { setMainWindow } from './ipc/chat';
import { loadWindowState, trackWindowState } from './services/window-state';
import { CLAUDEOS_HOME_DIR, INBOX_DIR, CONTEXT_DIR } from '../shared/config';

let mainWindow: BrowserWindow | null = null;
let inboxProcessor: InboxProcessor | null = null;

function createWindow(): void {
  // Load persisted window bounds
  const windowBounds = loadWindowState();

  mainWindow = new BrowserWindow({
    ...windowBounds,
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

  // Track window state changes for persistence
  trackWindowState(mainWindow);

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Set the main window for agent process, IPC handlers, tool manager, and tray
  agentProcess.setMainWindow(mainWindow);
  setMainWindow(mainWindow);
  toolManager.setMainWindow(mainWindow);
  trayManager.setMainWindow(mainWindow);

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

  // Create system tray
  trayManager.create();

  // Wire tool manager status changes to tray
  toolManager.on('statusChange', () => {
    const runningTools = toolManager.getRunningToolNames();
    trayManager.updateMenu(runningTools);
  });

  // Register global keyboard shortcuts
  globalShortcut.register('CommandOrControl+N', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('app:newConversation');
    }
  });

  globalShortcut.register('CommandOrControl+,', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('app:openSettings');
    }
  });

  // Start the agent process after window is created
  await agentProcess.start();

  // Initialize inbox processor after agent process is ready
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const claudeOSHome = join(homeDir, CLAUDEOS_HOME_DIR);

  inboxProcessor = new InboxProcessor({
    inboxPath: join(claudeOSHome, INBOX_DIR),
    contextPath: join(claudeOSHome, CONTEXT_DIR),
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

// Keep app running when windows are closed - tray keeps us alive
app.on('window-all-closed', () => {
  // Don't quit - the tray will keep the app running
  // On macOS, apps typically stay active until the user quits explicitly
  // On Windows/Linux, the tray handles this
});

// Clean shutdown
app.on('before-quit', () => {
  trayManager.setQuitting(true);
});

app.on('will-quit', async (event) => {
  event.preventDefault();

  // Unregister all shortcuts
  globalShortcut.unregisterAll();

  await inboxProcessor?.stop();
  await toolManager.shutdown();
  await agentProcess.stop();
  trayManager.destroy();
  app.exit(0);
});

// Export for use in IPC handlers
export { mainWindow, agentProcess, toolManager, inboxProcessor, trayManager };
