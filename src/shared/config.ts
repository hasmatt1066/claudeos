/**
 * Shared configuration constants for ClaudeOS
 * Centralized configuration to avoid hard-coded values scattered throughout the codebase
 */

// App identifiers
export const APP_NAME = 'ClaudeOS';
export const APP_ID = 'com.claudeos';

// Directory names (relative to user home)
export const CLAUDEOS_HOME_DIR = 'ClaudeOS';
export const TOOLS_DIR = 'tools';
export const INBOX_DIR = 'inbox';
export const CONTEXT_DIR = 'context';
export const DB_DIR = 'db';

// Tool ID validation pattern - only alphanumeric, hyphens, and underscores
export const TOOL_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Validate a tool ID to prevent path traversal and injection attacks
 * @param toolId The tool ID to validate
 * @returns true if valid, false otherwise
 */
export function isValidToolId(toolId: string): boolean {
  if (!toolId || typeof toolId !== 'string') {
    return false;
  }
  if (toolId.length > 100) {
    return false;
  }
  return TOOL_ID_PATTERN.test(toolId);
}

/**
 * Escape a string for use in LanceDB filter expressions
 * Prevents SQL-like injection by escaping single quotes
 * @param value The string to escape
 * @returns Escaped string safe for filter expressions
 */
export function escapeLanceDBString(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }
  // Escape single quotes by doubling them (SQL-style escaping)
  // Also escape backslashes
  return value.replace(/\\/g, '\\\\').replace(/'/g, "''");
}

// Timeouts (in milliseconds)
export const CHAT_TIMEOUT_MS = 120000; // 2 minutes
export const FILE_STABILITY_MS = 2000; // Wait for file writes to complete
export const LOADING_DELAY_MS = 800; // Initial loading screen duration

// UI constraints
export const MAX_TEXTAREA_HEIGHT = 150;
export const MAX_TEXT_LENGTH = 50000; // Max characters for context brain documents
