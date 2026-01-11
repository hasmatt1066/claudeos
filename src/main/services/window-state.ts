/**
 * Window State Service
 * Persists and restores window size/position across sessions
 * Uses simple JSON file instead of electron-store for ESM compatibility
 */

import { BrowserWindow, screen, app } from 'electron';
import { join } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

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

// Simple JSON-based storage for window state
const getConfigPath = (): string => {
  const userDataPath = app.getPath('userData');
  return join(userDataPath, 'window-state.json');
};

const loadFromFile = (): WindowBounds | null => {
  try {
    const configPath = getConfigPath();
    if (existsSync(configPath)) {
      const data = readFileSync(configPath, 'utf-8');
      return JSON.parse(data) as WindowBounds;
    }
  } catch (e) {
    console.warn('[WindowState] Failed to load state:', e);
  }
  return null;
};

const saveToFile = (bounds: WindowBounds): void => {
  try {
    const configPath = getConfigPath();
    const dir = join(configPath, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(configPath, JSON.stringify(bounds, null, 2));
  } catch (e) {
    console.warn('[WindowState] Failed to save state:', e);
  }
};

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;

/**
 * Get saved window bounds or return defaults
 */
export function loadWindowState(config: WindowStateConfig = {}): WindowBounds {
  const saved = loadFromFile();

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
  saveToFile(bounds);
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
