# Phase 4: IPC Infrastructure

## Objective

Set up the IPC communication layer between main and renderer processes with typed APIs.

## Acceptance Criteria

- [ ] IPC handlers in main process organized in src/main/ipc/
- [ ] Typed API exposed via preload script
- [ ] TypeScript declarations for window.electronAPI
- [ ] Test IPC working:
  - Renderer can call main process
  - Main process can send to renderer
- [ ] MessagePort setup for streaming (preparation for Phase 6)
- [ ] Error handling for IPC calls
- [ ] No TypeScript errors

## Technical Notes

### Main Process IPC Handlers

```typescript
// src/main/ipc/index.ts
import { ipcMain } from 'electron';

export function setupIpcHandlers() {
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });

  ipcMain.handle('chat:send', async (event, message: string) => {
    // Placeholder - will connect to agent in Phase 6
    return { success: true, response: 'Placeholder response' };
  });
}
```

### Preload API

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

const api = {
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  sendMessage: (message: string) => ipcRenderer.invoke('chat:send', message),
  onMessage: (callback: (data: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('chat:message', handler);
    return () => ipcRenderer.removeListener('chat:message', handler);
  }
};

contextBridge.exposeInMainWorld('electronAPI', api);
```

### TypeScript Declarations

```typescript
// src/types/electron.d.ts
export interface IElectronAPI {
  getVersion: () => Promise<string>;
  sendMessage: (message: string) => Promise<{ success: boolean; response: string }>;
  onMessage: (callback: (data: any) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
```

### Update Chat to Use IPC

Modify ChatInput to call `window.electronAPI.sendMessage()` instead of using placeholder logic.

## Out of Scope

- Actual agent integration
- Utility process
- Streaming implementation

## Files to Create

- src/main/ipc/index.ts
- src/main/ipc/chat.ts
- src/types/electron.d.ts

## Files to Modify

- src/main/index.ts (call setupIpcHandlers)
- src/preload/index.ts (expand API)
- src/renderer/components/Chat/ChatInput.tsx (use IPC)

## Completion

When IPC is working (chat sends message, gets response via IPC), output:

```
<promise>COMPLETE</promise>
```
