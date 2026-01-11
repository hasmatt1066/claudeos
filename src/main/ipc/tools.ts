import { ipcMain } from 'electron';
import { toolManager, ToolManifest, ToolWithStatus } from '../services/tool-manager';

export function setupToolHandlers(): void {
  // List all tools
  ipcMain.handle('tools:list', (): ToolWithStatus[] => {
    return toolManager.list();
  });

  // Get single tool
  ipcMain.handle('tools:get', (_, toolId: string): ToolWithStatus | null => {
    return toolManager.get(toolId);
  });

  // Launch a tool
  ipcMain.handle('tools:launch', async (_, toolId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await toolManager.launch(toolId);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  });

  // Stop a tool
  ipcMain.handle('tools:stop', async (_, toolId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await toolManager.stop(toolId);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  });

  // Delete a tool
  ipcMain.handle('tools:delete', async (_, toolId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await toolManager.delete(toolId);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  });

  // Get tool status
  ipcMain.handle('tools:status', (_, toolId: string): 'running' | 'stopped' | 'error' => {
    return toolManager.getStatus(toolId);
  });

  // Save a new tool
  ipcMain.handle(
    'tools:save',
    async (_, manifest: ToolManifest, files: Record<string, string>): Promise<{ success: boolean; error?: string }> => {
      try {
        await toolManager.save(manifest, files);
        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return { success: false, error: message };
      }
    }
  );

  // Get tools directory path
  ipcMain.handle('tools:getDirectory', (): string => {
    return toolManager.getToolsDirectory();
  });

  console.log('[IPC] Tool handlers initialized');
}
