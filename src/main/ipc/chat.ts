import { ipcMain, BrowserWindow } from 'electron';
import { agentProcess } from '../services/agent-process';

export interface ChatResponse {
  success: boolean;
  response: string;
  sessionId?: string;
}

// Track pending chat requests for response routing
const pendingRequests = new Map<string, (response: ChatResponse) => void>();

// Store the main window reference for streaming
let mainWindowRef: BrowserWindow | null = null;

export function setMainWindow(window: BrowserWindow): void {
  mainWindowRef = window;
}

export function setupChatHandlers(): void {
  ipcMain.handle('chat:send', async (_event, message: string, sessionId?: string): Promise<ChatResponse> => {
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
      // Set timeout for response (2 minutes for long operations)
      const timeout = setTimeout(() => {
        pendingRequests.delete(requestId);
        resolve({
          success: false,
          response: 'Request timed out. Please try again.'
        });
      }, 120000);

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
        requestId,
        sessionId
      }
    });

    return responsePromise;
  });
}

// Handle responses from worker
export function handleWorkerResponse(data: {
  type: string;
  payload?: {
    success?: boolean;
    content?: string;
    requestId?: string;
    sessionId?: string;
    error?: string;
    tool?: string;
    input?: unknown;
    cost?: number;
    usage?: unknown;
  };
}): void {
  const { type, payload } = data;
  const requestId = payload?.requestId;

  // Forward streaming events to renderer
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    switch (type) {
      case 'chat:stream:start':
        mainWindowRef.webContents.send('chat:stream', {
          type: 'start',
          requestId
        });
        break;

      case 'chat:stream:chunk':
        mainWindowRef.webContents.send('chat:stream', {
          type: 'chunk',
          content: payload?.content,
          requestId
        });
        break;

      case 'chat:tool':
        console.log('[IPC] Tool use:', payload?.tool);
        mainWindowRef.webContents.send('chat:stream', {
          type: 'tool',
          tool: payload?.tool,
          input: payload?.input,
          requestId
        });
        break;

      case 'chat:session':
        mainWindowRef.webContents.send('chat:stream', {
          type: 'session',
          sessionId: payload?.sessionId,
          requestId
        });
        break;

      case 'chat:stream:end':
        console.log('[IPC] Stream end, cost:', payload?.cost);
        mainWindowRef.webContents.send('chat:stream', {
          type: 'end',
          sessionId: payload?.sessionId,
          cost: payload?.cost,
          usage: payload?.usage,
          requestId
        });
        break;

      case 'chat:stream:error':
        mainWindowRef.webContents.send('chat:stream', {
          type: 'error',
          error: payload?.error,
          requestId
        });
        break;
    }
  }

  // Handle final response
  if (type === 'chat:response' && payload) {
    const { success, content, sessionId } = payload;

    // Find and resolve the pending request
    if (requestId) {
      const resolver = pendingRequests.get(requestId);
      if (resolver) {
        resolver({
          success: success ?? true,
          response: content ?? '',
          sessionId
        });
      }
    }
  }
}

export function sendMessageToRenderer(window: BrowserWindow, data: unknown): void {
  window.webContents.send('chat:message', data);
}
