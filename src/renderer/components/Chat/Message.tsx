import React from 'react';

export interface MessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface MessageProps {
  message: MessageData;
}

function Message({ message }: MessageProps): React.JSX.Element {
  const isUser = message.role === 'user';

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className={`message-bubble ${message.isStreaming ? 'streaming' : ''}`}>
        <div className="message-content">
          {message.content}
          {message.isStreaming && <span className="cursor-blink">|</span>}
        </div>
        {!message.isStreaming && (
          <div className="message-time">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Message;
