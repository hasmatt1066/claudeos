import React, { useState, useEffect, useCallback } from 'react';
import OperationList from './OperationList';
import { OperationData } from './Operation';
import type { StreamChunk } from '../../../types/electron';
import './LearningWindow.css';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function describeOperation(tool: string, input: Record<string, unknown>): { type: OperationData['type']; description: string; details?: string } {
  switch (tool) {
    case 'Read':
      return {
        type: 'read',
        description: `Reading ${input.file_path as string}`,
        details: input.file_path as string
      };
    case 'Write':
      return {
        type: 'write',
        description: `Creating ${input.file_path as string}`,
        details: input.file_path as string
      };
    case 'Edit':
      return {
        type: 'edit',
        description: `Editing ${input.file_path as string}`,
        details: input.file_path as string
      };
    case 'Bash':
      const cmd = (input.command as string) || '';
      return {
        type: 'bash',
        description: `Running: ${cmd.length > 50 ? cmd.slice(0, 50) + '...' : cmd}`,
        details: cmd
      };
    case 'Glob':
      return {
        type: 'glob',
        description: `Finding files: ${input.pattern as string}`,
        details: `Pattern: ${input.pattern as string}${input.path ? `\nPath: ${input.path}` : ''}`
      };
    case 'Grep':
      return {
        type: 'search',
        description: `Searching: ${input.pattern as string}`,
        details: `Pattern: ${input.pattern as string}${input.path ? `\nPath: ${input.path}` : ''}`
      };
    default:
      return {
        type: 'tool',
        description: `Using ${tool}`,
        details: JSON.stringify(input, null, 2)
      };
  }
}

interface LearningWindowProps {
  onClear?: () => void;
}

function LearningWindow({ onClear }: LearningWindowProps): React.JSX.Element {
  const [isExpanded, setIsExpanded] = useState(true);
  const [operations, setOperations] = useState<OperationData[]>([]);

  // Listen for tool events
  useEffect(() => {
    const unsubscribe = window.electronAPI.onStreamChunk((chunk: StreamChunk) => {
      if (chunk.type === 'tool' && chunk.tool) {
        const { type, description, details } = describeOperation(
          chunk.tool,
          (chunk.input as Record<string, unknown>) || {}
        );

        const operation: OperationData = {
          id: generateId(),
          type,
          description,
          details,
          timestamp: new Date(),
          status: 'complete'
        };

        setOperations((prev) => [...prev, operation]);
      }

      // Clear operations when a new conversation starts
      if (chunk.type === 'start') {
        // Optional: Only clear if explicitly requested
        // setOperations([]);
      }
    });

    return unsubscribe;
  }, []);

  const handleClear = useCallback(() => {
    setOperations([]);
    onClear?.();
  }, [onClear]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <div className={`learning-window ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="learning-window-header" onClick={toggleExpanded}>
        <span className="learning-window-title">Learning Window</span>
        <div className="learning-window-controls">
          {operations.length > 0 && (
            <button
              className="learning-window-clear"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              title="Clear operations"
            >
              Clear
            </button>
          )}
          <span className="learning-window-toggle">
            {isExpanded ? '\u25BC' : '\u25C0'}
          </span>
        </div>
      </div>
      {isExpanded && (
        <div className="learning-window-content">
          <OperationList operations={operations} />
        </div>
      )}
    </div>
  );
}

export default LearningWindow;
