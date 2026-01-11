import { ipcMain, app } from 'electron';
import { setupChatHandlers } from './chat';

export function setupIpcHandlers(): void {
  // App handlers
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });

  ipcMain.handle('app:getPlatform', () => {
    return process.platform;
  });

  // Chat handlers
  setupChatHandlers();

  console.log('IPC handlers initialized');
}

export { sendMessageToRenderer } from './chat';
