export interface ChatResponse {
  success: boolean;
  response: string;
}

export interface IElectronAPI {
  // App
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<NodeJS.Platform>;

  // Chat
  sendMessage: (message: string) => Promise<ChatResponse>;
  onMessage: (callback: (data: unknown) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

export {};
