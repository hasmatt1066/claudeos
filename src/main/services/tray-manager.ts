/**
 * Tray Manager Service
 * Handles system tray integration for background operation
 */

import { Tray, Menu, app, nativeImage, BrowserWindow, MenuItemConstructorOptions } from 'electron';
import path from 'path';
import fs from 'fs';

export class TrayManager {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;
  private isQuitting = false;
  private runningTools: string[] = [];

  /**
   * Set the main window reference
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;

    // Intercept window close to hide to tray instead
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting && this.tray) {
        event.preventDefault();
        this.mainWindow?.hide();

        // Hide dock icon on macOS
        if (process.platform === 'darwin') {
          app.dock?.hide();
        }
      }
    });
  }

  /**
   * Create the system tray icon and menu
   */
  create(): void {
    if (this.tray) {
      console.log('[TrayManager] Tray already exists');
      return;
    }

    // Load tray icon - try multiple paths for dev/prod
    const iconName = 'tray-icon.png';
    const possiblePaths = [
      path.join(__dirname, '../../resources', iconName), // Production
      path.join(__dirname, '../../../resources', iconName), // Development (different structure)
      path.join(process.cwd(), 'resources', iconName) // CWD fallback
    ];

    let icon: Electron.NativeImage = nativeImage.createEmpty();
    let iconLoaded = false;

    for (const iconPath of possiblePaths) {
      try {
        if (fs.existsSync(iconPath)) {
          icon = nativeImage.createFromPath(iconPath);
          if (!icon.isEmpty()) {
            iconLoaded = true;
            console.log('[TrayManager] Loaded icon from:', iconPath);
            break;
          }
        }
      } catch {
        // Continue to next path
      }
    }

    if (!iconLoaded) {
      console.warn('[TrayManager] Could not load icon, using empty');
    }

    // Resize for proper display
    if (!icon.isEmpty()) {
      if (process.platform === 'darwin') {
        icon = icon.resize({ width: 22, height: 22 });
        icon.setTemplateImage(true);
      } else {
        icon = icon.resize({ width: 16, height: 16 });
      }
    }

    this.tray = new Tray(icon);
    this.tray.setToolTip('ClaudeOS');

    // Update menu initially
    this.updateMenu();

    // Handle tray click
    this.tray.on('click', () => {
      this.showWindow();
    });

    // Double-click also shows window (Windows behavior)
    this.tray.on('double-click', () => {
      this.showWindow();
    });

    console.log('[TrayManager] Tray created');
  }

  /**
   * Update the tray context menu with current running tools
   */
  updateMenu(runningToolNames?: string[]): void {
    if (!this.tray) return;

    if (runningToolNames !== undefined) {
      this.runningTools = runningToolNames;
    }

    // Build tools submenu
    const toolsSubmenu: MenuItemConstructorOptions[] =
      this.runningTools.length > 0
        ? this.runningTools.map((name) => ({
            label: name,
            enabled: false
          }))
        : [{ label: 'No tools running', enabled: false }];

    // Build main menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open ClaudeOS',
        click: () => this.showWindow()
      },
      {
        label: 'New Conversation',
        click: () => {
          this.showWindow();
          this.mainWindow?.webContents.send('app:newConversation');
        }
      },
      { type: 'separator' },
      {
        label: 'Running Tools',
        submenu: toolsSubmenu
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          this.isQuitting = true;
          app.quit();
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);

    // Update tooltip with running tools count
    const toolCount = this.runningTools.length;
    const tooltip =
      toolCount > 0
        ? `ClaudeOS - ${toolCount} tool${toolCount > 1 ? 's' : ''} running`
        : 'ClaudeOS';
    this.tray.setToolTip(tooltip);
  }

  /**
   * Show the main window and bring to front
   */
  private showWindow(): void {
    if (!this.mainWindow) return;

    // Show dock icon on macOS
    if (process.platform === 'darwin') {
      app.dock?.show();
    }

    // Show and focus window
    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore();
    }
    this.mainWindow.show();
    this.mainWindow.focus();
  }

  /**
   * Set the quitting flag to allow window close
   */
  setQuitting(value: boolean): void {
    this.isQuitting = value;
  }

  /**
   * Check if app is quitting
   */
  isAppQuitting(): boolean {
    return this.isQuitting;
  }

  /**
   * Destroy the tray icon
   */
  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
    console.log('[TrayManager] Tray destroyed');
  }
}

// Export singleton instance
export const trayManager = new TrayManager();
