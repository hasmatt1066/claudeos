// Re-export from shared types
export type { ToolManifest, ToolWithStatus } from '../../../types/electron';

// Alias for backward compatibility in component props
export type Tool = import('../../../types/electron').ToolWithStatus;
