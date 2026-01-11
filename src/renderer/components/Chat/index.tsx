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

  const handleSend = useCallback(async (content: string) => {
    // Add user message
    const userMessage: MessageData = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      // Send message via IPC to main process
      const result = await window.electronAPI.sendMessage(content);

      const assistantMessage: MessageData = {
        id: generateId(),
        role: 'assistant',
        content: result.success ? result.response : 'Sorry, something went wrong.',
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);

      const errorMessage: MessageData = {
        id: generateId(),
        role: 'assistant',
        content: 'Failed to communicate with the main process.',
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  }, []);

  return (
    <div className="chat-container">
      <MessageList messages={messages} isTyping={isTyping} />
      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  );
}

export default Chat;
