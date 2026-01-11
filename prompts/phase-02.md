# Phase 2: Window Shell

## Objective

Create a properly configured Electron window with security settings and a basic React shell.

## Acceptance Criteria

- [ ] BrowserWindow created with security settings:
  - contextIsolation: true
  - sandbox: true
  - nodeIntegration: false
  - preload script configured
- [ ] Preload script uses contextBridge to expose API object
- [ ] Window has reasonable default size (1200x800)
- [ ] Window title is "ClaudeOS"
- [ ] React app renders "ClaudeOS" heading in the window
- [ ] Window controls work (minimize, maximize, close)
- [ ] No console errors on startup
- [ ] TypeScript compiles without errors

## Technical Notes

Reference ARCHITECTURE.md for security requirements.

Main process (src/main/index.ts):
```typescript
new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    preload: path.join(__dirname, '../preload/index.js'),
    contextIsolation: true,
    sandbox: true,
    nodeIntegration: false
  }
});
```

Preload (src/preload/index.ts):
```typescript
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // API methods will be added in later phases
});
```

## Out of Scope

- Chat UI
- IPC handlers
- System tray
- Any ClaudeOS functionality

## Files to Modify

- src/main/index.ts
- src/preload/index.ts
- src/renderer/App.tsx
- src/renderer/index.css (basic styling)

## Completion

When the window opens with "ClaudeOS" displayed and all security settings are correct, output:

```
<promise>COMPLETE</promise>
```
