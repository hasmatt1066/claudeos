import React from 'react';

interface LoadingScreenProps {
  status?: string;
}

function LoadingScreen({ status = 'Initializing...' }: LoadingScreenProps): React.JSX.Element {
  return (
    <div className="loading-screen">
      <div className="loading-screen-content">
        <div className="loading-screen-logo">ClaudeOS</div>
        <div className="loading-screen-spinner">
          <div className="spinner"></div>
        </div>
        <div className="loading-screen-status">{status}</div>
      </div>
    </div>
  );
}

export default LoadingScreen;
