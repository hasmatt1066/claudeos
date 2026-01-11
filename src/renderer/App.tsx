import React from 'react';
import Chat from './components/Chat';

function App(): React.JSX.Element {
  return (
    <div className="app">
      <header className="app-header">
        <h1>ClaudeOS</h1>
      </header>
      <main className="app-main">
        <Chat />
      </main>
    </div>
  );
}

export default App;
