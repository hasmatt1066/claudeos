/**
 * Shared types for ClaudeOS
 * This file contains type definitions used across main, renderer, and worker processes
 */

// Electron API exposed to renderer via preload
export interface ElectronAPI {
  platform: NodeJS.Platform;
}

// Extend the global Window interface
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
