import React, { useState, useCallback, useEffect, useRef } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { MessageData } from './Message';
import type { StreamChunk } from '../../../types/electron';
import './Chat.css';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function Chat(): React.JSX.Element {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const streamingContentRef = useRef('');

  // Set up streaming listener
  useEffect(() => {
    const unsubscribe = window.electronAPI.onStreamChunk((chunk: StreamChunk) => {
      console.log('[Chat] Stream chunk:', chunk.type);

      switch (chunk.type) {
        case 'start':
          streamingContentRef.current = '';
          setStreamingContent('');
          setIsTyping(false);
          break;

        case 'chunk':
          if (chunk.content) {
            streamingContentRef.current += chunk.content;
            setStreamingContent(streamingContentRef.current);
          }
          break;

        case 'tool':
          console.log('[Chat] Tool use:', chunk.tool, chunk.input);
          break;

        case 'session':
          if (chunk.sessionId) {
            console.log('[Chat] Session:', chunk.sessionId);
            setSessionId(chunk.sessionId);
          }
          break;

        case 'end':
          console.log('[Chat] Stream end, cost:', chunk.cost, 'usage:', chunk.usage);
          // The final message will be added when the sendMessage promise resolves
          break;

        case 'error':
          console.error('[Chat] Stream error:', chunk.error);
          break;
      }
    });

    return unsubscribe;
  }, []);

  const handleSend = useCallback(
    async (content: string) => {
      // Add user message
      const userMessage: MessageData = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);
      streamingContentRef.current = '';
      setStreamingContent('');

      try {
        // Send message via IPC to main process
        const result = await window.electronAPI.sendMessage(content, sessionId ?? undefined);

        // Update session ID if returned
        if (result.sessionId) {
          setSessionId(result.sessionId);
        }

        // Add final assistant message
        const assistantMessage: MessageData = {
          id: generateId(),
          role: 'assistant',
          content: result.success ? result.response : `Error: ${result.response}`,
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
        setStreamingContent('');
        streamingContentRef.current = '';
      }
    },
    [sessionId]
  );

  return (
    <div className="chat-container">
      <MessageList
        messages={messages}
        isTyping={isTyping}
        streamingContent={streamingContent}
      />
      <ChatInput onSend={handleSend} disabled={isTyping || streamingContent.length > 0} />
    </div>
  );
}

export default Chat;
