import React, { useState, useCallback } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { MessageData } from './Message';
import './Chat.css';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function Chat(): React.JSX.Element {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = useCallback((content: string) => {
    // Add user message
    const userMessage: MessageData = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate typing delay and add placeholder response
    setTimeout(() => {
      const assistantMessage: MessageData = {
        id: generateId(),
        role: 'assistant',
        content: "I'm ClaudeOS. I'll be connected soon!",
        timestamp: new Date()
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1000);
  }, []);

  return (
    <div className="chat-container">
      <MessageList messages={messages} isTyping={isTyping} />
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  );
}

export default Chat;
