import React from 'react';
import { Tool } from './types';

interface ToolCardProps {
  tool: Tool;
  onClick: (tool: Tool) => void;
  onContextMenu: (e: React.MouseEvent, tool: Tool) => void;
}

const typeIcons: Record<Tool['type'], string> = {
  background: '\u{2699}\u{FE0F}',  // gear
  window: '\u{1F5BC}\u{FE0F}',      // framed picture
  tray: '\u{1F4E5}',                // inbox tray
  widget: '\u{1F4CA}'               // bar chart
};

const statusColors: Record<Tool['status'], string> = {
  running: '#27ae60',
  stopped: '#666',
  error: '#e74c3c'
};

const statusLabels: Record<Tool['status'], string> = {
  running: 'Running',
  stopped: 'Stopped',
  error: 'Error'
};

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

function ToolCard({ tool, onClick, onContextMenu }: ToolCardProps): React.JSX.Element {
  const icon = tool.icon || typeIcons[tool.type];

  return (
    <div
      className={`tool-card tool-card-${tool.status}`}
      onClick={() => onClick(tool)}
      onContextMenu={(e) => onContextMenu(e, tool)}
    >
      <div className="tool-card-header">
        <span className="tool-card-icon">{icon}</span>
        <span
          className="tool-card-status"
          style={{ backgroundColor: statusColors[tool.status] }}
          title={statusLabels[tool.status]}
        />
      </div>
      <div className="tool-card-body">
        <h3 className="tool-card-name">{tool.name}</h3>
        <p className="tool-card-description">{tool.description}</p>
      </div>
      <div className="tool-card-footer">
        <span className="tool-card-type">{tool.type}</span>
        <span className="tool-card-date">{formatDate(tool.createdAt)}</span>
      </div>
    </div>
  );
}

export default ToolCard;
