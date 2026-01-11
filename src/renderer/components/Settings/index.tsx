import React, { useState, useEffect } from 'react';
import './Settings.css';

interface SettingsData {
  homePath: string;
  version: string;
  platform: string;
  contextCount: number;
}

interface SettingsProps {
  onClose: () => void;
}

function Settings({ onClose }: SettingsProps): React.JSX.Element {
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [version, platform, toolsDir, contextResult] = await Promise.all([
          window.electronAPI.getVersion(),
          window.electronAPI.getPlatform(),
          window.electronAPI.getToolsDirectory(),
          window.electronAPI.contextCount()
        ]);

        // Derive home path from tools directory
        const homePath = toolsDir.replace(/[/\\]tools$/, '');

        setSettings({
          homePath,
          version,
          platform,
          contextCount: contextResult.success ? contextResult.count : 0
        });
      } catch (error) {
        console.error('[Settings] Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (loading) {
    return (
      <div className="settings-overlay" onClick={onClose}>
        <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
          <div className="settings-loading">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose} title="Close (Esc)">
            ✕
          </button>
        </div>

        <div className="settings-content">
          <section className="settings-section">
            <h3>ClaudeOS Home</h3>
            <code className="settings-path">{settings?.homePath || 'Not configured'}</code>
            <p className="settings-hint">Tools, inbox, and context files are stored here</p>
          </section>

          <section className="settings-section">
            <h3>Context Brain</h3>
            <p className="settings-stat">
              <span className="settings-stat-value">{settings?.contextCount || 0}</span>
              <span className="settings-stat-label">documents indexed</span>
            </p>
          </section>

          <section className="settings-section">
            <h3>Keyboard Shortcuts</h3>
            <div className="settings-shortcuts">
              <div className="settings-shortcut">
                <kbd>{settings?.platform === 'darwin' ? '⌘' : 'Ctrl'}+N</kbd>
                <span>New conversation</span>
              </div>
              <div className="settings-shortcut">
                <kbd>{settings?.platform === 'darwin' ? '⌘' : 'Ctrl'}+,</kbd>
                <span>Settings</span>
              </div>
              <div className="settings-shortcut">
                <kbd>Esc</kbd>
                <span>Close panel</span>
              </div>
            </div>
          </section>

          <section className="settings-section settings-about">
            <h3>About</h3>
            <p className="settings-version">ClaudeOS v{settings?.version || '0.0.0'}</p>
            <p className="settings-tagline">
              Claude as your operating system layer. Talk to your computer. It builds what you need.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Settings;
