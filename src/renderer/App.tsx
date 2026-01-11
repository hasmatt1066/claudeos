import React, { useState, useEffect, useCallback } from 'react';
import Chat from './components/Chat';
import LearningWindow from './components/LearningWindow';
import Navigation, { View } from './components/Navigation';
import ToolGallery from './components/ToolGallery';
import Settings from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingScreen from './components/LoadingScreen';

function App(): React.JSX.Element {
  const [currentView, setCurrentView] = useState<View>('chat');
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chatKey, setChatKey] = useState(0);

  // Listen for app events
  useEffect(() => {
    const unsubscribeNew = window.electronAPI.onNewConversation(() => {
      // Reset chat by changing key
      setChatKey((prev) => prev + 1);
      setCurrentView('chat');
    });

    const unsubscribeSettings = window.electronAPI.onOpenSettings(() => {
      setShowSettings(true);
    });

    return () => {
      unsubscribeNew();
      unsubscribeSettings();
    };
  }, []);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Handle escape key for closing panels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSettings) {
          setShowSettings(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettings]);

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  if (isLoading) {
    return <LoadingScreen status="Starting ClaudeOS..." />;
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <h1>ClaudeOS</h1>
          <button
            className="app-settings-btn"
            onClick={() => setShowSettings(true)}
            title="Settings (Ctrl+,)"
          >
            ⚙️
          </button>
        </header>
        <main className="app-main">
          <Navigation currentView={currentView} onViewChange={setCurrentView} />
          <div className="app-content">
            <ErrorBoundary>
              {currentView === 'chat' && (
                <>
                  <Chat key={chatKey} />
                  <LearningWindow />
                </>
              )}
              {currentView === 'gallery' && <ToolGallery />}
            </ErrorBoundary>
          </div>
        </main>
        {showSettings && <Settings onClose={handleCloseSettings} />}
      </div>
    </ErrorBoundary>
  );
}

export default App;
