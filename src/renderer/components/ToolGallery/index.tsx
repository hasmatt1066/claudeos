import React, { useState, useCallback, useEffect } from 'react';
import ToolGrid from './ToolGrid';
import ToolContextMenu, { ContextMenuPosition } from './ToolContextMenu';
import { Tool } from './types';
import type { ToolStatusChange } from '../../../types/electron';
import './ToolGallery.css';

function ToolGallery(): React.JSX.Element {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    tool: Tool;
    position: ContextMenuPosition;
  } | null>(null);

  // Load tools on mount
  useEffect(() => {
    const loadTools = async () => {
      try {
        const toolList = await window.electronAPI.listTools();
        setTools(toolList);
      } catch (error) {
        console.error('[ToolGallery] Failed to load tools:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTools();
  }, []);

  // Listen for status changes
  useEffect(() => {
    const unsubscribe = window.electronAPI.onToolStatusChange((change: ToolStatusChange) => {
      console.log('[ToolGallery] Status change:', change);
      setTools((prev) =>
        prev.map((t) => (t.id === change.toolId ? { ...t, status: change.status } : t))
      );
    });

    return unsubscribe;
  }, []);

  const handleToolClick = useCallback(async (tool: Tool) => {
    console.log('[ToolGallery] Tool clicked:', tool.name);
    if (tool.status === 'stopped' || tool.status === 'error') {
      const result = await window.electronAPI.launchTool(tool.id);
      if (!result.success) {
        console.error('[ToolGallery] Failed to launch:', result.error);
      }
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

  const handleLaunch = useCallback(async (tool: Tool) => {
    console.log('[ToolGallery] Launching tool:', tool.name);
    const result = await window.electronAPI.launchTool(tool.id);
    if (!result.success) {
      console.error('[ToolGallery] Failed to launch:', result.error);
    }
  }, []);

  const handleStop = useCallback(async (tool: Tool) => {
    console.log('[ToolGallery] Stopping tool:', tool.name);
    const result = await window.electronAPI.stopTool(tool.id);
    if (!result.success) {
      console.error('[ToolGallery] Failed to stop:', result.error);
    }
  }, []);

  const handleConfigure = useCallback((tool: Tool) => {
    console.log('[ToolGallery] Configure tool:', tool.name);
    // Placeholder: will open config in future phase
  }, []);

  const handleDelete = useCallback(async (tool: Tool) => {
    console.log('[ToolGallery] Deleting tool:', tool.name);
    const result = await window.electronAPI.deleteTool(tool.id);
    if (result.success) {
      setTools((prev) => prev.filter((t) => t.id !== tool.id));
    } else {
      console.error('[ToolGallery] Failed to delete:', result.error);
    }
  }, []);

  const refreshTools = useCallback(async () => {
    setLoading(true);
    try {
      const toolList = await window.electronAPI.listTools();
      setTools(toolList);
    } catch (error) {
      console.error('[ToolGallery] Failed to refresh tools:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="tool-gallery">
      <div className="tool-gallery-header">
        <h2>Tool Gallery</h2>
        <div className="tool-gallery-actions">
          <button className="refresh-button" onClick={refreshTools} title="Refresh">
            {'\u{1F504}'}
          </button>
          <span className="tool-count">{tools.length} tools</span>
        </div>
      </div>
      <div className="tool-gallery-content">
        {loading ? (
          <div className="tool-gallery-loading">Loading tools...</div>
        ) : (
          <ToolGrid
            tools={tools}
            onToolClick={handleToolClick}
            onToolContextMenu={handleContextMenu}
          />
        )}
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
