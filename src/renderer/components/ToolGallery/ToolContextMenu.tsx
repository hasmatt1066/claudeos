import React, { useEffect, useRef } from 'react';
import { Tool } from './types';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface ToolContextMenuProps {
  tool: Tool;
  position: ContextMenuPosition;
  onClose: () => void;
  onLaunch: (tool: Tool) => void;
  onStop: (tool: Tool) => void;
  onConfigure: (tool: Tool) => void;
  onDelete: (tool: Tool) => void;
}

function ToolContextMenu({
  tool,
  position,
  onClose,
  onLaunch,
  onStop,
  onConfigure,
  onDelete
}: ToolContextMenuProps): React.JSX.Element {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="tool-context-menu"
      style={{
        left: position.x,
        top: position.y
      }}
    >
      {tool.status === 'running' ? (
        <button
          className="tool-context-menu-item"
          onClick={() => handleAction(() => onStop(tool))}
        >
          <span className="menu-icon">{'\u{23F9}\u{FE0F}'}</span>
          Stop
        </button>
      ) : (
        <button
          className="tool-context-menu-item"
          onClick={() => handleAction(() => onLaunch(tool))}
        >
          <span className="menu-icon">{'\u{25B6}\u{FE0F}'}</span>
          Launch
        </button>
      )}
      <button
        className="tool-context-menu-item"
        onClick={() => handleAction(() => onConfigure(tool))}
      >
        <span className="menu-icon">{'\u{2699}\u{FE0F}'}</span>
        Configure
      </button>
      <div className="tool-context-menu-divider" />
      <button
        className="tool-context-menu-item tool-context-menu-item-danger"
        onClick={() => handleAction(() => onDelete(tool))}
      >
        <span className="menu-icon">{'\u{1F5D1}\u{FE0F}'}</span>
        Delete
      </button>
    </div>
  );
}

export default ToolContextMenu;
