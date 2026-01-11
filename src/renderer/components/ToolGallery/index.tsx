import React, { useState, useCallback } from 'react';
import ToolGrid from './ToolGrid';
import ToolContextMenu, { ContextMenuPosition } from './ToolContextMenu';
import { Tool, mockTools } from './types';
import './ToolGallery.css';

function ToolGallery(): React.JSX.Element {
  const [tools, setTools] = useState<Tool[]>(mockTools);
  const [contextMenu, setContextMenu] = useState<{
    tool: Tool;
    position: ContextMenuPosition;
  } | null>(null);

  const handleToolClick = useCallback((tool: Tool) => {
    console.log('[ToolGallery] Tool clicked:', tool.name);
    // Placeholder: will launch tool in Phase 9
    if (tool.status === 'stopped') {
      setTools((prev) =>
        prev.map((t) => (t.id === tool.id ? { ...t, status: 'running' as const } : t))
      );
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, tool: Tool) => {
    e.preventDefault();
    setContextMenu({
      tool,
      position: { x: e.clientX, y: e.clientY }
    });
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleLaunch = useCallback((tool: Tool) => {
    console.log('[ToolGallery] Launching tool:', tool.name);
    setTools((prev) =>
      prev.map((t) => (t.id === tool.id ? { ...t, status: 'running' as const } : t))
    );
  }, []);

  const handleStop = useCallback((tool: Tool) => {
    console.log('[ToolGallery] Stopping tool:', tool.name);
    setTools((prev) =>
      prev.map((t) => (t.id === tool.id ? { ...t, status: 'stopped' as const } : t))
    );
  }, []);

  const handleConfigure = useCallback((tool: Tool) => {
    console.log('[ToolGallery] Configure tool:', tool.name);
    // Placeholder: will open config in future phase
  }, []);

  const handleDelete = useCallback((tool: Tool) => {
    console.log('[ToolGallery] Deleting tool:', tool.name);
    setTools((prev) => prev.filter((t) => t.id !== tool.id));
  }, []);

  return (
    <div className="tool-gallery">
      <div className="tool-gallery-header">
        <h2>Tool Gallery</h2>
        <span className="tool-count">{tools.length} tools</span>
      </div>
      <div className="tool-gallery-content">
        <ToolGrid
          tools={tools}
          onToolClick={handleToolClick}
          onToolContextMenu={handleContextMenu}
        />
      </div>
      {contextMenu && (
        <ToolContextMenu
          tool={contextMenu.tool}
          position={contextMenu.position}
          onClose={handleCloseContextMenu}
          onLaunch={handleLaunch}
          onStop={handleStop}
          onConfigure={handleConfigure}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

export default ToolGallery;
