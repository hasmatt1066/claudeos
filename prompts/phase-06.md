# Phase 6: Agent SDK Integration

## Objective

Integrate the Claude Agent SDK into the worker process so chat actually talks to Claude.

## Acceptance Criteria

- [ ] @anthropic-ai/claude-agent-sdk installed
- [ ] Agent SDK runs in worker process
- [ ] User message → Claude response flow works
- [ ] Responses stream to renderer (tokens appear progressively)
- [ ] Tool use is logged to console (visible but not displayed in UI yet)
- [ ] Session ID captured and stored
- [ ] Sessions can be resumed (basic, not full UI)
- [ ] Errors handled gracefully (shown in chat)
- [ ] Cost/token info logged (not displayed yet)
- [ ] Works with Claude Code credentials (no API key needed)

## Technical Notes

### Install SDK

```bash
npm install @anthropic-ai/claude-agent-sdk
```

### Worker Implementation

```typescript
// src/worker/agent-worker.ts
import { query } from '@anthropic-ai/claude-agent-sdk';

let messagePort: MessagePort | null = null;
let currentSession: string | null = null;

async function handleChat(message: string) {
  try {
    const response = query({
      prompt: message,
      options: {
        model: 'claude-sonnet-4-20250514',
        allowedTools: ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep'],
        permissionMode: 'acceptEdits',
        cwd: process.cwd()
      }
    });

    for await (const msg of response) {
      if (msg.type === 'system' && msg.subtype === 'init') {
        currentSession = msg.session_id;
        messagePort?.postMessage({ type: 'session', sessionId: currentSession });
      }

      if (msg.type === 'assistant' && msg.message?.content) {
        for (const block of msg.message.content) {
          if (block.type === 'text') {
            messagePort?.postMessage({
              type: 'chunk',
              content: block.text
            });
          }
          if (block.type === 'tool_use') {
            messagePort?.postMessage({
              type: 'tool',
              tool: block.name,
              input: block.input
            });
          }
        }
      }

      if (msg.type === 'result') {
        messagePort?.postMessage({
          type: 'complete',
          cost: msg.total_cost_usd,
          tokens: msg.usage
        });
      }
    }
  } catch (error) {
    messagePort?.postMessage({
      type: 'error',
      message: error.message
    });
  }
}
```

### Renderer Streaming

Update Chat to handle streaming:
- On 'chunk' message, append to current assistant message
- On 'complete', finalize the message
- On 'error', show error in chat

### Streaming State

```typescript
const [streamingContent, setStreamingContent] = useState('');
const [isStreaming, setIsStreaming] = useState(false);

// On chunk
setStreamingContent(prev => prev + chunk);

// On complete
setMessages(prev => [...prev, { role: 'assistant', content: streamingContent }]);
setStreamingContent('');
setIsStreaming(false);
```

## Out of Scope

- Learning window display (Phase 7)
- Tool gallery (Phase 8)
- Context brain integration (Phase 10)

## Files to Modify

- package.json (add @anthropic-ai/claude-agent-sdk)
- src/worker/agent-worker.ts (SDK integration)
- src/main/ipc/chat.ts (handle new message types)
- src/preload/index.ts (streaming callbacks)
- src/renderer/components/Chat/* (streaming display)

## Completion

When you can chat with Claude and see streaming responses, output:

```
<promise>COMPLETE</promise>
```
