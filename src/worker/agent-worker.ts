/**
 * Agent Worker Process
 *
 * This utility process handles Claude Agent SDK operations,
 * isolated from the main process for stability and performance.
 */

interface WorkerMessage {
  type: string;
  payload?: unknown;
}

interface ChatPayload {
  message: string;
  requestId?: string;
  conversationId?: string;
}

let messagePort: MessagePort | null = null;

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

function handleChat(payload: ChatPayload): void {
  // Placeholder - will use Claude Agent SDK in Phase 6
  console.log('[Agent Worker] Processing chat:', payload.message);

  // Simulate processing delay
  setTimeout(() => {
    sendMessage({
      type: 'chat:response',
      payload: {
        success: true,
        content: `[Worker] Received your message: "${payload.message}". Agent SDK integration coming in Phase 6!`,
        requestId: payload.requestId,
        conversationId: payload.conversationId
      }
    });
  }, 300);
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
