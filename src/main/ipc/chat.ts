import { ipcMain, BrowserWindow } from 'electron';
import { agentProcess } from '../services/agent-process';

export interface ChatResponse {
  success: boolean;
  response: string;
}

// Track pending chat requests for response routing
const pendingRequests = new Map<string, (response: ChatResponse) => void>();

export function setupChatHandlers(): void {
  ipcMain.handle('chat:send', async (_event, message: string): Promise<ChatResponse> => {
    console.log('Received message via IPC:', message);

    // Check if agent process is running
    if (!agentProcess.isRunning()) {
      return {
        success: false,
        response: 'Agent process is not running. Please wait...'
      };
    }

    // Create a unique request ID
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create a promise that will be resolved when worker responds
    const responsePromise = new Promise<ChatResponse>((resolve) => {
      // Set timeout for response
      const timeout = setTimeout(() => {
        pendingRequests.delete(requestId);
        resolve({
          success: false,
          response: 'Request timed out. Please try again.'
        });
      }, 30000);

      pendingRequests.set(requestId, (response) => {
        clearTimeout(timeout);
        pendingRequests.delete(requestId);
        resolve(response);
      });
    });

    // Send message to worker
    agentProcess.send({
      type: 'chat',
      payload: {
        message,
        requestId
      }
    });

    return responsePromise;
  });
}

// Handle responses from worker
export function handleWorkerResponse(data: {
  type: string;
  payload?: { success?: boolean; content?: string; requestId?: string };
}): void {
  if (data.type === 'chat:response' && data.payload) {
    const { requestId, success, content } = data.payload;

    // Find and resolve the pending request
    if (requestId) {
      const resolver = pendingRequests.get(requestId);
      if (resolver) {
        resolver({
          success: success ?? true,
          response: content ?? ''
        });
      }
    }
  }
}

export function sendMessageToRenderer(window: BrowserWindow, data: unknown): void {
  window.webContents.send('chat:message', data);
}
