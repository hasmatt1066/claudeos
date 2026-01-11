import { contextBridge, ipcRenderer } from 'electron';
import type { IElectronAPI, ChatResponse, StreamChunk } from '../types/electron';

const api: IElectronAPI = {
  // App
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
  getPlatform: (): Promise<NodeJS.Platform> => ipcRenderer.invoke('app:getPlatform'),

  // Chat
  sendMessage: (message: string, sessionId?: string): Promise<ChatResponse> =>
    ipcRenderer.invoke('chat:send', message, sessionId),

  onMessage: (callback: (data: unknown) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown): void => callback(data);
    ipcRenderer.on('chat:message', handler);
    return () => {
      ipcRenderer.removeListener('chat:message', handler);
    };
  },

  onStreamChunk: (callback: (chunk: StreamChunk) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, chunk: StreamChunk): void =>
      callback(chunk);
    ipcRenderer.on('chat:stream', handler);
    return () => {
      ipcRenderer.removeListener('chat:stream', handler);
    };
  }
};

// Use contextBridge to safely expose APIs to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', api);
  } catch (error) {
    console.error('Failed to expose electronAPI:', error);
  }
} else {
  // Fallback for when context isolation is disabled (not recommended)
  (window as Window & { electronAPI: IElectronAPI }).electronAPI = api;
}
