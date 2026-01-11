/**
 * Agent Worker Process
 *
 * This utility process handles Claude Agent SDK operations,
 * isolated from the main process for stability and performance.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import * as path from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { MessagePortMain } from 'electron';
import { contextBrain } from './services/context-brain';

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

interface ContextAddPayload {
  path: string;
  text: string;
  type: string;
  requestId?: string;
}

interface ContextSearchPayload {
  query: string;
  limit?: number;
  requestId?: string;
}

let messagePort: MessagePortMain | null = null;
let currentSessionId: string | null = null;
let contextBrainInitialized = false;
let dataPath: string = '';
let workspacePath: string = '';

/**
 * Initialize the user workspace directory
 * This is where the agent operates - isolated from ClaudeOS source code
 */
function initWorkspace(): void {
  if (workspacePath) return;

  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  workspacePath = path.join(homeDir, 'ClaudeOS', 'workspace');

  // Create workspace directory if it doesn't exist
  if (!existsSync(workspacePath)) {
    mkdirSync(workspacePath, { recursive: true });
    console.log('[Agent Worker] Created workspace directory:', workspacePath);
  } else {
    console.log('[Agent Worker] Using workspace directory:', workspacePath);
  }

  // Create or update CLAUDE.md to guide the agent
  const claudeMdPath = path.join(workspacePath, 'CLAUDE.md');
  if (!existsSync(claudeMdPath)) {
    const claudeMdContent = `# ClaudeOS Workspace

This is your personal workspace managed by ClaudeOS.

## Important Guidelines

- **This is a sandboxed workspace.** All projects you create should be built here.
- **Do NOT read or modify files outside this directory.** Your working directory is: \`${workspacePath}\`
- **Do NOT explore parent directories** or other locations on the system.
- **When asked to build something**, create it as a new subdirectory here (e.g., \`./task-tracker/\`, \`./my-app/\`).

## Directory Structure

Each project you create should be in its own subdirectory:

\`\`\`
workspace/
├── CLAUDE.md (this file)
├── project-1/
├── project-2/
└── ...
\`\`\`

## What You Can Do

- Create new projects in subdirectories
- Read and write files within this workspace
- Run commands within this workspace
- Build web apps, scripts, tools, and anything the user requests

## What You Should NOT Do

- Read files from \`~/Desktop/\`, \`~/Documents/\`, or other personal directories
- Explore the ClaudeOS application source code
- Access system configuration files
- Read \`.claude.json\` or other Claude Code configuration files

Focus on building what the user asks for, right here in this workspace.
`;
    writeFileSync(claudeMdPath, claudeMdContent, 'utf-8');
    console.log('[Agent Worker] Created CLAUDE.md in workspace');
  }
}

/**
 * Initialize the context brain
 */
async function initContextBrain(): Promise<void> {
  if (contextBrainInitialized) return;

  try {
    // Get home directory from environment or default
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    dataPath = path.join(homeDir, 'ClaudeOS', 'data', 'context-brain');

    await contextBrain.initialize(dataPath);
    contextBrainInitialized = true;
    console.log('[Agent Worker] Context brain initialized at:', dataPath);
  } catch (error) {
    console.error('[Agent Worker] Failed to initialize context brain:', error);
  }
}

// Handle messages from parent (main process)
process.parentPort.on('message', (event) => {
  const message = event.data as WorkerMessage;

  if (message.type === 'init' && event.ports[0]) {
    // Initialize MessagePort for communication
    messagePort = event.ports[0] as MessagePortMain;
    messagePort.on('message', (evt) => handleMessage(evt as unknown as MessageEvent));
    messagePort.start();
    console.log('[Agent Worker] Initialized with MessagePort');

    // Initialize workspace directory (sync, fast)
    initWorkspace();

    // Initialize context brain (async, don't block)
    initContextBrain().catch((err) => {
      console.error('[Agent Worker] Context brain init error:', err);
    });

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

    case 'context:add':
      handleContextAdd(message.payload as ContextAddPayload);
      break;

    case 'context:search':
      handleContextSearch(message.payload as ContextSearchPayload);
      break;

    case 'context:count':
      handleContextCount(message.payload as { requestId?: string });
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

    // Retrieve relevant context from the context brain
    let enhancedPrompt = message;
    if (contextBrainInitialized) {
      try {
        const relevantContext = await contextBrain.search(message, 5);
        if (relevantContext.length > 0) {
          const contextString = relevantContext
            .filter((doc) => doc.fileType !== 'system')
            .map((doc) => `[From ${doc.filePath}]: ${doc.text.slice(0, 500)}`)
            .join('\n\n');

          if (contextString) {
            enhancedPrompt = `Context from user's documents:\n${contextString}\n\nUser message: ${message}`;
            console.log('[Agent Worker] Added context from', relevantContext.length, 'documents');
          }
        }
      } catch (contextError) {
        console.warn('[Agent Worker] Context retrieval failed:', contextError);
      }
    }

    // Ensure workspace is initialized before agent runs
    if (!workspacePath) {
      initWorkspace();
    }

    // System prompt to constrain agent to workspace
    const systemPrompt = `You are an assistant operating within ClaudeOS, a personal computing environment.

CRITICAL: You are sandboxed to this workspace directory: ${workspacePath}

Rules:
1. ONLY read and write files within the workspace directory
2. Do NOT explore or read files outside the workspace (no ~/Desktop, ~/Documents, ~/.claude.json, etc.)
3. Do NOT try to understand "the codebase" by exploring parent directories
4. When asked to build something, create it as a new subdirectory in this workspace
5. This is a FRESH workspace for user projects - treat it as empty unless you see existing project folders

If the workspace appears empty, that's expected. Just start building what the user asks for.`;

    const response = query({
      prompt: enhancedPrompt,
      options: {
        model: 'claude-sonnet-4-20250514',
        allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
        permissionMode: 'acceptEdits',
        cwd: workspacePath,
        systemPrompt,
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

/**
 * Handle adding a document to the context brain
 */
async function handleContextAdd(payload: ContextAddPayload): Promise<void> {
  const { path: filePath, text, type: fileType, requestId } = payload;

  try {
    if (!contextBrainInitialized) {
      await initContextBrain();
    }

    await contextBrain.addDocument(filePath, text, fileType);

    sendMessage({
      type: 'context:add:result',
      payload: { success: true, requestId }
    });
  } catch (error) {
    console.error('[Agent Worker] Context add error:', error);
    sendMessage({
      type: 'context:add:result',
      payload: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId
      }
    });
  }
}

/**
 * Handle searching the context brain
 */
async function handleContextSearch(payload: ContextSearchPayload): Promise<void> {
  const { query: searchQuery, limit = 10, requestId } = payload;

  try {
    if (!contextBrainInitialized) {
      await initContextBrain();
    }

    const results = await contextBrain.search(searchQuery, limit);

    sendMessage({
      type: 'context:search:result',
      payload: { success: true, results, requestId }
    });
  } catch (error) {
    console.error('[Agent Worker] Context search error:', error);
    sendMessage({
      type: 'context:search:result',
      payload: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results: [],
        requestId
      }
    });
  }
}

/**
 * Handle getting document count
 */
async function handleContextCount(payload: { requestId?: string }): Promise<void> {
  const { requestId } = payload;

  try {
    if (!contextBrainInitialized) {
      await initContextBrain();
    }

    const count = await contextBrain.count();

    sendMessage({
      type: 'context:count:result',
      payload: { success: true, count, requestId }
    });
  } catch (error) {
    console.error('[Agent Worker] Context count error:', error);
    sendMessage({
      type: 'context:count:result',
      payload: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0,
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
