import { contextBridge, ipcRenderer } from 'electron';
import type {
  IElectronAPI,
  ChatResponse,
  StreamChunk,
  ToolWithStatus,
  ToolManifest,
  ToolResult,
  ToolStatusChange,
  ContextAddResult,
  ContextSearchResult,
  ContextCountResult,
  InboxProcessedEvent,
  InboxErrorEvent,
  InboxProcessingEvent
} from '../types/electron';

const api: IElectronAPI = {
  // App
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),
  getPlatform: (): Promise<NodeJS.Platform> => ipcRenderer.invoke('app:getPlatform'),

  onNewConversation: (callback: () => void): (() => void) => {
    const handler = (): void => callback();
    ipcRenderer.on('app:newConversation', handler);
    return () => {
      ipcRenderer.removeListener('app:newConversation', handler);
    };
  },

  onOpenSettings: (callback: () => void): (() => void) => {
    const handler = (): void => callback();
    ipcRenderer.on('app:openSettings', handler);
    return () => {
      ipcRenderer.removeListener('app:openSettings', handler);
    };
  },

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
  },

  // Tools
  listTools: (): Promise<ToolWithStatus[]> => ipcRenderer.invoke('tools:list'),

  getTool: (toolId: string): Promise<ToolWithStatus | null> =>
    ipcRenderer.invoke('tools:get', toolId),

  launchTool: (toolId: string): Promise<ToolResult> =>
    ipcRenderer.invoke('tools:launch', toolId),

  stopTool: (toolId: string): Promise<ToolResult> =>
    ipcRenderer.invoke('tools:stop', toolId),

  deleteTool: (toolId: string): Promise<ToolResult> =>
    ipcRenderer.invoke('tools:delete', toolId),

  getToolStatus: (toolId: string): Promise<'running' | 'stopped' | 'error'> =>
    ipcRenderer.invoke('tools:status', toolId),

  saveTool: (manifest: ToolManifest, files: Record<string, string>): Promise<ToolResult> =>
    ipcRenderer.invoke('tools:save', manifest, files),

  getToolsDirectory: (): Promise<string> => ipcRenderer.invoke('tools:getDirectory'),

  onToolStatusChange: (callback: (change: ToolStatusChange) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, change: ToolStatusChange): void =>
      callback(change);
    ipcRenderer.on('tools:statusChange', handler);
    return () => {
      ipcRenderer.removeListener('tools:statusChange', handler);
    };
  },

  // Context Brain
  contextAdd: (params: { path: string; text: string; type: string }): Promise<ContextAddResult> =>
    ipcRenderer.invoke('context:add', params),

  contextSearch: (query: string, limit?: number): Promise<ContextSearchResult> =>
    ipcRenderer.invoke('context:search', query, limit),

  contextCount: (): Promise<ContextCountResult> => ipcRenderer.invoke('context:count'),

  // Inbox Processor
  getInboxPath: (): Promise<string> => ipcRenderer.invoke('inbox:getPath'),

  getContextPath: (): Promise<string> => ipcRenderer.invoke('inbox:getContextPath'),

  onInboxProcessed: (callback: (event: InboxProcessedEvent) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: InboxProcessedEvent): void =>
      callback(data);
    ipcRenderer.on('inbox:processed', handler);
    return () => {
      ipcRenderer.removeListener('inbox:processed', handler);
    };
  },

  onInboxError: (callback: (event: InboxErrorEvent) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: InboxErrorEvent): void =>
      callback(data);
    ipcRenderer.on('inbox:error', handler);
    return () => {
      ipcRenderer.removeListener('inbox:error', handler);
    };
  },

  onInboxProcessing: (callback: (event: InboxProcessingEvent) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: InboxProcessingEvent): void =>
      callback(data);
    ipcRenderer.on('inbox:processing', handler);
    return () => {
      ipcRenderer.removeListener('inbox:processing', handler);
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
