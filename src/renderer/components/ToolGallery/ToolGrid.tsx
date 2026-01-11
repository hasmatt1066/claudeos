import React from 'react';
import ToolCard from './ToolCard';
import { Tool } from './types';

interface ToolGridProps {
  tools: Tool[];
  onToolClick: (tool: Tool) => void;
  onToolContextMenu: (e: React.MouseEvent, tool: Tool) => void;
}

function ToolGrid({ tools, onToolClick, onToolContextMenu }: ToolGridProps): React.JSX.Element {
  if (tools.length === 0) {
    return (
      <div className="tool-grid tool-grid-empty">
        <div className="empty-state">
          <span className="empty-state-icon">{'\u{1F9F0}'}</span>
          <h3>No tools yet</h3>
          <p>Ask Claude to build something!</p>
          <p className="empty-state-hint">
            Try: "Build me a tool that watches my Downloads folder and sorts files by type"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tool-grid">
      {tools.map((tool) => (
        <ToolCard
          key={tool.id}
          tool={tool}
          onClick={onToolClick}
          onContextMenu={onToolContextMenu}
        />
      ))}
    </div>
  );
}

export default ToolGrid;
