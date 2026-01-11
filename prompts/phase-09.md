# Phase 9: Tool Persistence

## Objective

Implement tool saving, loading, and launching so tools persist and can run independently.

## Acceptance Criteria

- [ ] Tools saved to ~/ClaudeOS/tools/{tool-id}/
- [ ] Each tool has manifest.json with metadata
- [ ] Tools load on app startup
- [ ] Launch tool → spawns child process
- [ ] Stop tool → kills child process
- [ ] Running tools tracked in memory
- [ ] Tool status updates in real-time in gallery
- [ ] Delete tool removes directory
- [ ] Auto-start tools that have autostart: true
- [ ] IPC API for tool management

## Technical Notes

### Tool Directory Structure

```
~/ClaudeOS/tools/
├── file-sorter/
│   ├── manifest.json
│   ├── index.js
│   └── package.json (optional)
├── budget-tracker/
│   └── ...
```

### Manifest Format

```json
{
  "id": "file-sorter",
  "name": "File Sorter",
  "description": "Watches Downloads and sorts files by client",
  "version": "1.0.0",
  "type": "background",
  "entry": "index.js",
  "autostart": true,
  "createdAt": "2026-01-10T12:00:00Z"
}
```

### Tool Manager Service

```typescript
// src/main/services/tool-manager.ts
import { fork, ChildProcess } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export class ToolManager {
  private tools: Map<string, Tool> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private toolsDir: string;

  constructor(claudeOSHome: string) {
    this.toolsDir = path.join(claudeOSHome, 'tools');
  }

  async loadTools() {
    const dirs = await fs.readdir(this.toolsDir);
    for (const dir of dirs) {
      const manifestPath = path.join(this.toolsDir, dir, 'manifest.json');
      try {
        const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));
        this.tools.set(manifest.id, manifest);
      } catch (e) {
        console.warn(`Failed to load tool ${dir}`);
      }
    }
  }

  async launch(toolId: string) {
    const tool = this.tools.get(toolId);
    if (!tool) throw new Error(`Tool not found: ${toolId}`);

    const toolDir = path.join(this.toolsDir, toolId);
    const entryPath = path.join(toolDir, tool.entry);

    const child = fork(entryPath, [], { cwd: toolDir });
    this.processes.set(toolId, child);

    child.on('exit', () => {
      this.processes.delete(toolId);
      // Notify renderer of status change
    });
  }

  async stop(toolId: string) {
    const child = this.processes.get(toolId);
    if (child) {
      child.kill();
      this.processes.delete(toolId);
    }
  }

  async delete(toolId: string) {
    await this.stop(toolId);
    const toolDir = path.join(this.toolsDir, toolId);
    await fs.rm(toolDir, { recursive: true });
    this.tools.delete(toolId);
  }

  getStatus(toolId: string): 'running' | 'stopped' {
    return this.processes.has(toolId) ? 'running' : 'stopped';
  }
}
```

### IPC Endpoints

```typescript
ipcMain.handle('tools:list', () => toolManager.list());
ipcMain.handle('tools:launch', (_, id) => toolManager.launch(id));
ipcMain.handle('tools:stop', (_, id) => toolManager.stop(id));
ipcMain.handle('tools:delete', (_, id) => toolManager.delete(id));
ipcMain.handle('tools:status', (_, id) => toolManager.getStatus(id));
```

### Create Sample Tool for Testing

Create a simple background tool that logs to console:

```javascript
// ~/ClaudeOS/tools/test-tool/index.js
setInterval(() => {
  console.log('Test tool running...', new Date().toISOString());
}, 5000);
```

## Out of Scope

- Tool creation via Claude (happens naturally in chat)
- Tool UI windows
- Tool configuration UI

## Files to Create

- src/main/services/tool-manager.ts
- src/main/ipc/tools.ts

## Files to Modify

- src/main/index.ts (initialize ToolManager)
- src/preload/index.ts (add tool APIs)
- src/renderer/components/ToolGallery/* (wire up to real data)

## Completion

When tools persist, launch, stop, and delete correctly, output:

```
<promise>COMPLETE</promise>
```
