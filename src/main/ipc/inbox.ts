/**
 * Inbox IPC Handlers
 * Exposes inbox processor functionality to the renderer process
 */

import { ipcMain } from 'electron';
import { inboxProcessor } from '../index';

export function setupInboxHandlers(): void {
  // Get inbox directory path
  ipcMain.handle('inbox:getPath', (): string => {
    return inboxProcessor?.getInboxPath() || '';
  });

  // Get context directory path
  ipcMain.handle('inbox:getContextPath', (): string => {
    return inboxProcessor?.getContextPath() || '';
  });

  console.log('[Inbox IPC] Handlers registered');
}
