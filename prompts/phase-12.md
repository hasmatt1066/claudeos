# Phase 12: System Tray

## Objective

Add system tray integration so ClaudeOS can run in the background.

## Acceptance Criteria

- [ ] Tray icon appears when app starts
- [ ] Closing window hides to tray (doesn't quit)
- [ ] Tray menu with:
  - Open ClaudeOS
  - New Conversation
  - Running Tools submenu (list of running tools)
  - Quit
- [ ] Click tray icon → shows window
- [ ] Running tools count shown in tooltip
- [ ] Tray icon updates based on state (optional: different icon when busy)
- [ ] Works on Windows and Mac
- [ ] App stays in memory when window closed

## Technical Notes

### Tray Manager

```typescript
// src/main/services/tray-manager.ts
import { Tray, Menu, app, nativeImage, BrowserWindow } from 'electron';
import path from 'path';

export class TrayManager {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow;
  private isQuitting = false;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  create() {
    const iconPath = path.join(__dirname, '../../resources/tray-icon.png');
    const icon = nativeImage.createFromPath(iconPath);

    this.tray = new Tray(icon);
    this.tray.setToolTip('ClaudeOS');

    this.updateMenu();

    this.tray.on('click', () => this.showWindow());

    // Intercept window close
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.mainWindow.hide();

        if (process.platform === 'darwin') {
          app.dock.hide();
        }
      }
    });
  }

  updateMenu(runningTools: string[] = []) {
    const toolsSubmenu = runningTools.length > 0
      ? runningTools.map(name => ({ label: name, enabled: false }))
      : [{ label: 'No tools running', enabled: false }];

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open ClaudeOS',
        click: () => this.showWindow()
      },
      {
        label: 'New Conversation',
        click: () => {
          this.showWindow();
          this.mainWindow.webContents.send('app:newConversation');
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

    this.tray?.setContextMenu(contextMenu);

    // Update tooltip
    const toolCount = runningTools.length;
    const tooltip = toolCount > 0
      ? `ClaudeOS - ${toolCount} tool${toolCount > 1 ? 's' : ''} running`
      : 'ClaudeOS';
    this.tray?.setToolTip(tooltip);
  }

  private showWindow() {
    if (process.platform === 'darwin') {
      app.dock.show();
    }
    this.mainWindow.show();
    this.mainWindow.focus();
  }

  setQuitting(value: boolean) {
    this.isQuitting = value;
  }
}
```

### App Lifecycle

```typescript
// src/main/index.ts

// Keep app running when all windows closed
app.on('window-all-closed', () => {
  // Don't quit on window close - tray keeps us alive
});

// Before quit, clean up
app.on('before-quit', () => {
  trayManager.setQuitting(true);
});
```

### Tray Icon Assets

Create simple tray icons:
- resources/tray-icon.png (22x22 for macOS, 16x16 for Windows)
- resources/tray-icon@2x.png (44x44 for Retina)

For now, use a simple placeholder icon. Can be a colored circle or "C" letter.

### Wire Tool Manager to Tray

```typescript
// When tool status changes
toolManager.on('statusChange', () => {
  const runningTools = toolManager.getRunningToolNames();
  trayManager.updateMenu(runningTools);
});
```

## Out of Scope

- Custom tray icon designs
- Native notifications
- Menubar app mode (macOS)

## Files to Create

- src/main/services/tray-manager.ts
- resources/tray-icon.png
- resources/tray-icon@2x.png (optional)

## Files to Modify

- src/main/index.ts (initialize tray, handle lifecycle)
- src/main/services/tool-manager.ts (emit events)

## Completion

When tray works with hide/show and tool status, output:

```
<promise>COMPLETE</promise>
```
