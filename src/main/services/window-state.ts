/**
 * Window State Service
 * Persists and restores window size/position across sessions
 */

import Store from 'electron-store';
import { BrowserWindow, screen } from 'electron';

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WindowStateConfig {
  defaultWidth?: number;
  defaultHeight?: number;
}

const store = new Store<{ windowBounds: WindowBounds }>({
  name: 'claudeos-window-state'
});

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;

/**
 * Get saved window bounds or return defaults
 */
export function loadWindowState(config: WindowStateConfig = {}): WindowBounds {
  const saved = store.get('windowBounds');

  if (saved) {
    // Validate that the saved position is still on a visible display
    const displays = screen.getAllDisplays();
    const isOnDisplay = displays.some((display) => {
      const { x, y, width, height } = display.bounds;
      return (
        saved.x >= x &&
        saved.x < x + width &&
        saved.y >= y &&
        saved.y < y + height
      );
    });

    if (isOnDisplay) {
      return saved;
    }
  }

  // Return centered default bounds
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  const width = config.defaultWidth || DEFAULT_WIDTH;
  const height = config.defaultHeight || DEFAULT_HEIGHT;

  return {
    x: Math.floor((screenWidth - width) / 2),
    y: Math.floor((screenHeight - height) / 2),
    width,
    height
  };
}

/**
 * Save window bounds to persistent storage
 */
export function saveWindowState(win: BrowserWindow): void {
  if (win.isMinimized() || win.isMaximized()) {
    // Don't save minimized/maximized state, keep last normal bounds
    return;
  }

  const bounds = win.getBounds();
  store.set('windowBounds', bounds);
}

/**
 * Set up automatic saving of window state on move/resize
 */
export function trackWindowState(win: BrowserWindow): void {
  // Debounce saves to avoid excessive writes
  let saveTimeout: NodeJS.Timeout | null = null;

  const debouncedSave = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      saveWindowState(win);
    }, 500);
  };

  win.on('resize', debouncedSave);
  win.on('move', debouncedSave);

  // Save on close
  win.on('close', () => {
    saveWindowState(win);
  });
}
