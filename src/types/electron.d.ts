export interface ChatResponse {
  success: boolean;
  response: string;
  sessionId?: string;
}

export interface StreamChunk {
  type: 'start' | 'chunk' | 'tool' | 'end' | 'error' | 'session';
  content?: string;
  tool?: string;
  input?: unknown;
  error?: string;
  sessionId?: string;
  cost?: number;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  requestId?: string;
}

export interface ToolManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  type: 'background' | 'window' | 'tray' | 'widget';
  entry: string;
  autostart: boolean;
  createdAt: string;
  icon?: string;
}

export interface ToolWithStatus extends ToolManifest {
  status: 'stopped' | 'running' | 'error';
}

export interface ToolStatusChange {
  toolId: string;
  status: 'running' | 'stopped' | 'error';
}

export interface ToolResult {
  success: boolean;
  error?: string;
}

export interface IElectronAPI {
  // App
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<NodeJS.Platform>;

  // Chat
  sendMessage: (message: string, sessionId?: string) => Promise<ChatResponse>;
  onMessage: (callback: (data: unknown) => void) => () => void;
  onStreamChunk: (callback: (chunk: StreamChunk) => void) => () => void;

  // Tools
  listTools: () => Promise<ToolWithStatus[]>;
  getTool: (toolId: string) => Promise<ToolWithStatus | null>;
  launchTool: (toolId: string) => Promise<ToolResult>;
  stopTool: (toolId: string) => Promise<ToolResult>;
  deleteTool: (toolId: string) => Promise<ToolResult>;
  getToolStatus: (toolId: string) => Promise<'running' | 'stopped' | 'error'>;
  saveTool: (manifest: ToolManifest, files: Record<string, string>) => Promise<ToolResult>;
  getToolsDirectory: () => Promise<string>;
  onToolStatusChange: (callback: (change: ToolStatusChange) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

export {};
