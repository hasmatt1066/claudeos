/**
 * Context Brain IPC Handlers
 * Exposes context brain functionality to the renderer process
 */

import { ipcMain } from 'electron';
import { agentProcess, type WorkerMessage } from '../services/agent-process';

// Store pending context requests
const pendingRequests = new Map<
  string,
  {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
  }
>();

let requestIdCounter = 0;

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `ctx-${Date.now()}-${++requestIdCounter}`;
}

/**
 * Handle worker responses for context operations
 */
export function handleContextResponse(message: WorkerMessage): void {
  const payload = message.payload as { requestId?: string; [key: string]: unknown };
  const requestId = payload?.requestId;

  if (requestId && pendingRequests.has(requestId)) {
    const { resolve, reject } = pendingRequests.get(requestId)!;
    pendingRequests.delete(requestId);

    if (payload.success === false) {
      reject(new Error(payload.error as string || 'Unknown error'));
    } else {
      resolve(payload);
    }
  }
}

/**
 * Send message to worker and wait for response
 */
async function sendAndWait<T>(
  type: string,
  payload: Record<string, unknown>,
  timeout = 30000
): Promise<T> {
  const requestId = generateRequestId();

  return new Promise((resolve, reject) => {
    // Set timeout
    const timeoutId = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error(`Request ${type} timed out`));
    }, timeout);

    // Store request with cleanup
    pendingRequests.set(requestId, {
      resolve: (value) => {
        clearTimeout(timeoutId);
        resolve(value as T);
      },
      reject: (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    });

    // Send to worker
    agentProcess.send({
      type,
      payload: { ...payload, requestId }
    });
  });
}

/**
 * Setup context IPC handlers
 */
export function setupContextHandlers(): void {
  // Add document to context brain
  ipcMain.handle(
    'context:add',
    async (
      _,
      params: { path: string; text: string; type: string }
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        await sendAndWait<{ success: boolean }>('context:add', params);
        return { success: true };
      } catch (error) {
        console.error('[Context IPC] Add error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  );

  // Search context brain
  ipcMain.handle(
    'context:search',
    async (
      _,
      query: string,
      limit?: number
    ): Promise<{
      success: boolean;
      results: Array<{
        id: string;
        filePath: string;
        text: string;
        createdAt: number;
        fileType: string;
      }>;
      error?: string;
    }> => {
      try {
        const response = await sendAndWait<{
          success: boolean;
          results: Array<{
            id: string;
            filePath: string;
            text: string;
            createdAt: number;
            fileType: string;
          }>;
        }>('context:search', { query, limit });

        return {
          success: true,
          results: response.results || []
        };
      } catch (error) {
        console.error('[Context IPC] Search error:', error);
        return {
          success: false,
          results: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  );

  // Get document count
  ipcMain.handle('context:count', async (): Promise<{
    success: boolean;
    count: number;
    error?: string;
  }> => {
    try {
      const response = await sendAndWait<{ success: boolean; count: number }>('context:count', {});

      return {
        success: true,
        count: response.count || 0
      };
    } catch (error) {
      console.error('[Context IPC] Count error:', error);
      return {
        success: false,
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  console.log('[Context IPC] Handlers registered');
}
