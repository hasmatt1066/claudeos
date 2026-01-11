import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const api = {
  // Placeholder API - will be expanded in Phase 4
  platform: process.platform
};

// Use contextBridge to safely expose APIs to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', api);
  } catch (error) {
    console.error('Failed to expose electronAPI:', error);
  }
} else {
  // @ts-ignore - fallback for when context isolation is disabled (not recommended)
  window.electronAPI = api;
}
