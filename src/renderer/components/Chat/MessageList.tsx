import React, { useEffect, useRef } from 'react';
import Message, { MessageData } from './Message';

interface MessageListProps {
  messages: MessageData[];
  isTyping: boolean;
}

function MessageList({ messages, isTyping }: MessageListProps): React.JSX.Element {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="message-list message-list-empty">
        <div className="empty-state">Start a conversation...</div>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <Message key={msg.id} message={msg} />
      ))}
      {isTyping && (
        <div className="message message-assistant">
          <div className="message-bubble typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;
