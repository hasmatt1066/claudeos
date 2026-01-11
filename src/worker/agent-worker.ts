/**
 * Agent Worker Process
 *
 * This utility process handles Claude Agent SDK operations,
 * isolated from the main process for stability and performance.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';

interface WorkerMessage {
  type: string;
  payload?: unknown;
}

interface ChatPayload {
  message: string;
  requestId?: string;
  conversationId?: string;
  sessionId?: string;
}

let messagePort: MessagePort | null = null;
let currentSessionId: string | null = null;

// Handle messages from parent (main process)
process.parentPort.on('message', (event) => {
  const message = event.data as WorkerMessage;

  if (message.type === 'init' && event.ports[0]) {
    // Initialize MessagePort for communication
    messagePort = event.ports[0];
    messagePort.on('message', handleMessage);
    messagePort.start();
    console.log('[Agent Worker] Initialized with MessagePort');

    // Send ready message
    sendMessage({ type: 'ready' });
  }
});

function handleMessage(event: MessageEvent): void {
  const message = event.data as WorkerMessage;
  console.log('[Agent Worker] Received:', message.type);

  switch (message.type) {
    case 'chat':
      handleChat(message.payload as ChatPayload);
      break;

    case 'ping':
      sendMessage({ type: 'pong' });
      break;

    default:
      console.log('[Agent Worker] Unknown message type:', message.type);
  }
}

async function handleChat(payload: ChatPayload): Promise<void> {
  const { message, requestId, sessionId } = payload;
  console.log('[Agent Worker] Processing chat:', message);

  try {
    // Notify renderer that streaming is starting
    sendMessage({
      type: 'chat:stream:start',
      payload: { requestId }
    });

    const response = query({
      prompt: message,
      options: {
        model: 'claude-sonnet-4-20250514',
        allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
        permissionMode: 'acceptEdits',
        cwd: process.cwd(),
        resume: sessionId || undefined
      }
    });

    let accumulatedText = '';

    for await (const msg of response) {
      // Handle session initialization
      if (msg.type === 'system' && msg.subtype === 'init') {
        currentSessionId = msg.session_id;
        console.log('[Agent Worker] Session initialized:', currentSessionId);
        sendMessage({
          type: 'chat:session',
          payload: { sessionId: currentSessionId, requestId }
        });
      }

      // Handle assistant messages (streaming content)
      if (msg.type === 'assistant' && msg.message?.content) {
        for (const block of msg.message.content) {
          if (block.type === 'text') {
            accumulatedText += block.text;
            sendMessage({
              type: 'chat:stream:chunk',
              payload: { content: block.text, requestId }
            });
          }
          if (block.type === 'tool_use') {
            console.log('[Agent Worker] Tool use:', block.name, block.input);
            sendMessage({
              type: 'chat:tool',
              payload: {
                tool: block.name,
                input: block.input,
                requestId
              }
            });
          }
        }
      }

      // Handle result (completion)
      if (msg.type === 'result') {
        console.log('[Agent Worker] Result received');
        console.log('[Agent Worker] Cost:', msg.total_cost_usd);
        console.log('[Agent Worker] Usage:', msg.usage);

        sendMessage({
          type: 'chat:stream:end',
          payload: {
            requestId,
            sessionId: currentSessionId,
            cost: msg.total_cost_usd,
            usage: msg.usage
          }
        });
      }
    }

    // Send final response for backwards compatibility
    sendMessage({
      type: 'chat:response',
      payload: {
        success: true,
        content: accumulatedText,
        requestId,
        sessionId: currentSessionId
      }
    });

  } catch (error) {
    console.error('[Agent Worker] Chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    sendMessage({
      type: 'chat:stream:error',
      payload: { error: errorMessage, requestId }
    });

    sendMessage({
      type: 'chat:response',
      payload: {
        success: false,
        content: `Error: ${errorMessage}`,
        requestId
      }
    });
  }
}

function sendMessage(message: WorkerMessage): void {
  if (!messagePort) {
    console.error('[Agent Worker] Cannot send: MessagePort not initialized');
    return;
  }
  messagePort.postMessage(message);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[Agent Worker] Uncaught exception:', error);
  sendMessage({
    type: 'error',
    payload: { message: error.message }
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('[Agent Worker] Unhandled rejection:', reason);
});

console.log('[Agent Worker] Process started');
