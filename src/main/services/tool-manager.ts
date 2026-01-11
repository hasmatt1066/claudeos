import { fork, ChildProcess } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { app, BrowserWindow } from 'electron';

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

export class ToolManager {
  private tools: Map<string, ToolManifest> = new Map();
  private processes: Map<string, ChildProcess> = new Map();
  private toolsDir: string;
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    // Use user's home directory for ClaudeOS data
    const homeDir = app.getPath('home');
    this.toolsDir = path.join(homeDir, 'ClaudeOS', 'tools');
  }

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  async initialize(): Promise<void> {
    // Ensure tools directory exists
    await fs.mkdir(this.toolsDir, { recursive: true });
    await this.loadTools();
    await this.autostartTools();
  }

  async loadTools(): Promise<void> {
    try {
      const entries = await fs.readdir(this.toolsDir, { withFileTypes: true });
      const dirs = entries.filter((e) => e.isDirectory());

      for (const dir of dirs) {
        const manifestPath = path.join(this.toolsDir, dir.name, 'manifest.json');
        try {
          const manifestContent = await fs.readFile(manifestPath, 'utf-8');
          const manifest: ToolManifest = JSON.parse(manifestContent);
          this.tools.set(manifest.id, manifest);
          console.log(`[ToolManager] Loaded tool: ${manifest.name}`);
        } catch (e) {
          console.warn(`[ToolManager] Failed to load tool from ${dir.name}:`, e);
        }
      }

      console.log(`[ToolManager] Loaded ${this.tools.size} tools`);
    } catch (e) {
      console.warn('[ToolManager] Error loading tools:', e);
    }
  }

  private async autostartTools(): Promise<void> {
    for (const [id, tool] of this.tools) {
      if (tool.autostart) {
        try {
          await this.launch(id);
          console.log(`[ToolManager] Auto-started: ${tool.name}`);
        } catch (e) {
          console.error(`[ToolManager] Failed to auto-start ${tool.name}:`, e);
        }
      }
    }
  }

  list(): ToolWithStatus[] {
    const result: ToolWithStatus[] = [];
    for (const [id, tool] of this.tools) {
      result.push({
        ...tool,
        status: this.getStatus(id)
      });
    }
    return result;
  }

  get(toolId: string): ToolWithStatus | null {
    const tool = this.tools.get(toolId);
    if (!tool) return null;
    return {
      ...tool,
      status: this.getStatus(toolId)
    };
  }

  async launch(toolId: string): Promise<void> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    if (this.processes.has(toolId)) {
      console.log(`[ToolManager] Tool already running: ${tool.name}`);
      return;
    }

    const toolDir = path.join(this.toolsDir, toolId);
    const entryPath = path.join(toolDir, tool.entry);

    // Check if entry file exists
    try {
      await fs.access(entryPath);
    } catch {
      throw new Error(`Entry file not found: ${entryPath}`);
    }

    console.log(`[ToolManager] Launching tool: ${tool.name}`);

    const child = fork(entryPath, [], {
      cwd: toolDir,
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    // Handle stdout
    child.stdout?.on('data', (data) => {
      console.log(`[Tool:${tool.name}]`, data.toString().trim());
    });

    // Handle stderr
    child.stderr?.on('data', (data) => {
      console.error(`[Tool:${tool.name}:err]`, data.toString().trim());
    });

    // Handle exit
    child.on('exit', (code) => {
      console.log(`[ToolManager] Tool exited: ${tool.name} (code: ${code})`);
      this.processes.delete(toolId);
      this.notifyStatusChange(toolId, 'stopped');
    });

    // Handle errors
    child.on('error', (error) => {
      console.error(`[ToolManager] Tool error: ${tool.name}`, error);
      this.processes.delete(toolId);
      this.notifyStatusChange(toolId, 'error');
    });

    this.processes.set(toolId, child);
    this.notifyStatusChange(toolId, 'running');
  }

  async stop(toolId: string): Promise<void> {
    const child = this.processes.get(toolId);
    if (!child) {
      console.log(`[ToolManager] Tool not running: ${toolId}`);
      return;
    }

    const tool = this.tools.get(toolId);
    console.log(`[ToolManager] Stopping tool: ${tool?.name || toolId}`);

    child.kill();
    this.processes.delete(toolId);
    this.notifyStatusChange(toolId, 'stopped');
  }

  async delete(toolId: string): Promise<void> {
    // Stop if running
    await this.stop(toolId);

    const tool = this.tools.get(toolId);
    console.log(`[ToolManager] Deleting tool: ${tool?.name || toolId}`);

    // Remove directory
    const toolDir = path.join(this.toolsDir, toolId);
    try {
      await fs.rm(toolDir, { recursive: true });
    } catch (e) {
      console.error(`[ToolManager] Error deleting tool directory:`, e);
    }

    // Remove from memory
    this.tools.delete(toolId);
  }

  async save(manifest: ToolManifest, files: Record<string, string>): Promise<void> {
    const toolDir = path.join(this.toolsDir, manifest.id);

    // Create tool directory
    await fs.mkdir(toolDir, { recursive: true });

    // Write manifest
    await fs.writeFile(
      path.join(toolDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    // Write additional files
    for (const [filename, content] of Object.entries(files)) {
      await fs.writeFile(path.join(toolDir, filename), content);
    }

    // Add to in-memory map
    this.tools.set(manifest.id, manifest);
    console.log(`[ToolManager] Saved tool: ${manifest.name}`);
  }

  getStatus(toolId: string): 'running' | 'stopped' | 'error' {
    return this.processes.has(toolId) ? 'running' : 'stopped';
  }

  private notifyStatusChange(toolId: string, status: 'running' | 'stopped' | 'error'): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('tools:statusChange', { toolId, status });
    }
  }

  async shutdown(): Promise<void> {
    console.log('[ToolManager] Shutting down all tools...');
    for (const [toolId] of this.processes) {
      await this.stop(toolId);
    }
  }

  getToolsDirectory(): string {
    return this.toolsDir;
  }
}

// Singleton instance
export const toolManager = new ToolManager();
