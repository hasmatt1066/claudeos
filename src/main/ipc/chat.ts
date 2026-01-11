import { ipcMain, BrowserWindow } from 'electron';

export interface ChatResponse {
  success: boolean;
  response: string;
}

export function setupChatHandlers(): void {
  ipcMain.handle('chat:send', async (_event, message: string): Promise<ChatResponse> => {
    // Placeholder - will connect to agent in Phase 6
    console.log('Received message via IPC:', message);

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 500));

    return {
      success: true,
      response: "I'm ClaudeOS. I received your message via IPC! Agent integration coming in Phase 6."
    };
  });
}

export function sendMessageToRenderer(window: BrowserWindow, data: unknown): void {
  window.webContents.send('chat:message', data);
}
