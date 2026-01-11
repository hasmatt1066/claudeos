import React, { useState } from 'react';
import Chat from './components/Chat';
import LearningWindow from './components/LearningWindow';
import Navigation, { View } from './components/Navigation';
import ToolGallery from './components/ToolGallery';

function App(): React.JSX.Element {
  const [currentView, setCurrentView] = useState<View>('chat');

  return (
    <div className="app">
      <header className="app-header">
        <h1>ClaudeOS</h1>
      </header>
      <main className="app-main">
        <Navigation currentView={currentView} onViewChange={setCurrentView} />
        <div className="app-content">
          {currentView === 'chat' && (
            <>
              <Chat />
              <LearningWindow />
            </>
          )}
          {currentView === 'gallery' && <ToolGallery />}
        </div>
      </main>
    </div>
  );
}

export default App;
