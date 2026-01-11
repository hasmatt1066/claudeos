import React from 'react';

export interface MessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isError?: boolean;
}

interface MessageProps {
  message: MessageData;
}

function Message({ message }: MessageProps): React.JSX.Element {
  const isUser = message.role === 'user';
  const bubbleClasses = [
    'message-bubble',
    message.isStreaming ? 'streaming' : '',
    message.isError ? 'error' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className={bubbleClasses}>
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
