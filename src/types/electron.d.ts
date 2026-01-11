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

export interface IElectronAPI {
  // App
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<NodeJS.Platform>;

  // Chat
  sendMessage: (message: string, sessionId?: string) => Promise<ChatResponse>;
  onMessage: (callback: (data: unknown) => void) => () => void;
  onStreamChunk: (callback: (chunk: StreamChunk) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

export {};
